#!/usr/bin/env python3
"""
EcoG Dual-Outlet DC Fast Charger Simulator
Emulates the hardware REST API on port 3001 so that noc/CMS_Script.py
can run without physical hardware.

Run:
    pip install flask
    python NOC_Sim/simulator.py
"""

import json
import random
import string
import threading
import time
from flask import Flask, jsonify, Response

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PORT                = 3001
DEVICE_ID           = "sim-ab-01529"
FIRMWARE_VERSION    = "v1.2.62"
RELEASE_STR         = "release-1.2.62-sim"
CYCLE_IDLE_SECS     = 60       # idle wait before every session
CYCLE_CHARGE_SECS   = 120      # max charging duration (clean session)
GUN_B_STAGGER_SECS  = 30       # Gun B starts its first idle this many seconds late

# ---------------------------------------------------------------------------
# Error tables (mirrors noc/CMS_Script.py ERROR_OBJ_MAPPING)
# ---------------------------------------------------------------------------
ERROR_OBJ_CANDIDATES = [
    "eStopErr",
    "doorOpenErr",
    "outletTemperatureErr",
    "overVoltageErr",
    "underVoltageErr",
    "powerModuleFailureErr",
    "groundFault",
]

# vendor error code for each errorObj field (used in curr_ses_error)
ERROR_OBJ_VENDOR_CODE = {
    "eStopErr":               17,
    "doorOpenErr":            18,
    "outletTemperatureErr":   83,
    "overVoltageErr":         85,
    "underVoltageErr":        26,
    "powerModuleFailureErr":  14,
    "groundFault":            90,
}


# ---------------------------------------------------------------------------
# Outlet simulator
# ---------------------------------------------------------------------------
def _rand_session_id():
    return "SIM-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))

def _rand_rfid():
    return "RFID" + "".join(random.choices(string.digits, k=8))

def _rand_evmac():
    return ".".join(f"{random.randint(0,255):02x}" for _ in range(6))

def _ts():
    """Current epoch milliseconds."""
    return int(time.time() * 1000)


