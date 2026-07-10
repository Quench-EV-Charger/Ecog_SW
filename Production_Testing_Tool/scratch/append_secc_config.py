import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoints = """

class ConfigureControllerRequest(BaseModel):
    charger_id: str

def configure_controller(ip, expected_ccs):
    try:
        res = requests.get(f"http://{ip}/api/system/userconfig", timeout=5)
        if res.status_code != 200:
            return {"success": False, "message": f"Failed to GET config from {ip}"}
        
        conf = res.json()
        if "ccs" not in conf:
            conf["ccs"] = {}
        if "stack" not in conf["ccs"]:
            conf["ccs"]["stack"] = {}
            
        conf["ccs"]["num_of_modules"] = expected_ccs.get("num_of_modules", 6)
        conf["ccs"]["stack"]["maxKW"] = expected_ccs.get("stack", {}).get("maxKW", expected_ccs.get("maxKW", 180))
        conf["ccs"]["stack"]["maxA"] = expected_ccs.get("stack", {}).get("maxA", expected_ccs.get("maxA", 500))
        conf["ccs"]["dlbMode"] = expected_ccs.get("dlbMode", "quintupleCombo")
        
        post_res = requests.post(f"http://{ip}/api/system/userconfig", json=conf, timeout=5)
        if post_res.status_code == 200:
            return {"success": True, "message": f"Successfully configured controller at {ip}!"}
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
            return {"success": False, "message": "Charger metadata not found. Please upload profile first."}
            
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        expected_secc = meta.get("profile", {}).get("secc", {})
        expected_ccs = expected_secc.get("ccs", expected_secc)
        
        return configure_controller("10.20.27.100", expected_ccs)
    except Exception as e:
        return {"success": False, "message": f"Error configuring SECC: {str(e)}"}

@app.post("/api/configure/seccle")
def api_configure_seccle(data: ConfigureControllerRequest):
    try:
        charger_dir = os.path.join(RESULTS_DIR, data.charger_id)
        meta_file = os.path.join(charger_dir, "meta.json")
        if not os.path.exists(meta_file):
            return {"success": False, "message": "Charger metadata not found. Please upload profile first."}
            
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        expected_seccle = meta.get("profile", {}).get("seccle", {})
        expected_ccs = expected_seccle.get("ccs", expected_seccle)
        
        return configure_controller("10.20.27.101", expected_ccs)
    except Exception as e:
        return {"success": False, "message": f"Error configuring SECCLE: {str(e)}"}

"""

# Insert before Catch-All route
match = re.search(r"# Mount the frontend application as a catch-all route at the end", content)
if match:
    content = content.replace(match.group(0), new_endpoints + "\n\n" + match.group(0))
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully appended SECC/SECCLE configure endpoints to main.py")
else:
    print("Failed to find insertion point.")
