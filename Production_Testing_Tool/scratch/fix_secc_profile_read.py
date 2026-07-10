import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old_logic_secc = """    try:
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
        return {"success": False, "message": f"Error configuring SECC: {str(e)}"}"""

new_logic_secc = """    try:
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
        return {"success": False, "message": f"Error configuring SECC: {str(e)}"}"""

old_logic_seccle = """    try:
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

new_logic_seccle = """    try:
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
        return {"success": False, "message": f"Error configuring SECCLE: {str(e)}"}"""

content = content.replace(old_logic_secc, new_logic_secc)
content = content.replace(old_logic_seccle, new_logic_seccle)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated main.py to read profile properly!")
