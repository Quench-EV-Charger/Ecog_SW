import re

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_block = """

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
        match_model = re.search(r"option\s+model\s+['\"]?([^'\"]+)['\"]?", config_text)
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
"""

# Insert before Catch-All route
match = re.search(r"# Mount the frontend application as a catch-all route at the end", content)
if match:
    content = content.replace(match.group(0), new_block + "\n\n" + match.group(0))
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully appended verify-router to main.py")
else:
    print("Failed to find insertion point.")