class OutletSim:
    """Owns all mutable state for one outlet and runs a background thread
    that drives the charging state machine."""

    def __init__(self, outlet_number: int, outlet_id: int,
                 controller_id: str, stagger_secs: float = 0):
        self.outlet_number  = outlet_number   # 1 or 2
        self.outlet_id      = outlet_id       # 1 or 2
        self.controller_id  = controller_id   # e.g. "secc2300-21641"
        self.stagger_secs   = stagger_secs
        self.session_count  = 0               # incremented at session start
        self._lock          = threading.Lock()

        # Live state dict — shape matches real hardware /state element
        self._state = self._build_idle_state()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get_state(self) -> dict:
        with self._lock:
            return dict(self._state)

    def start(self):
        t = threading.Thread(target=self._run, daemon=True,
                             name=f"outlet-{self.outlet_number}")
        t.start()

    # ------------------------------------------------------------------
    # Idle state template
    # ------------------------------------------------------------------
    def _build_idle_state(self) -> dict:
        return {
            "outlet":                   str(self.outlet_number),
            "outletType":               "CCS",
            "RFIDConnected":            False,
            "online":                   True,
            "timestamp":                _ts(),
            "ActiveConverterModules":   "1",
            "ConverterProtocolVersion": "1.1",
            "ConverterType":            "Infy",
            "EVMAC":                    "",
            "EVCCID":                   "",
            "SLAC":                     {"state": "MATCHINGPROCESS", "init": False},
            "bookedfor":                "",
            "controller":               "SECC2300LE",
            "curr_ses_endBy":           "",
            "curr_ses_errMsg":          "",
            "curr_ses_errors_list":     "",
            "curr_ses_id":              "",
            "id":                       self.controller_id,
            "stopReason":               "",
            "version":                  FIRMWARE_VERSION,
            "PowerCapW":                60000,
            "curr_ses_Wh":              0,
            "curr_ses_error":           0,
            "curr_ses_secs":            0,
            "displayScreen":            10,
            "pLimit":                   60000,
            "pilot":                    0,
            "evsestat":                 1,
            "iso":                      0,
            "phs":                      1,
            "phsAuth":                  1,
            "phsCC":                    1,
            "phsCha":                   1,
            "phsPD":                    1,
            "phsPre":                   1,
            "phsStart":                 1,
            "phsStop":                  1,
            "pp":                       0,
            "pc":                       0,
            "pv":                       0,
            "soc":                      0,
            "tc":                       0,
            "tv":                       0,
            "EVRESSSOC":                -1,
            "Pmax":                     60000,
            "TimeToBulk":               0,
            "TimeToFull":               0,
            "evmaxc":                   0,
            "evmaxv":                   0,
            "evsemaxc":                 100,
            "evsemaxp":                 60000,
            "evsemaxv":                 1000,
            "extVolt":                  0,
            "intVolt":                  0,
            "meter":                    round(random.uniform(200, 1200), 5),
            "auth":                     False,
            "busy":                     False,
            "curr_ses_active":          False,
            "curr_ses_success":         False,
            "CCSCharging":              False,
            "ChademoCharging":          False,
            "chargingPaused":           False,
            "out_of_order":             False,
            "sessionPending":           True,
            "testEV":                   False,
            "initializing":             False,
            "isoFault":                 False,
            "errorStop":                False,
            "hasError":                 False,
            "safety_tripped":           False,
            "startCharging":            False,
            "stopCharging":             False,
            "door_open":                False,
            "freeCharge":               False,
            "d1":                       False,
            "d2":                       False,
            "j":                        False,
            "can1_connected":           True,
            "can1_RX_m0_inputVoltage_AB": round(random.uniform(400, 420), 1),
            "can1_RX_m0_inputVoltage_BC": round(random.uniform(400, 420), 1),
            "can1_RX_m0_inputVoltage_CA": round(random.uniform(400, 420), 1),
            "can1_RX_m0_temperature":   34,
            "can1_RX_m1_temperature":   36,
            "can1_RX_m0_presentCurrent":  0,
            "can1_RX_m0_presentVoltage":  0,
            "can1_RX_m1_presentCurrent":  0,
            "can1_RX_m1_presentVoltage":  0,
            "convMaxCurrent":           100,
            "convMaxPower":             60000,
            "convMaxVoltage":           1000,
            "numberOfModulesAvailable": 2,
            "temperatures": {
                "cabinet_temp":  round(random.uniform(10, 35), 2),
                "outlet_temp":   round(random.uniform(10, 40), 2),
                "CCS_A1_temp":   round(random.uniform(25, 35), 2),
                "CCS_A2_temp":   round(random.uniform(25, 35), 2),
                "CCS_B1_temp":   round(random.uniform(25, 35), 2),
                "CCS_B2_temp":   round(random.uniform(25, 35), 2),
            },
            "errorObj": {
                "powerLossErr":           False,
                "eStopErr":               False,
                "doorOpenErr":            False,
                "outletTemperatureErr":   False,
                "cabinetTemperatureErr":  False,
                "overVoltageErr":         False,
                "underVoltageErr":        False,
                "powerModuleFailureErr":  False,
                "gunTemperatureErr_1":    False,
                "gunTemperatureErr_2":    False,
                "powerModuleCommErr_1":   False,
                "powerModuleCommErr_2":   False,
                "groundFault":            False,
                "imdResistanceErr_1":     False,
                "imdResistanceErr_2":     False,
                "imdFaultyErr":           False,
                "dcEnergyStuckErr_1":     False,
                "dcEnergyStuckErr_2":     False,
                "ac_em_fail":             False,
            },
            "modbus_selec_online":    False,
            "modbus_ccs_bender_online": True,
            "voltage_L1_L2":          0,
            "voltage_L2_L3":          0,
            "voltage_L3_L1":          0,
            "current_L1":             0,
            "current_L2":             0,
            "current_L3":             0,
            "average_pf":             0,
            "reactive_import_total":  0,
            "reactive_total":         0,
            "active_total":           0,
            "total_net_kWh":          0,
            "sessionStart":           0,
            "user":                   "",
        }

    # ------------------------------------------------------------------
    # State machine driver
    # ------------------------------------------------------------------
    def _set(self, **kwargs):
        """Thread-safe partial state update."""
        with self._lock:
            self._state.update(kwargs)
            self._state["timestamp"] = _ts()

    def _run(self):
        if self.stagger_secs:
            time.sleep(self.stagger_secs)

        while True:
            self._phase_idle()
            self._phase_auth()
            self._phase_param_discovery()
            self._phase_cable_check()
            self._phase_precharge()
            self._phase_start_charging()
            error_fired = self._phase_charging()
            self._phase_stopping(error_fired)

    # ------------------------------------------------------------------
    # Phase implementations
    # ------------------------------------------------------------------
    def _phase_idle(self):
        print(f"[Gun {self.outlet_number}] IDLE — waiting {CYCLE_IDLE_SECS}s")
        # Reset to clean idle state
        idle = self._build_idle_state()
        with self._lock:
            self._state.update(idle)
        time.sleep(CYCLE_IDLE_SECS)

    def _phase_auth(self):
        self.session_count += 1
        user_tag = _rand_rfid()
        ses_id   = _rand_session_id()
        evmac    = _rand_evmac()
        evccid   = evmac.replace(".", "").lower()
        print(f"[Gun {self.outlet_number}] AUTH  session #{self.session_count}  user={user_tag}")
        self._set(
            phs=2, phsAuth=5,
            auth=True,
            user=user_tag,
            curr_ses_id=ses_id,
            curr_ses_active=True,
            sessionStart=_ts(),
            EVMAC=evmac,
            EVCCID=evccid,
            displayScreen=2,
        )
        time.sleep(5)

    def _phase_param_discovery(self):
        print(f"[Gun {self.outlet_number}] PARAM_DISCOVERY")
        self._set(phs=3, phsPD=5, busy=True, sessionPending=False)
        time.sleep(5)

    def _phase_cable_check(self):
        print(f"[Gun {self.outlet_number}] CABLE_CHECK")
        self._set(phs=4, phsCC=5)
        time.sleep(8)

    def _phase_precharge(self):
        print(f"[Gun {self.outlet_number}] PRECHARGE")
        target_v = random.randint(380, 500)
        self._set(phs=5, phsPre=5, tv=target_v, evsemaxv=target_v)
        # Ramp voltage over 10 s
        steps = 10
        for i in range(steps):
            pv = int(target_v * (i + 1) / steps)
            self._set(pv=pv, extVolt=pv, intVolt=pv)
            time.sleep(1)

    def _phase_start_charging(self):
        print(f"[Gun {self.outlet_number}] START_CHARGING")
        self._set(
            phs=6, phsStart=5,
            CCSCharging=True,
            pilot=3,
            evsestat=1,
            startCharging=True,
            displayScreen=6,
        )
        time.sleep(5)

    def _phase_charging(self) -> bool:
        """Returns True if an error fired and stopped the session."""
        is_error_session = (self.session_count % 2 == 1)
        print(f"[Gun {self.outlet_number}] CHARGING  error_session={is_error_session}")

        target_v  = self._state.get("tv", 420)
        max_amps  = random.randint(50, 100)
        start_soc = random.randint(10, 30)
        end_soc   = min(start_soc + random.randint(30, 60), 95)

        self._set(
            phs=7, phsCha=5,
            busy=True,
            startCharging=False,
            evsemaxc=max_amps,
            tc=max_amps,
            soc=start_soc,
            EVRESSSOC=round(start_soc / 100, 2),
        )

        # For odd sessions: pick a random error time between 15 and 60 s
        error_fire_at = None
        error_field   = None
        if is_error_session:
            error_fire_at = random.uniform(15, min(60, CYCLE_CHARGE_SECS - 5))
            error_field   = random.choice(ERROR_OBJ_CANDIDATES)

        session_start_time = time.time()
        wh_accumulated     = 0.0
        tick               = 1.0  # seconds per tick

        elapsed = 0.0
        while elapsed < CYCLE_CHARGE_SECS:
            time.sleep(tick)
            elapsed = time.time() - session_start_time

            # Ramp current up during first 10 s, then hold
            ramp_frac = min(elapsed / 10.0, 1.0)
            pc  = round(max_amps * ramp_frac, 1)
            pp  = round(pc * target_v, 0)
            pv  = target_v + random.uniform(-2, 2)
            soc = start_soc + int((end_soc - start_soc) * elapsed / CYCLE_CHARGE_SECS)
            wh_accumulated += pp * tick / 3600.0

            self._set(
                pc=pc, pp=pp, pv=round(pv, 1),
                soc=soc,
                EVRESSSOC=round(soc / 100, 2),
                curr_ses_Wh=round(wh_accumulated, 2),
                curr_ses_secs=int(elapsed),
                can1_RX_m0_presentCurrent=pc,
                can1_RX_m0_presentVoltage=round(pv, 1),
            )

            # Fire error if scheduled
            if error_fire_at is not None and elapsed >= error_fire_at:
                vendor_code = ERROR_OBJ_VENDOR_CODE[error_field]
                print(f"[Gun {self.outlet_number}] ERROR FIRED: {error_field} (vendor={vendor_code})")
                with self._lock:
                    self._state["errorObj"][error_field] = True
                    self._state["hasError"]              = True
                    self._state["errorStop"]             = True
                    self._state["curr_ses_error"]        = vendor_code
                    self._state["curr_ses_errors_list"]  = str(vendor_code)
                    self._state["curr_ses_errMsg"]       = error_field
                    self._state["curr_ses_success"]      = False
                    self._state["curr_ses_endBy"]        = "error"
                    self._state["timestamp"]             = _ts()
                return True  # error session ended early

        # Clean end
        print(f"[Gun {self.outlet_number}] CHARGING complete — clean end")
        self._set(
            curr_ses_success=True,
            curr_ses_endBy="ev",
            stopReason="EVDisconnected",
        )
        return False

    def _phase_stopping(self, error_fired: bool):
        print(f"[Gun {self.outlet_number}] STOPPING  error={error_fired}")
        self._set(
            phs=8, phsStop=5,
            CCSCharging=False,
            stopCharging=True,
            startCharging=False,
            pc=0, pp=0,
            displayScreen=8,
        )
        time.sleep(5)
        # Transition out of active session
        self._set(
            curr_ses_active=False,
            busy=False,
            auth=False,
            pilot=0,
            pv=0, pc=0, pp=0, tc=0, soc=0,
            EVRESSSOC=-1,
            stopCharging=False,
            sessionPending=True,
            displayScreen=10,
        )


# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)


def _ok():
    return Response("OK", status=200, mimetype="text/plain")


# ---------------------------------------------------------------------------
# Outlet instances
# ---------------------------------------------------------------------------
GUN_A = OutletSim(
    outlet_number=1,
    outlet_id=1,
    controller_id="secc2300-21641",
    stagger_secs=0,
)
GUN_B = OutletSim(
    outlet_number=2,
    outlet_id=2,
    controller_id="secc2300-22700",
    stagger_secs=GUN_B_STAGGER_SECS,
)

GUNS = [GUN_A, GUN_B]

OUTLET_SPECS = [
    {"mock": True, "type": "CCS", "ip": "127.0.0.1",
     "number": 1, "outletId": 1, "port": 5683, "http": False, "out_of_order": False},
    {"mock": True, "type": "CCS", "ip": "127.0.0.1",
     "number": 2, "outletId": 2, "port": 5683, "http": False, "out_of_order": False},
]


# ---------------------------------------------------------------------------
# Routes — Charger Global
# ---------------------------------------------------------------------------
@app.get("/id")
def get_id():
    return Response(DEVICE_ID, mimetype="text/plain")

@app.get("/state")
def get_state():
    return jsonify([g.get_state() for g in GUNS])

@app.get("/release")
def get_release():
    return Response(RELEASE_STR, mimetype="text/plain")

