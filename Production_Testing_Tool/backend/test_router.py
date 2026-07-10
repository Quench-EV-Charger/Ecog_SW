import requests
import json
import sys

def test_router(ip, password):
    try:
        res = requests.post(f"http://{ip}/ubus", json={
            "jsonrpc": "2.0", "id": 1, "method": "call",
            "params": ["00000000000000000000000000000000", "session", "login",
                       {"username": "admin", "password": password}]
        }, timeout=5)
        print(f"{ip} ({password}): {res.status_code} - {res.text}")
    except Exception as e:
        print(f"{ip} ({password}): Error - {str(e)}")

test_router("10.20.27.1", "admin")
test_router("10.20.27.1", "Ador@2020")
test_router("192.168.10.1", "admin")
