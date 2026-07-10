import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the block from `def configure_controller` to the end of `api_configure_seccle`
old_block_pattern = r"def configure_controller\(ip, expected_ccs\):.*?def api_configure_seccle\(data: ConfigureControllerRequest\):.*?return \{\"success\": False, \"message\": f\"Error configuring SECCLE: \{str\(e\)\}\"\}"

new_block = """def push_controller_config(ip, payload):
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
            return {"success": False, "message": "Charger metadata not found. Please upload profile first."}
            
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        secc_payload = meta.get("profile", {}).get("secc", {})
        if not secc_payload:
            return {"success": False, "message": "No 'secc' object found in the active profile JSON."}
            
        return push_controller_config("10.20.27.100", secc_payload)
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
            
        seccle_payload = meta.get("profile", {}).get("seccle", {})
        if not seccle_payload:
            return {"success": False, "message": "No 'seccle' object found in the active profile JSON."}
            
        return push_controller_config("10.20.27.101", seccle_payload)
    except Exception as e:
        return {"success": False, "message": f"Error configuring SECCLE: {str(e)}"}"""

content = re.sub(old_block_pattern, new_block, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated main.py with direct POST logic!")
