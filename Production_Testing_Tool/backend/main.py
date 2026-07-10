from fastapi import FastAPI, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
import re
import json
import os
import shutil
import socket
import csv
from io import StringIO
from pathlib import Path

from pyngrok import ngrok
from contextlib import asynccontextmanager
import sys
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:8000")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Try starting an ngrok tunnel
    try:
        ngrok.set_auth_token("3FTu8sTa45XdZnv3s5qjJjtsR8O_5P93vaxuGpjxQFgArZjPd")
        public_url = ngrok.connect(8000).public_url
        app.state.public_url = public_url
        print(f"Ngrok Tunnel active: {public_url}")
    except Exception as e:
        print(f"Ngrok tunneling failed (are you offline?): {e}")
        app.state.public_url = None

    if getattr(sys, 'frozen', False):
        threading.Thread(target=open_browser, daemon=True).start()
    yield


from dotenv import load_dotenv
from supabase import create_client, Client
import datetime

if getattr(sys, 'frozen', False):
    env_path = os.path.join(sys._MEIPASS, '.env')
else:
    env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print('Failed to init Supabase:', e)

def push_to_cloud(new_profiles=None, new_configs=None, new_target_releases=None):
    if not supabase: return
    try:
        p = new_profiles if new_profiles is not None else load_profiles()
        c = new_configs if new_configs is not None else load_configs()
        t = new_target_releases if new_target_releases is not None else load_target_releases()
        
        rc_text = None
        if os.path.exists(os.path.join(DATA_DIR, "router_config.txt")):
            with open(os.path.join(DATA_DIR, "router_config.txt"), "r", encoding="utf-8") as f:
                rc_text = f.read()

        supabase.table('quench_cloud_sync').upsert({
            'id': 1,
            'profiles': p,
            'configs': c,
            'target_releases': t,
            'router_config': rc_text,
            'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
        print('Successfully pushed to Supabase cloud.')
    except Exception as e:
        print(f'Supabase push failed: {e}')

def pull_from_cloud():
    if not supabase: return
    try:
        res = supabase.table('quench_cloud_sync').select('*').eq('id', 1).execute()
        if res.data and len(res.data) > 0:
            data = res.data[0]
            if data.get('profiles'):
                with open(PROFILES_FILE, 'w', encoding='utf-8') as f:
                    import json
                    json.dump(data['profiles'], f, indent=2)
            if data.get('configs'):
                with open(CONFIGS_FILE, 'w', encoding='utf-8') as f:
                    import json
                    json.dump(data['configs'], f, indent=2)
            if data.get('target_releases'):
                with open(TARGET_RELEASES_FILE, 'w', encoding='utf-8') as f:
                    import json
                    json.dump(data['target_releases'], f, indent=2)
            if data.get('router_config') is not None:
                with open(os.path.join(DATA_DIR, "router_config.txt"), 'w', encoding='utf-8') as f:
                    f.write(data['router_config'])
            print('Successfully pulled from Supabase cloud.')
    except Exception as e:
        print(f'Supabase pull failed: {e}')

app = FastAPI(title="Commissioning Tool Backend API", lifespan=lifespan)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import sys

if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    BUNDLE_DIR = sys._MEIPASS
    DATA_DIR = os.path.dirname(sys.executable)
else:
    # Running in normal Python environment
    BUNDLE_DIR = os.path.dirname(__file__)
    DATA_DIR = os.path.dirname(__file__)

# Bundled read-only files
HTML_PATH = os.path.abspath(os.path.join(BUNDLE_DIR, "..", "ADLB_Commissioning_WebApp.html"))
if getattr(sys, 'frozen', False):
    HTML_PATH = os.path.join(BUNDLE_DIR, "ADLB_Commissioning_WebApp.html")
REFERENCES_DIR = os.path.join(BUNDLE_DIR, "references")
FRONTEND_DIST_DIR = os.path.join(BUNDLE_DIR, "dist")

# Writable data files (next to executable or in backend dir)
PROFILES_FILE = os.path.join(DATA_DIR, "profiles.json")
CONFIGS_FILE = os.path.join(DATA_DIR, "configs.json")
TARGET_RELEASES_FILE = os.path.join(DATA_DIR, "target_releases.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
# Centralize RESULTS in OneDrive for free team syncing
_onedrive_root = Path.home() / "OneDrive - Ador Digatron Pvt. Ltd/Commissioning_Results"
if _onedrive_root.parent.exists():
    _onedrive_root.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR = str(_onedrive_root / "results")
    
    # Migrate any existing local results to the new OneDrive folder
    local_results = os.path.join(DATA_DIR, "results")
    if os.path.exists(local_results) and local_results != RESULTS_DIR:
        try:
            for item in os.listdir(local_results):
                src = os.path.join(local_results, item)
                dst = os.path.join(RESULTS_DIR, item)
                if not os.path.exists(dst):
                    shutil.move(src, dst)
        except Exception as e:
            print("Migration to OneDrive failed:", e)
else:
    RESULTS_DIR = os.path.join(DATA_DIR, "results")

os.makedirs(RESULTS_DIR, exist_ok=True)
if not getattr(sys, 'frozen', False):
    os.makedirs(REFERENCES_DIR, exist_ok=True)

# Mount references directory
app.mount("/references", StaticFiles(directory=REFERENCES_DIR), name="references")

# We cannot mount a single static directory for uploads anymore because they are nested in results/charger_id/images
# We will create a dynamic route to serve them

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def parse_html_data():
    """Parses checks, phases, and profiles from the original HTML file."""
    if not os.path.exists(HTML_PATH):
        return [], [], [], {}
    
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    checks = []
    phases = []
    profiles = []
    
    checks_match = re.search(r"const CHECKS\s*=\s*(\[.*?\]);", content)
    if checks_match:
        try:
            checks = json.loads(checks_match.group(1))
        except Exception as e:
            print("Error parsing CHECKS:", e)
            
    phases_match = re.search(r"const PHASES\s*=\s*(\[.*?\]);", content)
    if phases_match:
        try:
            phases = json.loads(phases_match.group(1))
        except Exception as e:
            print("Error parsing PHASES:", e)
            
    profiles_match = re.search(r"let PROFILES\s*=\s*(\[.*?\]);", content, re.DOTALL)
    if profiles_match:
        try:
            profiles = json.loads(profiles_match.group(1))
        except Exception as e:
            print("Error parsing PROFILES:", e)
            
    images = {}
    images_match = re.search(r"const IMAGES\s*=\s*(\{.*?\});", content, re.DOTALL)
    if images_match:
        try:
            images = json.loads(images_match.group(1))
        except Exception as e:
            print("Error parsing IMAGES:", e)
            
    return checks, phases, profiles, images

# Initialize local JSON database files if they don't exist
if not os.path.exists(PROFILES_FILE):
    _, _, initial_profiles, _ = parse_html_data()
    with open(PROFILES_FILE, "w", encoding="utf-8") as f:
        json.dump(initial_profiles, f, indent=2)

@app.get("/api/config")
def get_config():
    """Returns the parsed configuration containing checks, phases, profiles, configs and target releases."""
    checks, phases, _, images = parse_html_data()
    with open(PROFILES_FILE, "r", encoding="utf-8") as f:
        profiles = json.load(f)
    return {
        "phases": phases,
        "checks": checks,
        "profiles": profiles,
        "images": images,
        "configs": load_configs(),
        "target_releases": load_target_releases(),
        "local_ip": getattr(app.state, "public_url", None) or get_local_ip()
    }


# --- CHARGER API ENDPOINTS ---

class LoginRequest(BaseModel):
    username: str
    password: str

def load_users(users_file):
    """Load users, migrating legacy flat {user: password} format to {user: {password, role}}."""
    users = {}
    if os.path.exists(users_file):
        with open(users_file, "r", encoding="utf-8") as f:
            raw = json.load(f)
        migrated = False
        for username, value in raw.items():
            if isinstance(value, dict) and "password" in value:
                users[username] = value
            else:
                # legacy format: value is the password
                users[username] = {"password": value, "role": "superuser"}
                migrated = True
        if migrated:
            with open(users_file, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2)
    else:
        # Create default users if file is missing
        users = {
            "saurabh": {"password": "1111", "role": "superuser"},
            "visesh": {"password": "1111", "role": "operator"},
            "operator": {"password": "0000", "role": "operator"}
        }
        try:
            with open(users_file, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2)
        except Exception:
            pass
    return users


@app.post("/api/login")
def login(data: LoginRequest):
    users_file = os.path.join(DATA_DIR, "users.json")
    users = load_users(users_file)
    user = users.get(data.username)
    if user and user.get("password") == data.password:
        return {
            "status": "success",
            "token": "session_" + secrets.token_hex(16),
            "role": user.get("role", "operator")
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/users")
def get_users():
    users_file = os.path.join(DATA_DIR, "users.json")
    return load_users(users_file)

@app.post("/api/users")
def update_users(users_data: dict):
    users_file = os.path.join(DATA_DIR, "users.json")
    with open(users_file, "w", encoding="utf-8") as f:
        json.dump(users_data, f, indent=2)
    return {"status": "success"}

class ChargerCreate(BaseModel):
    charger_id: str
    profile_id: str


# --- PROFILE CRUD ---

class Profile(BaseModel):
    profile_id: str
    name: str
    num_modules: str = ""
    maxKW: str = ""
    maxA: str = ""
    dlbMode: str = ""
    ct_primary_A: str = ""
    dc_shunt_A: str = ""
    ocpp_model: str = ""
    ocpp_vendor: str = ""
    protocol: str = ""
    num_connectors: str = ""
    max_power_limit_kw: str = ""
    max_current_limit_a: str = ""
    notes: str = ""
    example: bool = False


def load_profiles():
    if os.path.exists(PROFILES_FILE):
        with open(PROFILES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_profiles(profiles):
    push_to_cloud(new_profiles=profiles)
    with open(PROFILES_FILE, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=2)


@app.get("/api/profiles")
def list_profiles():
    return load_profiles()


@app.post("/api/profiles")
def create_profile(profile: Profile):
    profiles = load_profiles()
    if any(p.get("profile_id") == profile.profile_id for p in profiles):
        raise HTTPException(status_code=400, detail="Profile ID already exists")
    profiles.append(profile.model_dump())
    save_profiles(profiles)
    return {"status": "success", "profile": profile.model_dump()}


@app.put("/api/profiles/{profile_id}")
def update_profile(profile_id: str, profile: Profile):
    profiles = load_profiles()
    for i, p in enumerate(profiles):
        if p.get("profile_id") == profile_id:
            profiles[i] = profile.model_dump()
            save_profiles(profiles)
            return {"status": "success", "profile": profile.model_dump()}
    raise HTTPException(status_code=404, detail="Profile not found")


@app.delete("/api/profiles/{profile_id}")
def delete_profile(profile_id: str):
    profiles = load_profiles()
    filtered = [p for p in profiles if p.get("profile_id") != profile_id]
    if len(filtered) == len(profiles):
        raise HTTPException(status_code=404, detail="Profile not found")
    save_profiles(filtered)
    return {"status": "success"}


# --- DEFAULT CONFIGS CRUD ---

def load_configs():
    if os.path.exists(CONFIGS_FILE):
        with open(CONFIGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_configs(configs):
    push_to_cloud(new_configs=configs)
    with open(CONFIGS_FILE, "w", encoding="utf-8") as f:
        json.dump(configs, f, indent=2)


@app.get("/api/configs")
def list_configs():
    return load_configs()


ROUTER_CONFIG_PATH = os.path.join(DATA_DIR, "router_config.txt")

@app.get("/api/configs/router")
def get_router_config():
    if os.path.exists(ROUTER_CONFIG_PATH):
        return FileResponse(ROUTER_CONFIG_PATH, filename="router_config.txt")
    raise HTTPException(status_code=404, detail="Router config not found")

@app.post("/api/configs/router")
async def upload_router_config(file: UploadFile = File(...)):
    with open(ROUTER_CONFIG_PATH, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Sync the uploaded router config to Supabase!
    push_to_cloud()
    return {"status": "success"}

@app.get("/api/configs/{profile_id}")
def get_config_for_profile(profile_id: str):
    configs = load_configs()
    if profile_id not in configs:
        raise HTTPException(status_code=404, detail="Config not found for profile")
    return configs[profile_id]


@app.post("/api/configs/{profile_id}")
def update_config_for_profile(profile_id: str, config: dict):
    configs = load_configs()
    configs[profile_id] = config
    save_configs(configs)
    return {"status": "success", "config": config}


# --- TARGET RELEASES CRUD ---

def load_target_releases():
    if os.path.exists(TARGET_RELEASES_FILE):
        with open(TARGET_RELEASES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_target_releases(target_releases):
    push_to_cloud(new_target_releases=target_releases)
    with open(TARGET_RELEASES_FILE, "w", encoding="utf-8") as f:
        json.dump(target_releases, f, indent=2)


@app.get("/api/target-releases")
def list_target_releases():
    return load_target_releases()


@app.get("/api/target-releases/{profile_id}")
def get_target_releases_for_profile(profile_id: str):
    releases = load_target_releases()
    if profile_id not in releases:
        raise HTTPException(status_code=404, detail="Target releases not found for profile")
    return releases[profile_id]


@app.post("/api/target-releases/{profile_id}")
def update_target_releases_for_profile(profile_id: str, data: dict):
    releases = load_target_releases()
    releases[profile_id] = data
    save_target_releases(releases)
    return {"status": "success", "target_releases": data}


import secrets




@app.post("/api/chargers")
def create_charger(data: ChargerCreate):
    charger_id = data.charger_id.strip()
    charger_id = re.sub(r'[\\/*?:"<>|]', "", charger_id)
    if not charger_id:
        raise HTTPException(status_code=400, detail="Invalid charger ID")

    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    if os.path.exists(charger_dir):
        return {"status": "success", "charger_id": charger_id}
    
    os.makedirs(charger_dir)
    os.makedirs(os.path.join(charger_dir, "images"))
    
    sync_token = secrets.token_urlsafe(24)
    meta_data = {"profile_id": data.profile_id, "sync_token": sync_token}
    with open(os.path.join(charger_dir, "meta.json"), "w") as f:
        json.dump(meta_data, f)
        
    with open(os.path.join(charger_dir, "results.json"), "w") as f:
        json.dump({}, f)

    if supabase:
        try:
            supabase.table('quench_chargers').insert({
                'charger_id': charger_id,
                'meta': meta_data,
                'results': {},
                'zip_link': None,
                'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }).execute()
        except Exception as e:
            print(f"Failed to create charger in Supabase: {e}")

    return {"status": "success", "charger_id": charger_id}

@app.get("/api/chargers")
def list_chargers():
    """Lists all chargers and calculates their stats."""
    checks, _, _, _ = parse_html_data()
    total_checks = len(checks)
    charger_list = []
    
    if supabase:
        try:
            res = supabase.table('quench_chargers').select('*').order('updated_at', desc=True).execute()
            if res.data:
                for row in res.data:
                    meta = row.get("meta", {})
                    results = row.get("results", {})
                    pass_count = sum(1 for v in results.values() if v.get("status") == "pass")
                    fail_count = sum(1 for v in results.values() if v.get("status") == "fail")
                    completed = sum(1 for v in results.values() if v.get("status") in ["pass", "fail", "na"])
                    pending = total_checks - completed
                    
                    charger_list.append({
                        "charger_id": row["charger_id"],
                        "profile_id": meta.get("profile_id", "Unknown"),
                        "sync_token": meta.get("sync_token"),
                        "zip_link": row.get("zip_link"),
                        "stats": {
                            "total": total_checks,
                            "completed": completed,
                            "pass": pass_count,
                            "fail": fail_count,
                            "pending": pending
                        }
                    })
                return charger_list
        except Exception as e:
            print(f"Supabase fetch failed, falling back to local: {e}")
            
    # Fallback to local
    if not os.path.exists(RESULTS_DIR):
        return charger_list
        
    for charger_id in os.listdir(RESULTS_DIR):
        charger_dir = os.path.join(RESULTS_DIR, charger_id)
        if not os.path.isdir(charger_dir):
            continue
            
        meta_file = os.path.join(charger_dir, "meta.json")
        results_file = os.path.join(charger_dir, "results.json")
        
        profile_id = "Unknown"
        sync_token = None
        if os.path.exists(meta_file):
            with open(meta_file, "r") as f:
                meta = json.load(f)
                profile_id = meta.get("profile_id", "Unknown")
                sync_token = meta.get("sync_token")
            
            # Retrofit missing sync_token for older chargers
            if not sync_token:
                import secrets
                sync_token = secrets.token_urlsafe(24)
                meta["sync_token"] = sync_token
                with open(meta_file, "w") as f:
                    json.dump(meta, f)
                
        results = {}
        if os.path.exists(results_file):
            with open(results_file, "r") as f:
                results = json.load(f)
                
        pass_count = sum(1 for v in results.values() if v.get("status") == "pass")
        fail_count = sum(1 for v in results.values() if v.get("status") == "fail")
        completed = sum(1 for v in results.values() if v.get("status") in ["pass", "fail", "na"])
        pending = total_checks - completed
        
        charger_list.append({
            "charger_id": charger_id,
            "profile_id": profile_id,
            "sync_token": sync_token,
            "stats": {
                "total": total_checks,
                "completed": completed,
                "pass": pass_count,
                "fail": fail_count,
                "pending": pending
            }
        })
        
    # Sort by mostly recently updated (based on folder modified time)
    charger_list.sort(key=lambda x: os.path.getmtime(os.path.join(RESULTS_DIR, x["charger_id"])), reverse=True)
    return charger_list

@app.get("/api/access/{token}")
def check_access_token(token: str):
    if not os.path.exists(RESULTS_DIR):
        raise HTTPException(status_code=404, detail="Token not found")
        
    for charger_id in os.listdir(RESULTS_DIR):
        meta_file = os.path.join(RESULTS_DIR, charger_id, "meta.json")
        if os.path.exists(meta_file):
            with open(meta_file, "r") as f:
                meta = json.load(f)
                if meta.get("sync_token") == token:
                    return {"charger_id": charger_id}
                    
    raise HTTPException(status_code=404, detail="Token not found")

@app.get("/api/results/{charger_id}")
def get_results(charger_id: str):
    checks, _, _, _ = parse_html_data()
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    
    meta_file = os.path.join(charger_dir, "meta.json")
    results_file = os.path.join(charger_dir, "results.json")
    
    profile_id = None
    sync_token = None
    results = {}
    
    if supabase:
        try:
            res = supabase.table('quench_chargers').select('meta, results, zip_link').eq('charger_id', charger_id).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                meta = row.get("meta", {})
                profile_id = meta.get("profile_id")
                sync_token = meta.get("sync_token")
                results = row.get("results", {})
                zip_link = row.get("zip_link")
                db_image_count = meta.get("image_count", 0)
                
                os.makedirs(charger_dir, exist_ok=True)
                images_dir = os.path.join(charger_dir, "images")
                os.makedirs(images_dir, exist_ok=True)
                
                local_image_count = len([f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]) if os.path.exists(images_dir) else 0
                if zip_link and local_image_count < db_image_count:
                    try:
                        import urllib.request
                        import zipfile
                        zip_path = os.path.join(charger_dir, "images.zip")
                        urllib.request.urlretrieve(zip_link, zip_path)
                        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                            zip_ref.extractall(images_dir)
                    except Exception as e:
                        print("Failed to download and extract ZIP from cloud:", e)
                
                # Update local cache just in case we are slightly behind OneDrive
                with open(meta_file, "w") as f: json.dump(meta, f)
                with open(results_file, "w") as f: json.dump(results, f, indent=2)
                
        except Exception as e:
            print(f"Supabase fetch failed: {e}")

    # Fallback to local if Supabase failed or returned nothing
    if not profile_id and os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            meta = json.load(f)
            profile_id = meta.get("profile_id")
            sync_token = meta.get("sync_token")
            
        if not sync_token:
            import secrets
            sync_token = secrets.token_urlsafe(24)
            meta["sync_token"] = sync_token
            with open(meta_file, "w") as f:
                json.dump(meta, f)
            
    if not results and os.path.exists(results_file):
        with open(results_file, "r") as f:
            results = json.load(f)
            
    images_map = {}
    images_dir = os.path.join(charger_dir, "images")
    if os.path.exists(images_dir):
        for f in os.listdir(images_dir):
            parts = os.path.splitext(f)[0].split('_')
            if len(parts) >= 2:
                # if check_id is PHY_001, parts = ['PHY', '001', '01']
                check_id = '_'.join(parts[:-1])
                if check_id not in images_map:
                    images_map[check_id] = []
                images_map[check_id].append(f"/api/images/{charger_id}/{f}")
            
    unsynced_images = False
    if os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            unsynced_images = json.load(f).get("unsynced_images", False)
            
    return {"profile_id": profile_id, "results": results, "sync_token": sync_token, "images": images_map, "unsynced_images": unsynced_images}

class ResultUpdate(BaseModel):
    charger_id: str
    check_id: str
    status: str
    notes: str = ""
    username: str = "Unknown"

@app.post("/api/results")
async def update_result(data: ResultUpdate):
    charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
    results_file = os.path.join(charger_dir, "results.json")
    
    if not os.path.exists(results_file):
        raise HTTPException(status_code=404, detail="Charger not found")
        
    with open(results_file, "r", encoding="utf-8") as f:
        results = json.load(f)
        
    results[data.check_id] = {
        "status": data.status,
        "notes": data.notes,
        "username": data.username
    }
    
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    if supabase:
        try:
            supabase.table('quench_chargers').update({
                'results': results,
                'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }).eq('charger_id', data.charger_id).execute()
        except Exception as e:
            print(f"Failed to sync result to Supabase: {e}")
        
    await manager.broadcast({
        "type": "RESULT_UPDATE",
        "charger_id": data.charger_id,
        "check_id": data.check_id,
        "data": results[data.check_id]
    })
        
    return {"status": "success", "data": results[data.check_id]}

@app.post("/api/reset/{charger_id}")
async def reset_results(charger_id: str):
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    results_file = os.path.join(charger_dir, "results.json")
    images_dir = os.path.join(charger_dir, "images")
    zip_file = os.path.join(charger_dir, "images.zip")
    
    if not os.path.exists(charger_dir):
        raise HTTPException(status_code=404, detail="Charger not found")
        
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({}, f, indent=2)
        
    if os.path.exists(images_dir):
        shutil.rmtree(images_dir)
        os.makedirs(images_dir)
        
    if os.path.exists(zip_file):
        os.remove(zip_file)
        
    await manager.broadcast({
        "type": "RESET",
        "charger_id": charger_id
    })
        
    return {"status": "success"}

def update_charger_zip(charger_dir):
    """Creates/updates the images.zip file for a charger."""
    images_dir = os.path.join(charger_dir, "images")
    if os.path.exists(images_dir) and os.listdir(images_dir):
        shutil.make_archive(os.path.join(charger_dir, "images"), 'zip', images_dir)

def set_unsynced_images(charger_dir: str, state: bool = True):
    meta_file = os.path.join(charger_dir, "meta.json")
    if os.path.exists(meta_file):
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
        meta["unsynced_images"] = state
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(meta, f)

@app.post("/api/upload-photo")
async def upload_photo(
    charger_id: str = Form(...),
    check_id: str = Form(...),
    file: UploadFile = File(...)
):
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    images_dir = os.path.join(charger_dir, "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    
    existing_files = [f for f in os.listdir(images_dir) if f.startswith(f"{check_id}_")]
    next_index = 1
    if existing_files:
        indices = []
        for f in existing_files:
            try:
                parts = os.path.splitext(f)[0].split('_')
                indices.append(int(parts[-1]))
            except ValueError:
                pass
        if indices:
            next_index = max(indices) + 1
            
    filename = f"{check_id}_{next_index:02d}{file_ext}"
    filepath = os.path.join(images_dir, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Also save a copy directly to OneDrive
    try:
        onedrive_dir = Path.home() / "OneDrive - Ador Digatron Pvt. Ltd/Commissioning_Results/Photos"
        onedrive_dir.mkdir(parents=True, exist_ok=True)
        onedrive_filepath = onedrive_dir / f"{charger_id}_{filename}"
        shutil.copy2(filepath, onedrive_filepath)
    except Exception as e:
        print(f"Failed to save to OneDrive: {e}")
        
    # Update zip file immediately
    update_charger_zip(charger_dir)
    set_unsynced_images(charger_dir, True)
        
    file_url = f"/api/images/{charger_id}/{filename}"
    
    await manager.broadcast({
        "type": "PHOTO_UPLOAD",
        "charger_id": charger_id,
        "check_id": check_id,
        "file_url": file_url
    })
    
    return {
        "status": "success",
        "file_url": file_url
    }

@app.get("/api/images/{charger_id}/{filename}")
def get_image(charger_id: str, filename: str):
    filepath = os.path.join(RESULTS_DIR, charger_id, "images", filename)
    if os.path.exists(filepath):
        return FileResponse(filepath)
    raise HTTPException(status_code=404, detail="Image not found")

@app.delete("/api/images/{charger_id}/{filename}")
async def delete_image(charger_id: str, filename: str):
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    filepath = os.path.join(charger_dir, "images", filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")
        
    try:
        os.remove(filepath)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Also attempt to delete from OneDrive
    try:
        onedrive_filepath = Path.home() / "OneDrive - Ador Digatron Pvt. Ltd/Commissioning_Results/Photos" / f"{charger_id}_{filename}"
        if onedrive_filepath.exists():
            os.remove(onedrive_filepath)
    except Exception:
        pass
        
    update_charger_zip(charger_dir)
    set_unsynced_images(charger_dir, True)
    
    # Broadcast to clients to remove the image
    file_url = f"/api/images/{charger_id}/{filename}"
    parts = filename.split('_')
    if len(parts) >= 2:
        check_id = '_'.join(parts[:-1])
        await manager.broadcast({
            "type": "PHOTO_DELETE",
            "charger_id": charger_id,
            "check_id": check_id,
            "file_url": file_url
        })
        
    return {"status": "success"}

@app.post("/api/sync-images/{charger_id}")
def sync_images(charger_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    zip_file = os.path.join(charger_dir, "images.zip")
    images_dir = os.path.join(charger_dir, "images")
    
    update_charger_zip(charger_dir)
    
    if not os.path.exists(zip_file):
        set_unsynced_images(charger_dir, False)
        return {"status": "success", "message": "No images to sync."}

    local_image_count = len([f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]) if os.path.exists(images_dir) else 0
        
    try:
        remote_path = f"{charger_id}/{charger_id}_images.zip"
        try:
            supabase.storage.from_("quench_exports").remove([remote_path])
        except Exception:
            pass
            
        with open(zip_file, "rb") as f:
            supabase.storage.from_("quench_exports").upload(
                file=f.read(),
                path=remote_path,
                file_options={"content-type": "application/zip"}
            )
            
        zip_link = supabase.storage.from_("quench_exports").get_public_url(remote_path)
        
        res = supabase.table('quench_chargers').select('meta').eq('charger_id', charger_id).execute()
        if res.data and len(res.data) > 0:
            db_meta = res.data[0].get('meta', {})
            db_meta['image_count'] = local_image_count
            
            supabase.table('quench_chargers').update({
                'zip_link': zip_link,
                'meta': db_meta,
                'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }).eq('charger_id', charger_id).execute()
            
        set_unsynced_images(charger_dir, False)
        return {"status": "success", "zip_link": zip_link}
        
    except Exception as e:
        print(f"Supabase sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))



import requests

@app.post("/api/automate/sw-004")
def automate_sw_004():
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "call",
            "params": [
                "00000000000000000000000000000000",
                "session",
                "login",
                {"username": "admin", "password": "Ador@2020"}
            ]
        }
        res = requests.post("http://10.20.27.1/ubus/session.login", json=payload, timeout=5)
        if res.status_code == 200:
            try:
                data = res.json()
                if "result" in data and len(data["result"]) > 0 and data["result"][0] == 0:
                    return {"success": True, "message": "Login successful!"}
                else:
                    return {"success": False, "message": "Wrong credentials please re configure the router"}
            except Exception:
                return {"success": False, "message": "Failed to parse JSON response from router."}
        else:
            return {"success": False, "message": "IP not assigned please re-configure the router"}
    except Exception as e:
        return {"success": False, "message": "IP not assigned please re-configure the router"}

class SW006Request(BaseModel):
    target_release: str

@app.post("/api/automate/sw-006")
def automate_sw_006(data: SW006Request):
    try:
        res = requests.get("http://10.20.27.100/api/system/facts", timeout=5)
        if res.status_code == 200:
            try:
                facts = res.json()
            except Exception:
                return {"success": False, "message": "Failed to parse JSON response."}
                
            version = facts.get("versions", {}).get("direct", {}).get("control_layer_version")
            if version == data.target_release:
                return {"success": True, "message": f"Version {version} matches target {data.target_release}!"}
            else:
                return {"success": False, "message": f"Version mismatch. Found {version}, expected {data.target_release}."}
        else:
            return {"success": False, "message": f"API request failed with status {res.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}

class SW007Request(BaseModel):
    target_release: str

@app.post("/api/automate/sw-007")
def automate_sw_007(data: SW007Request):
    try:
        res = requests.get("http://10.20.27.101/api/system/facts", timeout=5)
        if res.status_code == 200:
            try:
                facts = res.json()
            except Exception:
                return {"success": False, "message": "Failed to parse JSON response."}
                
            version = facts.get("versions", {}).get("direct", {}).get("control_layer_version")
            if version == data.target_release:
                return {"success": True, "message": f"Version {version} matches target {data.target_release}!"}
            else:
                return {"success": False, "message": f"Version mismatch. Found {version}, expected {data.target_release}."}
        else:
            return {"success": False, "message": f"API request failed with status {res.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}

class SW012Request(BaseModel):
    target_release: str

@app.post("/api/automate/sw-012")
def automate_sw_012(data: SW012Request):
    try:
        res = requests.get("http://10.20.27.50:3001/release", timeout=5)
        if res.status_code == 200:
            version = res.text.strip()
            if data.target_release in version:
                return {"success": True, "message": f"AB Firmware Version '{version}' matches target '{data.target_release}'!"}
            else:
                return {"success": False, "message": f"Version mismatch. Found '{version}', expected '{data.target_release}'."}
        else:
            return {"success": False, "message": f"API request failed with status {res.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}

@app.get("/api/export/{charger_id}/csv")
def export_csv(charger_id: str):
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    results_file = os.path.join(charger_dir, "results.json")
    if not os.path.exists(results_file):
        raise HTTPException(status_code=404, detail="Charger not found")
        
    with open(results_file, "r", encoding="utf-8") as f:
        results = json.load(f)
        
    checks, _, _, _ = parse_html_data()
    
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Test ID', 'Phase', 'Section', 'Title', 'Expected Result', 'Interface', 'Status', 'Notes', 'User'])
    
    for c in checks:
        res = results.get(c["id"], {})
        cw.writerow([
            c["id"],
            c["phase"],
            c["section"],
            c["title"],
            c.get("exp", ""),
            c.get("iface", ""),
            res.get("status", "pending"),
            res.get("notes", ""),
            res.get("username", "")
        ])
        
    output = si.getvalue()
    return Response(
        content=output, 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename=results_{charger_id}.csv"}
    )

@app.get("/api/export/{charger_id}/zip")
def export_zip(charger_id: str):
    charger_dir = os.path.join(RESULTS_DIR, charger_id)
    zip_file = os.path.join(charger_dir, "images.zip")
    
    if not os.path.exists(zip_file):
        # Generate it just in case
        update_charger_zip(charger_dir)
        
    if not os.path.exists(zip_file):
        raise HTTPException(status_code=404, detail="No images found to zip")
        
    return FileResponse(
        path=zip_file,
        filename=f"images_{charger_id}.zip",
        media_type="application/zip"
    )

class SeccConfigRequest(BaseModel):
    check_id: str
    charger_id: str

@app.post("/api/automate/secc-config")
def automate_secc_config(data: SeccConfigRequest):
    try:
        # Determine expected values from the charger's profile config
        charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
        meta_file = os.path.join(charger_dir, "meta.json")
        profile_id = None
        if os.path.exists(meta_file):
            with open(meta_file, "r", encoding="utf-8") as f:
                profile_id = json.load(f).get("profile_id")

        configs = load_configs()
        expected = configs.get(profile_id, {}).get("secc", {})
        # Support both nested (ccs.stack.*) and legacy flat config formats
        expected_ccs = expected.get("ccs", expected)
        expected_stack = expected_ccs.get("stack", {})
        expected_modules = expected_ccs.get("num_of_modules", 6)
        expected_maxKW = expected_stack.get("maxKW", expected_ccs.get("maxKW", 180))
        expected_maxA = expected_stack.get("maxA", expected_ccs.get("maxA", 500))
        expected_dlbMode = expected_ccs.get("dlbMode", "quintupleCombo")

        res1 = requests.get("http://10.20.27.100/api/system/userconfig", timeout=5)
        res2 = requests.get("http://10.20.27.101/api/system/userconfig", timeout=5)

        if res1.status_code != 200 or res2.status_code != 200:
            return {"success": False, "message": "Failed to reach one or both controllers (10.20.27.100 / 101)"}

        conf1 = res1.json()
        conf2 = res2.json()

        ccs1 = conf1.get("ccs", {})
        stack1 = ccs1.get("stack", {})
        ccs2 = conf2.get("ccs", {})
        stack2 = ccs2.get("stack", {})
        check_id = data.check_id

        def verify(val1, val2, expected_val, name):
            if val1 != val2:
                return {"success": False, "message": f"Mismatch! .100 has {val1}, but .101 has {val2}"}
            if val1 == expected_val:
                return {"success": True, "message": f"{name} is {expected_val} on both"}
            return {"success": False, "message": f"Expected {expected_val}, found {val1}"}

        if check_id == "SW-006":
            return verify(ccs1.get("num_of_modules"), ccs2.get("num_of_modules"), expected_modules, "num_of_modules")

        elif check_id == "SW-007":
            return verify(stack1.get("maxKW"), stack2.get("maxKW"), expected_maxKW, "maxKW")

        elif check_id == "SW-008":
            return verify(stack1.get("maxA"), stack2.get("maxA"), expected_maxA, "maxA")

        elif check_id == "SW-009":
            return verify(ccs1.get("dlbMode"), ccs2.get("dlbMode"), expected_dlbMode, "dlbMode")

        return {"success": False, "message": "Unknown check_id"}

    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}





import asyncio
import requests

@app.post("/api/automate/configure-router")
async def configure_router():
    if not os.path.exists(ROUTER_CONFIG_PATH):
        raise HTTPException(status_code=404, detail="Router config file not found. Upload it in SuperUser settings first.")

    async def _run_router_automation():
        def parse_uci_to_batches(config_text):
            configs = {}
            current_config = None
            for line in config_text.split('\n'):
                line = line.strip()
                if not line or line.startswith('#'): continue
                if line.startswith('file '):
                    current_config = line[5:].strip()
                    if current_config not in configs: configs[current_config] = []
                elif line.startswith('config '):
                    parts = line[7:].split(' ', 1)
                    ctype = parts[0].strip()
                    if len(parts) > 1:
                        configs[current_config].append({
                            'type': 'named', 'ctype': ctype, 'name': parts[1].strip().strip('\'"'), 'values': {}
                        })
                    else:
                        configs[current_config].append({
                            'type': 'anonymous', 'ctype': ctype, 'values': {}
                        })
                elif line.startswith('option ') or line.startswith('list '):
                    is_list = line.startswith('list ')
                    key_val = line[7:] if is_list else line[7:]
                    parts = key_val.split(' ', 1)
                    if len(parts) == 2 and configs[current_config]:
                        sec = configs[current_config][-1]
                        key, val = parts[0].strip(), parts[1].strip().strip('\'"')
                        if is_list:
                            if key not in sec['values']: sec['values'][key] = []
                            sec['values'][key].append(val)
                        else:
                            sec['values'][key] = val
            return configs

        def ubus_call(ip, token, obj, method, params=None, timeout=10):
            body = {
                "jsonrpc": "2.0", "id": 1, "method": "call",
                "params": [token, obj, method, params or {}]
            }
            return requests.post(f"http://{ip}/ubus", json=body, timeout=timeout).json()

        try:
            # ── Detect IP and Login ──────────────────────────────
            await manager.broadcast({"type": "ROUTER_STATUS", "status": "Detecting router IP..."})
            
            router_ip = None
            token = None
            current_password = None
            
            # Helper to try login
            def try_login(ip, pwd):
                try:
                    res = requests.post(f"http://{ip}/ubus", json={
                        "jsonrpc": "2.0", "id": 1, "method": "call",
                        "params": ["00000000000000000000000000000000", "session", "login",
                                   {"username": "admin", "password": pwd}]
                    }, timeout=3).json()
                    result = res.get("result", [None, {}])
                    if result and result[0] == 0:
                        return result[1].get("ubus_rpc_session")
                except Exception:
                    pass
                return None

            # Check 192.168.10.1
            for pwd in ["admin", "Ador@2020"]:
                t = try_login("192.168.10.1", pwd)
                if t:
                    router_ip = "192.168.10.1"
                    token = t
                    current_password = pwd
                    break
                
            if not router_ip:
                # Check 10.20.27.1
                for pwd in ["admin", "Ador@2020"]:
                    t = try_login("10.20.27.1", pwd)
                    if t:
                        router_ip = "10.20.27.1"
                        token = t
                        current_password = pwd
                        break
            
            if not router_ip:
                raise Exception("Could not reach router at 192.168.10.1 or 10.20.27.1. Ensure laptop is connected to the charger switch.")

            if router_ip == "192.168.10.1":
                # ── Step 2: Inject Configuration via UCI ─────────────────────────
                await manager.broadcast({"type": "ROUTER_STATUS", "status": "Step 2/5 – Injecting configuration dynamically..."})
                with open(ROUTER_CONFIG_PATH, "r", encoding="utf-8") as f:
                    batches = parse_uci_to_batches(f.read())
                
                # Ensure 'network' is processed and committed last, as it might drop the connection
                if 'network' in batches:
                    net_batch = batches.pop('network')
                    batches['network'] = net_batch

                total_sections = sum(len(secs) for secs in batches.values())
                processed = 0
                
                for config_name, sections in batches.items():
                    for sec in sections:
                        params = {'config': config_name, 'type': sec['ctype'], 'values': sec['values']}
                        if sec['type'] == 'named': params['name'] = sec['name']
                        try:
                            ubus_call("192.168.10.1", token, "uci", "add", params, timeout=5)
                        except Exception:
                            pass
                        processed += 1
                        if processed % 10 == 0:
                            await manager.broadcast({"type": "ROUTER_STATUS", "status": f"Step 2/5 – Injecting configuration ({processed}/{total_sections})..."})
                    
                    # Commit this config file
                    try:
                        ubus_call("192.168.10.1", token, "uci", "commit", {'config': config_name}, timeout=5)
                    except Exception:
                        pass

                # ── Step 3: Reboot router ────────────────────────────────────────
                await manager.broadcast({"type": "ROUTER_STATUS", "status": "Step 3/5 – Rebooting router to apply changes..."})
                try:
                    ubus_call("192.168.10.1", token, "luci2.system", "reboot", timeout=5)
                except Exception:
                    pass

                # Wait for router to reboot and come back on new IP
                await manager.broadcast({"type": "ROUTER_STATUS", "status": "Step 4/5 – Waiting for router to reboot (~50s)..."})
                await asyncio.sleep(50)

                # ── Step 5: Login to new IP and update password ──────────────────
                await manager.broadcast({"type": "ROUTER_STATUS", "status": "Step 5/5 – Connecting to new IP (10.20.27.1)..."})
                token2 = None
                for attempt in range(12):  # try for up to 60 seconds
                    token2 = try_login("10.20.27.1", "admin")
                    if not token2:
                        token2 = try_login("10.20.27.1", "Ador@2020")
                    if token2:
                        break
                    await asyncio.sleep(5)
                    await manager.broadcast({"type": "ROUTER_STATUS", "status": f"Step 5/5 – Waiting for 10.20.27.1... (attempt {attempt+1}/12)"})

                if not token2:
                    await manager.broadcast({"type": "ROUTER_STATUS", "status": "⚠️ Could not reach 10.20.27.1. Config applied, but password not changed. Connect to 10.20.27.1 and change password manually to Ador@2020."})
                    return
            else:
                await manager.broadcast({"type": "ROUTER_STATUS", "status": "Router is already configured on 10.20.27.1."})
                token2 = token

            if current_password == "Ador@2020" and router_ip == "10.20.27.1":
                await manager.broadcast({"type": "ROUTER_STATUS", "status": "✅ SUCCESS – Router already fully configured! IP: 10.20.27.1, Password: Ador@2020"})
                return

            # Update password using Invendis custom logic
            await manager.broadcast({"type": "ROUTER_STATUS", "status": "Step 5/5 – Updating router password..."})
            try:
                crypt_res = ubus_call("10.20.27.1", token2, "luci2.ui", "crypt", {"data": "Ador@2020"})
                crypt_hash = crypt_res.get("result", [None, {}])[1].get("crypt")
                if crypt_hash:
                    # Update rpcd admin password
                    ubus_call("10.20.27.1", token2, "uci", "add", {
                        "config": "rpcd", "type": "login", "name": "admin", "values": {"password": crypt_hash}
                    })
                    ubus_call("10.20.27.1", token2, "uci", "commit", {"config": "rpcd"})
                    
                    # Update rpcdtemp plaintext backup (required by Invendis UI)
                    ubus_call("10.20.27.1", token2, "uci", "add", {
                        "config": "rpcdtemp", "type": "rpcdtempsection", "name": "rpcdtemp", 
                        "values": {"password": "Ador@2020", "new_password": "Ador@2020", "confirm_password": "Ador@2020"}
                    })
                    ubus_call("10.20.27.1", token2, "uci", "commit", {"config": "rpcdtemp"})
            except Exception as e:
                print("Failed to set password:", e)

            await manager.broadcast({"type": "ROUTER_STATUS", "status": "✅ SUCCESS – Router configured! IP: 10.20.27.1, Password: Ador@2020"})

        except Exception as e:
            await manager.broadcast({"type": "ROUTER_STATUS", "status": f"❌ Error: {str(e)}"})

    asyncio.create_task(_run_router_automation())
    return {"status": "started"}

class ABConfigRequest(BaseModel):
    check_id: str
    charger_id: str

@app.post("/api/automate/ab-config")
def automate_ab_config(data: ABConfigRequest):
    try:
        charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
        meta_file = os.path.join(charger_dir, "meta.json")
        profile_id = None
        if os.path.exists(meta_file):
            with open(meta_file, "r", encoding="utf-8") as f:
                profile_id = json.load(f).get("profile_id")

        configs = load_configs()
        expected_ocpp = configs.get(profile_id, {}).get("ocpp", {})
        expected_std = expected_ocpp.get("Standard Configuration", {})

        res = requests.get("http://10.20.27.50:3001/ocpp-client/config", timeout=5)
        if res.status_code != 200:
            return {"success": False, "message": f"Failed to fetch AB config. Status code: {res.status_code}"}
        
        ab_config = res.json()
        ab_std = ab_config.get("Standard Configuration", {})
        check_id = data.check_id

        def verify(val, expected_val, name):
            if val == expected_val:
                return {"success": True, "message": f"{name} is correctly set to '{val}'"}
            return {"success": False, "message": f"Expected '{expected_val}', found '{val}'"}

        if check_id == "SW-011":
            return verify(ab_config.get("chargingPointModel"), expected_ocpp.get("chargingPointModel", "MSIL"), "chargingPointModel")
        elif check_id == "SW-012":
            val = ab_config.get("chargePointSerialNumber")
            exp = expected_ocpp.get("chargePointSerialNumber")
            if exp:
                return verify(val, exp, "chargePointSerialNumber")
            if val:
                return {"success": True, "message": f"chargePointSerialNumber is set to {val}"}
            return {"success": False, "message": "chargePointSerialNumber is missing or empty"}
        elif check_id == "SW-013":
            return verify(ab_config.get("powerSaveInIdleMode"), expected_ocpp.get("powerSaveInIdleMode", False), "powerSaveInIdleMode")
        elif check_id == "SW-014":
            return verify(ab_config.get("chargingPointVendor"), expected_ocpp.get("chargingPointVendor", "QUENCH"), "chargingPointVendor")
        elif check_id == "SW-015":
            return verify(ab_config.get("protocol"), expected_ocpp.get("protocol", "ocpp1.6"), "protocol")
        elif check_id == "SW-016":
            return verify(ab_config.get("OCPPEndpointToBackend"), expected_ocpp.get("OCPPEndpointToBackend", "wss://ocpp-preprod.evmsil.in"), "OCPPEndpointToBackend")
        elif check_id == "SW-017":
            return verify(ab_config.get("RFIDEnabled"), expected_ocpp.get("RFIDEnabled", True), "RFIDEnabled")
        elif check_id == "SW-018":
            return verify(ab_config.get("maxPowerLimitInkW"), expected_ocpp.get("maxPowerLimitInkW", 60), "maxPowerLimitInkW")
        elif check_id == "SW-019":
            return verify(ab_config.get("maxCurrentLimitInAmps"), expected_ocpp.get("maxCurrentLimitInAmps", 200), "maxCurrentLimitInAmps")
        elif check_id == "SW-020":
            val = ab_config.get("NumberOfConnectors") or ab_std.get("NumberOfConnectors")
            exp = expected_ocpp.get("NumberOfConnectors") or expected_std.get("NumberOfConnectors", 2)
            return verify(val, exp, "NumberOfConnectors")
        elif check_id == "SW-021":
            val = ab_std.get("HeartbeatInterval") or ab_std.get("HeartBeatInterval")
            exp = expected_std.get("HeartbeatInterval") or expected_std.get("HeartBeatInterval", 90)
            return verify(val, exp, "HeartbeatInterval")
        elif check_id == "SW-022":
            val = ab_std.get("MeterValuesSampledData", "")
            exp = expected_std.get("MeterValuesSampledData", "")
            if exp and val == exp:
                return {"success": True, "message": "MeterValuesSampledData matches expected config"}
            elif not exp and "Energy.Active.Import.Register" in val and "SoC" in val:
                return {"success": True, "message": "MeterValuesSampledData contains required keys"}
            return {"success": False, "message": f"MeterValuesSampledData mismatch. Found: {val}"}
        elif check_id == "SW-023":
            dt = ab_config.get("dataTransfer", {})
            v_id = dt.get("VendorsId", [])
            m_id = dt.get("MessagesId", [])
            exp_dt = expected_ocpp.get("dataTransfer", {})
            if exp_dt:
                if v_id == exp_dt.get("VendorsId") and m_id == exp_dt.get("MessagesId"):
                    return {"success": True, "message": "dataTransfer config matches profile expected values"}
            if "MSIL" in v_id and "AutoStop" in m_id:
                return {"success": True, "message": "VendorsId contains MSIL, MessagesId contains AutoStop"}
            return {"success": False, "message": f"dataTransfer mismatch: {dt}"}
            
        return {"success": False, "message": "Unknown check_id"}

    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}



class VerifyRouterRequest(BaseModel):
    check_id: str
    charger_id: str

@app.post("/api/automate/verify-router")
def automate_verify_router(data: VerifyRouterRequest):
    try:
        # Read the router_config.txt file
        if not os.path.exists(ROUTER_CONFIG_PATH):
            return {"success": False, "message": "router_config.txt not found. SuperUser must upload it first."}
            
        with open(ROUTER_CONFIG_PATH, "r", encoding="utf-8") as f:
            config_text = f.read()
            
        # Parse expected values from config_text
        expected_model = None
        system_blocks = re.findall(r"config\s+system.*?(?=config |\Z)", config_text, re.DOTALL)
        if system_blocks:
            match_model = re.search(r"option\s+model\s+['\"]?([^'\"]+)['\"]?", system_blocks[0])
            if match_model:
                expected_model = match_model.group(1)
            
        expected_ssid = None
        expected_key = None
        expected_disabled = None
        
        # Find the wifi-iface with mode 'sta'
        sta_blocks = re.findall(r"config\s+wifi-iface.*?(?=config |\Z)", config_text, re.DOTALL)
        for block in sta_blocks:
            if re.search(r"option\s+mode\s+['\"]?sta['\"]?", block):
                m_ssid = re.search(r"option\s+ssid\s+['\"]?([^'\"]+)['\"]?", block)
                m_key = re.search(r"option\s+key\s+['\"]?([^'\"]+)['\"]?", block)
                m_disabled = re.search(r"option\s+disabled\s+['\"]?([^'\"]+)['\"]?", block)
                if m_ssid: expected_ssid = m_ssid.group(1)
                if m_key: expected_key = m_key.group(1)
                if m_disabled: expected_disabled = m_disabled.group(1)
                break
                
        # Connect to router via UBUS
        def ubus_call(ip, token, obj, method, params=None, timeout=10):
            body = {
                "jsonrpc": "2.0", "id": 1, "method": "call",
                "params": [token, obj, method, params or {}]
            }
            return requests.post(f"http://{ip}/ubus", json=body, timeout=timeout).json()

        def try_login(ip, pwd):
            try:
                res = requests.post(f"http://{ip}/ubus", json={
                    "jsonrpc": "2.0", "id": 1, "method": "call",
                    "params": ["00000000000000000000000000000000", "session", "login",
                               {"username": "admin", "password": pwd}]
                }, timeout=3).json()
                result = res.get("result", [None, {}])
                if result and result[0] == 0:
                    return result[1].get("ubus_rpc_session")
            except Exception:
                pass
            return None
            
        router_ip = "10.20.27.1"
        token = try_login(router_ip, "Ador@2020") or try_login(router_ip, "admin")
        if not token:
            return {"success": False, "message": f"Could not connect to router at {router_ip}"}
            
        check_id = data.check_id
        
        if check_id == "SW-001":
            if not expected_model:
                return {"success": False, "message": "Could not find 'option model' in router_config.txt"}
                
            sys_config = ubus_call(router_ip, token, "uci", "get", {"config": "system"})
            try:
                live_model = sys_config["result"][1]["values"]["system"]["model"]
            except KeyError:
                return {"success": False, "message": "Failed to read system.model from router"}
                
            if live_model == expected_model:
                return {"success": True, "message": f"Router model '{live_model}' matches config."}
            else:
                return {"success": False, "message": f"Model mismatch. Expected '{expected_model}', found '{live_model}'"}
                
        elif check_id == "SW-003":
            if not expected_ssid:
                return {"success": False, "message": "Could not find sta ssid in router_config.txt"}
                
            wifi_config = ubus_call(router_ip, token, "uci", "get", {"config": "wireless"})
            try:
                values = wifi_config["result"][1]["values"]
                sta_iface = None
                for key, val in values.items():
                    if val.get(".type") == "wifi-iface" and val.get("mode") == "sta":
                        sta_iface = val
                        break
                if not sta_iface:
                    return {"success": False, "message": "Router has no wifi-iface with mode 'sta'"}
                    
                live_ssid = sta_iface.get("ssid")
                live_key = sta_iface.get("key")
                live_disabled = sta_iface.get("disabled")
                
                errors = []
                if live_ssid != expected_ssid:
                    errors.append(f"SSID expected '{expected_ssid}', found '{live_ssid}'")
                if live_key != expected_key:
                    errors.append(f"Key expected '{expected_key}', found '{live_key}'")
                
                exp_dis = expected_disabled or "0"
                liv_dis = live_disabled or "0"
                if liv_dis != exp_dis:
                    errors.append(f"Disabled flag expected '{exp_dis}', found '{liv_dis}'")
                    
                if errors:
                    return {"success": False, "message": "Mismatch: " + "; ".join(errors) + ". Please reconfigure the router."}
                else:
                    return {"success": True, "message": f"WiFi client configured correctly with SSID '{live_ssid}'"}
            except Exception as e:
                return {"success": False, "message": f"Failed to parse wireless config from router: {str(e)}"}
                
        return {"success": False, "message": "Unknown check_id"}

    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}




class ConfigureControllerRequest(BaseModel):
    charger_id: str

def push_controller_config(ip, payload):
    try:
        post_res = requests.post(f"http://{ip}/api/system/userconfig", json=payload, timeout=5)
        if post_res.status_code == 200:
            return {"success": True, "message": f"Successfully pushed configuration to {ip}!"}
        else:
            return {"success": False, "message": f"Failed to POST config to {ip} (HTTP {post_res.status_code})"}
    except Exception as e:
        return {"success": False, "message": f"Connection error to {ip}: {str(e)}"}

@app.post("/api/configure/secc")
def api_configure_secc(data: ConfigureControllerRequest):
    try:
        charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
        meta_file = os.path.join(charger_dir, "meta.json")
        if not os.path.exists(meta_file):
            return {"success": False, "message": "Charger metadata not found. Please initialize testing first."}
            
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        profile_id = meta.get("profile_id")
        if not profile_id:
             return {"success": False, "message": "No profile_id found in charger metadata."}
             
        configs = load_configs()
        profile = configs.get(profile_id, {})
            
        secc_payload = profile.get("secc", {})
        if not secc_payload:
            return {"success": False, "message": f"No 'secc' object found in the configuration profile for {profile_id}."}
            
        return push_controller_config("10.20.27.100", secc_payload)
    except Exception as e:
        return {"success": False, "message": f"Error configuring SECC: {str(e)}"}

@app.post("/api/configure/seccle")
def api_configure_seccle(data: ConfigureControllerRequest):
    try:
        charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
        meta_file = os.path.join(charger_dir, "meta.json")
        if not os.path.exists(meta_file):
            return {"success": False, "message": "Charger metadata not found. Please initialize testing first."}
            
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        profile_id = meta.get("profile_id")
        if not profile_id:
             return {"success": False, "message": "No profile_id found in charger metadata."}
             
        configs = load_configs()
        profile = configs.get(profile_id, {})
            
        seccle_payload = profile.get("seccle", {})
        if not seccle_payload:
            return {"success": False, "message": f"No 'seccle' object found in the configuration profile for {profile_id}."}
            
        return push_controller_config("10.20.27.101", seccle_payload)
    except Exception as e:
        return {"success": False, "message": f"Error configuring SECCLE: {str(e)}"}




class RebootStackRequest(BaseModel):
    target: str # 'secc' or 'seccle'

@app.post("/api/automate/reboot-stack")
def api_reboot_stack(data: RebootStackRequest):
    if data.target == "ab":
        ip = "10.20.27.50:3001"
        url = f"http://{ip}/ocpp-client/restart"
    else:
        ip = "10.20.27.100" if data.target == "secc" else "10.20.27.101"
        url = f"http://{ip}/api/outlets/ccs/restartStack"
        
    try:
        res = requests.post(url, timeout=5)
        if res.status_code == 200 or res.status_code == 202:
            return {"success": True, "message": f"Successfully triggered restart on {ip}!"}
        else:
            return {"success": False, "message": f"Failed to restart on {ip} (HTTP {res.status_code})"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}



@app.post("/api/configure/ab")
def api_configure_ab(data: ConfigureControllerRequest):
    try:
        charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
        meta_file = os.path.join(charger_dir, "meta.json")
        if not os.path.exists(meta_file):
            return {"success": False, "message": "Charger metadata not found. Please initialize testing first."}
            
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        profile_id = meta.get("profile_id")
        if not profile_id:
             return {"success": False, "message": "No profile_id found in charger metadata."}
             
        configs = load_configs()
        profile = configs.get(profile_id, {})
            
        ocpp_payload = profile.get("ocpp", {})
        if not ocpp_payload:
            return {"success": False, "message": f"No 'ocpp' object found in the configuration profile for {profile_id}."}
            
        post_res = requests.post(f"http://10.20.27.50:3001/ocpp-client/config", json=ocpp_payload, timeout=5)
        if post_res.status_code == 200:
            return {"success": True, "message": f"Successfully pushed configuration to AB!"}
        else:
            return {"success": False, "message": f"Failed to POST config to AB (HTTP {post_res.status_code})"}
    except Exception as e:
        return {"success": False, "message": f"Error configuring AB: {str(e)}"}

@app.get('/api/sync/pull')
def manual_pull_from_cloud():
    try:
        pull_from_cloud()
        return {'status': 'success', 'message': 'Successfully synced with Cloud.'}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.on_event('startup')
def startup_event():
    print('Starting up... pulling from cloud if possible.')
    pull_from_cloud()

# Mount the frontend application as a catch-all route at the end
if os.path.exists(FRONTEND_DIST_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    import multiprocessing
    multiprocessing.freeze_support()
    is_frozen = getattr(sys, 'frozen', False)
    # When frozen, pass the app object directly because "main:app" cannot be imported from a bundled exe
    if is_frozen:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)