@app.get("/version")
def get_version():
    return Response("1.2.x-sim", mimetype="text/plain")

@app.get("/macaddress")
def get_macaddress():
    return Response(
        "lo: 00:00:00:00:00:00\nbond0: b6:0c:4e:99:30:d8\neth0: 66:ad:45:26:5f:2e\n",
        mimetype="text/plain",
    )

@app.get("/updates")
def get_updates():
    return jsonify({"timestamp": _ts()})

@app.post("/reset")
def post_reset():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — Outlets
# ---------------------------------------------------------------------------
@app.get("/outlets")
def get_outlets():
    return jsonify(OUTLET_SPECS)

@app.get("/outlets/<int:number>")
def get_outlet(number):
    specs = [s for s in OUTLET_SPECS if s["number"] == number]
    if not specs:
        return jsonify({"error": "Outlet not existing"}), 404
    return jsonify(specs[0])

@app.get("/outlets/<int:number>/state")
def get_outlet_state(number):
    guns = [g for g in GUNS if g.outlet_number == number]
    if not guns:
        return jsonify({"error": "Outlet not existing"}), 404
    return jsonify(guns[0].get_state())

@app.get("/outlets/<int:number>/updates")
def get_outlet_updates(number):
    return jsonify({"timestamp": _ts()})

