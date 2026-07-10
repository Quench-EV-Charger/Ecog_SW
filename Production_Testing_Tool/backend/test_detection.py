import requests

def try_login(ip, pwd):
    try:
        print(f"Trying {ip} with {pwd}...")
        res = requests.post(f"http://{ip}/ubus", json={
            "jsonrpc": "2.0", "id": 1, "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login",
                       {"username": "admin", "password": pwd}]
        }, timeout=3).json()
        print(f"Result for {pwd}: {res}")
        result = res.get("result", [None, {}])
        if result and result[0] == 0:
            return result[1].get("ubus_rpc_session")
    except Exception as e:
        print(f"Exception for {pwd}: {e}")
    return None

router_ip = None
token = None
current_password = None

for pwd in ["admin", "Ador@2020"]:
    t = try_login("192.168.10.1", pwd)
    if t:
        router_ip = "192.168.10.1"
        token = t
        current_password = pwd
        break

if not router_ip:
    for pwd in ["admin", "Ador@2020"]:
        t = try_login("10.20.27.1", pwd)
        if t:
            router_ip = "10.20.27.1"
            token = t
            current_password = pwd
            break

print(f"Final router_ip: {router_ip}, current_password: {current_password}")
