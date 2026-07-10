import os

filepath = r"c:\Users\VCHAUHAN\Desktop\Production_Testing_Tool\backend\main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_block = """

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
"""

if "def automate_ab_config" not in content:
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(new_block)
    print("Appended ab_config successfully!")
else:
    print("ab_config already exists!")