@app.post("/outlets/<int:number>/state")
@app.post("/outlets/<int:number>/auth")
@app.post("/outlets/<int:number>/stop")
@app.post("/outlets/<int:number>/out_of_order")
@app.post("/outlets/<int:number>/powercap")
@app.post("/outlets/<int:number>/e-stop")
@app.post("/outlets/<int:number>/evseid")
@app.post("/outlets/<int:number>/cert")
@app.post("/outlets/<int:number>/debug")
@app.post("/outlets/<int:number>/unplug")
@app.post("/outlets/<int:number>/test")
@app.post("/outlets/<int:number>/test/override")
@app.delete("/outlets/<int:number>/test")
def outlet_commands(number):
    return _ok()


# ---------------------------------------------------------------------------
# Routes — OCPP Client
# ---------------------------------------------------------------------------
OCPP_CONFIG = {
    "chargingPointModel":       "CLASSIC",
    "chargingPointVendor":      "QUENCH",
    "chargePointSerialNumber":  "SIM-01",
    "OCPPEndpointToBackend":    "ws://localhost:8000/sim",
    "chargerName":              "NOC-Simulator",
    "protocol":                 "ocpp1.6",
    "RFIDEnabled":              True,
    "autoChargeMode":           True,
    "NumberOfConnectors":       2,
    # NOC_URL intentionally omitted — CMS script falls back to its default SERVER_URL
}

@app.get("/ocpp-client/config")
def get_ocpp_config():
    return jsonify(OCPP_CONFIG)

@app.post("/ocpp-client/config")
@app.post("/ocpp-client/start")
@app.post("/ocpp-client/stop")
@app.post("/ocpp-client/restart")
@app.post("/ocpp-client/autoChargeMode")
def ocpp_commands():
    return _ok()

@app.get("/ocpp-client/servicestatus")
@app.get("/ocpp-client/connectionstatus")
def ocpp_status():
    return _ok()

@app.get("/ocpp-client/logs/<logfile>")
def ocpp_logs(logfile):
    return Response("Simulated OCPP log — no real data\n", mimetype="text/plain")


