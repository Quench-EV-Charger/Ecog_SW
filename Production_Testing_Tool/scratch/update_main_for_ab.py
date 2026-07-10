import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update api_reboot_stack
old_reboot = """@app.post("/api/automate/reboot-stack")
def api_reboot_stack(data: RebootStackRequest):
    ip = "10.20.27.100" if data.target == "secc" else "10.20.27.101"
    try:
        url = f"http://{ip}/api/outlets/ccs/restartStack"
        # usually restart APIs are POST but if it's GET, requests.post might fail, but let's assume POST
        res = requests.post(url, timeout=5)
        if res.status_code == 200 or res.status_code == 202:
            return {"success": True, "message": f"Successfully triggered restartStack on {ip}!"}
        else:
            return {"success": False, "message": f"Failed to restartStack on {ip} (HTTP {res.status_code})"}
    except Exception as e:
        return {"success": False, "message": f"Connection error: {str(e)}"}"""

new_reboot = """@app.post("/api/automate/reboot-stack")
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
        return {"success": False, "message": f"Connection error: {str(e)}"}"""

content = content.replace(old_reboot, new_reboot)

# 2. Add /api/configure/ab
new_ab_endpoint = """
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
"""

# Append before Catch-All route
match = re.search(r"# Mount the frontend application as a catch-all route at the end", content)
content = content.replace(match.group(0), new_ab_endpoint + "\n\n" + match.group(0))

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated main.py with AB logic!")
