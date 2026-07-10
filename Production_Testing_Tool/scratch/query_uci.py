import requests
import json

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

token = try_login("10.20.27.1", "Ador@2020") or try_login("10.20.27.1", "admin")
if token:
    print("Logged in!")
    sys_config = ubus_call("10.20.27.1", token, "uci", "get", {"config": "system"})
    print("System Config:", json.dumps(sys_config, indent=2))
    
    wifi_config = ubus_call("10.20.27.1", token, "uci", "get", {"config": "wireless"})
    print("Wireless Config:", json.dumps(wifi_config, indent=2))
else:
    print("Could not login to 10.20.27.1")