# ---------------------------------------------------------------------------
# Routes — Controller based (state logs)
# ---------------------------------------------------------------------------
def _generate_log_lines(gun: OutletSim, count: int = 500) -> str:
    """Generate realistic-looking state log text (one JSON snapshot per line)."""
    state = gun.get_state()
    lines = []
    base_ts = _ts() - count * 2000  # 2 s apart going backwards
    for i in range(count):
        snap = dict(state)
        snap["timestamp"] = base_ts + i * 2000
        snap["phs"]       = 1 if i < count // 3 else (7 if i < 2 * count // 3 else 8)
        snap["curr_ses_secs"] = max(0, i * 2 - count // 3 * 2)
        snap["curr_ses_Wh"]   = round(snap["curr_ses_secs"] * 15.0, 2)
        lines.append(json.dumps(snap))
    return "\n".join(lines) + "\n"

@app.get("/controllers/<int:seccid>/api/outlets/<int:outlet_id>/log/state/full")
def get_state_log_full(seccid, outlet_id):
    guns = [g for g in GUNS if g.outlet_number == seccid]
    gun  = guns[0] if guns else GUN_A
    log_text = _generate_log_lines(gun, count=500)
    return Response(log_text, mimetype="text/plain")

@app.get("/controllers/<int:seccid>/api/outlets/<int:outlet_id>/log/state/fullzero")
def get_state_log_fullzero(seccid, outlet_id):
    return Response("", mimetype="text/plain")

# Remaining controller-based routes — no-ops
@app.post("/controllers/<int:seccid>/api/outlets/<int:outlet_id>/restartStack")
@app.post("/controllers/<int:seccid>/api/system/restartcapo")
@app.post("/controllers/<int:seccid>/api/system/reboot")
@app.post("/controllers/<int:seccid>/api/system/timeFromBrowser")
@app.get("/controllers/<int:seccid>/api/system/facts")
@app.get("/controllers/<int:seccid>/api/system/update/status")
@app.get("/controllers/<int:seccid>/api/system/iostate")
def controller_ops(seccid, **kwargs):
    return _ok()


# ---------------------------------------------------------------------------
# Routes — Auth service
# ---------------------------------------------------------------------------
@app.get("/services/auth/config/cpo/tariffs")
@app.get("/services/auth/config/enabled-methods")
@app.get("/services/auth/config/cpo")
def auth_config_get():
    return jsonify({"defaultIncVat": 0, "perOutletIncVat": {},
                    "enabledMethods": ["RFID"], "currency": "INR"})

@app.post("/services/auth/config/cpo/tariffs")
@app.post("/services/auth/config/cpo")
def auth_config_post():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — Events
# ---------------------------------------------------------------------------
@app.post("/events/stream/inject")
def events_inject():
    return Response("ok", mimetype="text/plain")


# ---------------------------------------------------------------------------
# Routes — HMI
# ---------------------------------------------------------------------------
@app.get("/hmi")
@app.get("/hmi/config")
def hmi_get():
    return jsonify({})

@app.post("/hmi")
@app.put("/hmi/config")
@app.post("/hmi/config")
def hmi_post():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — Powerblock
# ---------------------------------------------------------------------------
@app.get("/services/powerblock/read")
@app.get("/services/powerblock/state")
def powerblock_get():
    return jsonify([])

@app.post("/services/powerblock/write")
def powerblock_write():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — RFID
# ---------------------------------------------------------------------------
@app.get("/services/rfid/reader")
def rfid_reader():
    return jsonify({"status": "ok"})

@app.get("/services/rfid/idtag")
def rfid_idtag():
    return jsonify({})

@app.post("/services/rfid/idtag")
@app.post("/services/rfid/clear")
def rfid_post():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — LED control
# ---------------------------------------------------------------------------
@app.get("/services/led-ctrl/colors")
def led_colors_get():
    return jsonify({"red": 0, "green": 255, "blue": 0, "channel": 0})

@app.post("/services/led-ctrl/colors")
@app.get("/services/led-ctrl/effects")
@app.post("/services/led-ctrl/effects")
def led_ops():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — Scripting
# ---------------------------------------------------------------------------
@app.get("/scripts")
@app.get("/scripts/active")
@app.get("/scripts/installed")
def scripts_get():
    return jsonify([])

@app.post("/scripts/active")
def scripts_post():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — OCPP services
# ---------------------------------------------------------------------------
@app.get("/services/ocpp/localAuthList")
def local_auth_list():
    return jsonify([])

@app.post("/services/ocpp/localAuthList")
@app.get("/services/ocpp/errorMapping")
@app.post("/services/ocpp/errorMapping")
def ocpp_services():
    return _ok()


# ---------------------------------------------------------------------------
# Routes — Docker apps (no-op)
# ---------------------------------------------------------------------------
@app.get("/docker-apps/containers/json")
def docker_containers():
    return jsonify([])

@app.get("/docker-apps/images/json")
def docker_images():
    return jsonify([])


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print(f"[Simulator] Starting EcoG charger simulator on port {PORT}")
    print(f"[Simulator] Device ID : {DEVICE_ID}")
    print(f"[Simulator] Gun A     : starts immediately")
    print(f"[Simulator] Gun B     : starts after {GUN_B_STAGGER_SECS}s stagger")
    GUN_A.start()
    GUN_B.start()
    app.run(host="0.0.0.0", port=PORT, threaded=True)
