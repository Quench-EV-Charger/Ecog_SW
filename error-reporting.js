/*
 * EcoG Error Reporting Script - v1.2.2 (size-optimized: comments stripped)
 * Copyright (c) EcoG GmbH 2023. All rights reserved.
 * Only licensed to be used on/with EcoG OS.
 * Commented source of record: error-reporting_R60.js
 */
const SCRIPT_VERSION = "1.2.4";

const errorObjCount = {
  powerLossErr: 0,
  eStopErr: 0,
  doorOpenErr: 0,
  outletTemperatureErr: 0,
  cabinetTemperatureErr: 0,
  overVoltageErr: 0,
  underVoltageErr: 0,
  powerModuleFailureErr: 0,
  gunTemperatureErr_1: 0,
  gunTemperatureErr_2: 0,
  powerModuleCommErr_1: 0,
  powerModuleCommErr_2: 0,
  groundFault: 0,
  imdResistanceErr_1: 0,
  imdResistanceErr_2: 0,
  imdFaultyErr: 0,
  ac_em_fail: 0
};

const errorObjRecoveryCount = {
  powerLossErr: 0,
  eStopErr: 0,
  doorOpenErr: 0,
  outletTemperatureErr: 0,
  cabinetTemperatureErr: 0,
  underVoltageErr: 0,
  overVoltageErr: 0,
  gunTemperatureErr_1: 0,
  gunTemperatureErr_2: 0,
  powerModuleCommErr_1: 0,
  powerModuleCommErr_2: 0,
  groundFault: 0,
  imdResistanceErr_1: 0,
  imdResistanceErr_2: 0,
  imdFaultyErr: 0,
  ac_em_fail: 0
};

let lastMonitoringSource = null;

const errorObj = {
  powerLossErr: false,
  eStopErr: false,
  doorOpenErr: false,
  outletTemperatureErr: false,
  cabinetTemperatureErr: false,
  overVoltageErr: false,
  underVoltageErr: false,
  powerModuleFailureErr: false,
  gunTemperatureErr_1: false,
  gunTemperatureErr_2: false,
  powerModuleCommErr_1: false,
  powerModuleCommErr_2: false,
  groundFault: false,
  imdResistanceErr_1: false,
  imdResistanceErr_2: false,
  imdFaultyErr: false,
  dcEnergyStuckErr_1: false,
  dcEnergyStuckErr_2: false,
  ac_em_fail: false
};

const dcEnergyTracker = {
  "1": { lastEnergy: null, lastChangeTime: null, tripped: false },
  "2": { lastEnergy: null, lastChangeTime: null, tripped: false },
};

const DC_ENERGY_STUCK_TIMEOUT_MS = 60 * 1000;

const errorObjThreshold = {
  powerLossErr: 1,
  powerLossRecovery: 2,
  eStopErr: 1,
  doorOpenErr: 1,
  outletTemperatureErr: 2,
  cabinetTemperatureErr: 2,
  overVoltageErr: 28,
  underVoltageErr: 28,
  powerModuleFailureErr: 3,
  gunTemperatureErr_1: 3,
  gunTemperatureErr_2: 3,
  powerModuleCommErr_1: 13,
  powerModuleCommErr_2: 13,
  groundFault: 3,
  imdResistanceErr_1: 1,
  imdResistanceErr_2: 1,
  imdFaultyErr: 28,
  imdFaultyRecovery: 3,
  ac_em_fail: 12,
  ac_em_fail_recovery: 3,

  eStopErr_recovery: 2,
  doorOpenErr_recovery: 2,
  outletTemperatureErr_recovery: 2,
  cabinetTemperatureErr_recovery: 2,
  underVoltageErr_recovery: 2,
  overVoltageErr_recovery: 2,
  gunTemperatureErr_1_recovery: 2,
  gunTemperatureErr_2_recovery: 2,
  powerModuleCommErr_1_recovery: 2,
  powerModuleCommErr_2_recovery: 2,
  groundFault_recovery: 2,
  imdResistanceErr_1_recovery: 2,
  imdResistanceErr_2_recovery: 2
};

const errorObjFlags = {
  powerLossErr: false,
  overVoltageErr: false,
  underVoltageErr: false,
  powerModuleFailureErr: false,
  ac_em_fail: false,
};

const UVTripState = {
  Idle: "Idle",
  AB: "_AB",
  BC: "_BC",
  CA: "_CA",
  All: "_All",
};

var Constants = {
  OVThresh: 490,
  UVThresh: 320,
  UV_OV_Hysteresis: 10,
  powermoduleundervoltage: 200
};

let powerSaveInIdleMode = false;
let emulatedMetering = false;

const configEndpoint = "http://10.20.27.50:3001/db/config";
const baseURL = "http://10.20.27.50:3001/";
const baseURLsecc = "http://10.20.27.100/api/system/userconfig";
const baseURLseccle = "http://10.20.27.101/api/system/userconfig";
let tripCaseUV = UVTripState.Idle;
let errIOSource = [];
let temperatures = {};
let voltage = {};

let chargingStartTime = {
  outlet1: null,
  outlet2: null
};

const COMM_GRACE_PERIOD_MS = 5000;

const onTestingMode = false;

let latestIOMapping = null;

let connectedControllers = [];

const incrementErrorCounter = (errorType) => {
  if (errorObjCount[errorType] < 512) {
    errorObjCount[errorType]++;
  }
};

let imdMonitorTimeout = null;
let imdMonitorActive = false;

const startIMDResistanceMonitor = async () => {
  imdMonitorActive = true;

  const loop = async () => {
    try {

      if (!imdMonitorActive) {
        console.log(`[v${SCRIPT_VERSION}] IMD monitor loop stopped.`);
        return;
      }

      const iostateValue = latestIOMapping;
      if (iostateValue !== undefined && iostateValue !== null && iostateValue.controller1 !== null) {
        const iostate = iostateValue.controller1;
        const IMDOnline = await getIMDData(iostate);

        if (IMDOnline && IMDOnline.type === 'bender') {
          console.log(`[v${SCRIPT_VERSION}] IMD type is bender. Stopping IMD resistance monitor loop.`);
          imdMonitorActive = false;
          return;
        }

        const states = await getFromApi("state");
        if (states !== undefined && states.length > 0) {

          await checkIMDResistance(states, iostateValue);
        }
      }

      if (imdMonitorActive) {
        imdMonitorTimeout = setTimeout(loop, 2000);
      }
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] Error in IMD resistance monitor loop`, err);

      if (imdMonitorActive) {
        imdMonitorTimeout = setTimeout(loop, 2000);
      }
    }
  };

  loop();
};

const stopIMDResistanceMonitor = () => {
  imdMonitorActive = false;
  if (imdMonitorTimeout) {
    clearTimeout(imdMonitorTimeout);
    imdMonitorTimeout = null;
  }
};

const getFromApi = async (path) => {
  try {
    const response = await fetch(`${baseURL}${path}`);

    if (!response.ok) {
      console.error(`[v${SCRIPT_VERSION}] [errorReporting] getFromApi ${path} returned HTTP ${response.status}`);
      return undefined;
    }

    const bodyText = await response.text();
    if (!bodyText || bodyText.trim().length === 0) {
      console.error(`[v${SCRIPT_VERSION}] [errorReporting] getFromApi ${path} returned an empty body`);
      return undefined;
    }

    let states;
    try {
      states = JSON.parse(bodyText);
    } catch (parseErr) {
      console.error(`[v${SCRIPT_VERSION}] [errorReporting] getFromApi ${path} returned malformed JSON (${parseErr.message})`);
      return undefined;
    }

    if (states !== undefined) {
      if (!Array.isArray(states)) states = [states];
      states = states.filter((state) => state.online);
      return states;
    }
    return undefined;
  } catch (err) {

    console.error(`[v${SCRIPT_VERSION}] [errorReporting] error in getFromApi `, err);
    return undefined;
  }
};

const getConnectedControllers = async () => {
  try {
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] Fetching connected controllers from API...`);
    const response = await fetch(`${baseURL}controllers`);

    if (!response.ok) {
      throw new Error(`controllers endpoint returned HTTP ${response.status}`);
    }
    const bodyText = await response.text();
    if (!bodyText || bodyText.trim().length === 0) {
      throw new Error("controllers endpoint returned an empty body");
    }
    const controllers = JSON.parse(bodyText);

    connectedControllers = controllers.map(controller => controller.id);

    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] API Response:`, JSON.stringify(controllers));
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] Connected controllers detected:`, connectedControllers);

    if (connectedControllers.includes(1)) {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 1: AVAILABLE ✓`);
    } else {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 1: NOT AVAILABLE ✗`);
    }

    if (connectedControllers.includes(2)) {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 2: AVAILABLE ✓`);
    } else {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 2: NOT AVAILABLE ✗`);
    }

    if (connectedControllers.length === 2) {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER CONFIG] Running in DUAL controller mode`);
    } else if (connectedControllers.length === 1) {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER CONFIG] Running in SINGLE controller mode (Controller ` + connectedControllers[0] + `)`);
    } else if (connectedControllers.length === 0) {
      console.log(`[v${SCRIPT_VERSION}] [CONTROLLER CONFIG] WARNING: No controllers detected!`);
    }

    return connectedControllers;
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] Error fetching connected controllers:`, err.message);
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] Using fallback configuration: [1, 2]`);

    connectedControllers = [1, 2];
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 1: ASSUMED AVAILABLE (fallback)`);
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 2: ASSUMED AVAILABLE (fallback)`);
    return connectedControllers;
  }
};

const IOMAPPER_FETCH_TIMEOUT_MS = 5000;

const fetchControllerIoMapper = async (controllerNum) => {

  let timeoutId = null;
  try {
    const fetchOptions = { headers: { "Content-Type": "application/json" } };
    if (typeof AbortController !== "undefined") {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), IOMAPPER_FETCH_TIMEOUT_MS);
      fetchOptions.signal = controller.signal;
    }

    const response = await fetch(`${baseURL}controllers/${controllerNum}/api/proxy/iomapper/`, fetchOptions);

    if (!response.ok) {
      let errBody = "";
      try {
        errBody = (await response.text()).trim();
      } catch (bodyErr) {
        errBody = `<body unreadable: ${bodyErr.message}>`;
      }
      const bodySnippet = errBody.length > 500
        ? `${errBody.slice(0, 500)}... [truncated, ${errBody.length} chars total]`
        : (errBody || "<empty body>");
      console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller ${controllerNum} returned HTTP ${response.status} - treating as unavailable. Response body: ${bodySnippet}`);
      return null;
    }

    const bodyText = await response.text();
    if (!bodyText || bodyText.trim().length === 0) {
      console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller ${controllerNum} returned an empty body - treating as unavailable`);
      return null;
    }

    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller ${controllerNum} returned malformed JSON (${parseErr.message}) - treating as unavailable`);
      return null;
    }
  } catch (err) {

    if (err.name === "AbortError") {
      console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller ${controllerNum} request timed out after ${IOMAPPER_FETCH_TIMEOUT_MS}ms - treating as unavailable`);
    } else {
      console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Error fetching Controller ${controllerNum} data:`, err.message);
    }
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const ioMapperState = async () => {
  try {

    const controllers = connectedControllers.length > 0 ? connectedControllers : await getConnectedControllers();

    const result = {};

    if (controllers.includes(1)) {
      result.controller1 = await fetchControllerIoMapper(1);
    } else {
      console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller 1 not available - skipping data fetch`);
      result.controller1 = null;
    }

    if (controllers.includes(2)) {
      result.controller2 = await fetchControllerIoMapper(2);
    } else {
      console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller 2 not available - skipping data fetch`);
      result.controller2 = null;
    }

    return result;
  } catch (err) {

    console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Critical error in ioMapperState: ${err && err.message ? err.message : err}`);
    if (err && err.stack) console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Stack: ${err.stack}`);
    return { controller1: null, controller2: null };
  }
};

function postRequest(url, data) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response)
    .then((response) => response.text());
}

const trip = async (states, { msg, code, stopReason }) => {
  for (const obj of states) {
    try {
      console.log(`[v${SCRIPT_VERSION}] tripping outlet ` + obj.outlet);
      await postRequest(
        `${baseURL}controllers/${obj.outlet}/api/outlets/ccs/coap/e-stop`,
        { msg, code, stopReason }
      );
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] failed to trigger e-stop on outlet ${obj.outlet}`, err);
    }
  }
};

const untrip = async (states, code) => {
  for (const obj of states) {
    try {
      console.log(`[v${SCRIPT_VERSION}] un-tripping outlet ` + obj.outlet);
      await postRequest(
        `${baseURL}controllers/${obj.outlet}/api/outlets/ccs/coap/e-stop`,
        { reset: true }
      );
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] failed to reset e-stop on outlet ${obj.outlet}`, err);
    }
  }
};

async function checkIOTrip() {

  if (errIOSource.includes("emergency")) {
    errorObj.eStopErr = errorObjCount.eStopErr >= errorObjThreshold.eStopErr;
    incrementErrorCounter('eStopErr');
    errorObjCount.powerModuleCommErr_1 = 0;
    errorObjCount.powerModuleCommErr_2 = 0;

    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }

    errorObjRecoveryCount.eStopErr = 0;
  } else {

    if (errorObj.eStopErr) {
      errorObjRecoveryCount.eStopErr++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] E-Stop cleared, recovery counter: ${errorObjRecoveryCount.eStopErr}/${errorObjThreshold.eStopErr_recovery}`);

      if (errorObjRecoveryCount.eStopErr >= errorObjThreshold.eStopErr_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] E-Stop error recovered after ${errorObjThreshold.eStopErr_recovery} cycles`);
        errorObjCount.eStopErr = 0;
        errorObjRecoveryCount.eStopErr = 0;
        errorObj.eStopErr = false;
      }
    } else {
      errorObjCount.eStopErr = 0;
      errorObjRecoveryCount.eStopErr = 0;
    }
  }

  if (errIOSource.includes("door_open")) {
    errorObj.doorOpenErr =
      errorObjCount.doorOpenErr >= errorObjThreshold.doorOpenErr;
    incrementErrorCounter('doorOpenErr');
    errorObjRecoveryCount.doorOpenErr = 0;
  } else {

    if (errorObj.doorOpenErr) {
      errorObjRecoveryCount.doorOpenErr++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] Door closed, recovery counter: ${errorObjRecoveryCount.doorOpenErr}/${errorObjThreshold.doorOpenErr_recovery}`);

      if (errorObjRecoveryCount.doorOpenErr >= errorObjThreshold.doorOpenErr_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] Door open error recovered after ${errorObjThreshold.doorOpenErr_recovery} cycles`);
        errorObjCount.doorOpenErr = 0;
        errorObjRecoveryCount.doorOpenErr = 0;
        errorObj.doorOpenErr = false;
      }
    } else {
      errorObjCount.doorOpenErr = 0;
      errorObjRecoveryCount.doorOpenErr = 0;
    }
  }

  if (errIOSource.includes("outlet_temp")) {
    errorObj.outletTemperatureErr =
      errorObjCount.outletTemperatureErr >=
      errorObjThreshold.outletTemperatureErr;
    incrementErrorCounter('outletTemperatureErr');
    errorObjRecoveryCount.outletTemperatureErr = 0;
  } else {

    if (errorObj.outletTemperatureErr) {
      errorObjRecoveryCount.outletTemperatureErr++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] Outlet temperature normal, recovery counter: ${errorObjRecoveryCount.outletTemperatureErr}/${errorObjThreshold.outletTemperatureErr_recovery}`);

      if (errorObjRecoveryCount.outletTemperatureErr >= errorObjThreshold.outletTemperatureErr_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] Outlet temperature error recovered after ${errorObjThreshold.outletTemperatureErr_recovery} cycles`);
        errorObjCount.outletTemperatureErr = 0;
        errorObjRecoveryCount.outletTemperatureErr = 0;
        errorObj.outletTemperatureErr = false;
      }
    } else {
      errorObjCount.outletTemperatureErr = 0;
      errorObjRecoveryCount.outletTemperatureErr = 0;
    }
  }

  if (errIOSource.includes("cab_temp")) {
    errorObj.cabinetTemperatureErr =
      errorObjCount.cabinetTemperatureErr >=
      errorObjThreshold.cabinetTemperatureErr;
    incrementErrorCounter('cabinetTemperatureErr');
    errorObjRecoveryCount.cabinetTemperatureErr = 0;
  } else {

    if (errorObj.cabinetTemperatureErr) {
      errorObjRecoveryCount.cabinetTemperatureErr++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] Cabinet temperature normal, recovery counter: ${errorObjRecoveryCount.cabinetTemperatureErr}/${errorObjThreshold.cabinetTemperatureErr_recovery}`);

      if (errorObjRecoveryCount.cabinetTemperatureErr >= errorObjThreshold.cabinetTemperatureErr_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] Cabinet temperature error recovered after ${errorObjThreshold.cabinetTemperatureErr_recovery} cycles`);
        errorObjCount.cabinetTemperatureErr = 0;
        errorObjRecoveryCount.cabinetTemperatureErr = 0;
        errorObj.cabinetTemperatureErr = false;
      }
    } else {
      errorObjCount.cabinetTemperatureErr = 0;
      errorObjRecoveryCount.cabinetTemperatureErr = 0;
    }
  }

  if (
    errIOSource.includes("guna1_temp") ||
    errIOSource.includes("guna2_temp")
  ) {
    errorObj.gunTemperatureErr_1 =
      errorObjCount.gunTemperatureErr_1 >=
      errorObjThreshold.gunTemperatureErr_1;
    incrementErrorCounter('gunTemperatureErr_1');
    errorObjRecoveryCount.gunTemperatureErr_1 = 0;
  } else {

    if (errorObj.gunTemperatureErr_1) {
      errorObjRecoveryCount.gunTemperatureErr_1++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] Gun 1 temperature normal, recovery counter: ${errorObjRecoveryCount.gunTemperatureErr_1}/${errorObjThreshold.gunTemperatureErr_1_recovery}`);

      if (errorObjRecoveryCount.gunTemperatureErr_1 >= errorObjThreshold.gunTemperatureErr_1_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] Gun 1 temperature error recovered after ${errorObjThreshold.gunTemperatureErr_1_recovery} cycles`);
        errorObjCount.gunTemperatureErr_1 = 0;
        errorObjRecoveryCount.gunTemperatureErr_1 = 0;
        errorObj.gunTemperatureErr_1 = false;
      }
    } else {
      errorObjCount.gunTemperatureErr_1 = 0;
      errorObjRecoveryCount.gunTemperatureErr_1 = 0;
    }
  }

  if (
    errIOSource.includes("gunb1_temp") ||
    errIOSource.includes("gunb2_temp")
  ) {
    errorObj.gunTemperatureErr_2 =
      errorObjCount.gunTemperatureErr_2 >=
      errorObjThreshold.gunTemperatureErr_2;
    incrementErrorCounter('gunTemperatureErr_2');
    errorObjRecoveryCount.gunTemperatureErr_2 = 0;
  } else {

    if (errorObj.gunTemperatureErr_2) {
      errorObjRecoveryCount.gunTemperatureErr_2++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] Gun 2 temperature normal, recovery counter: ${errorObjRecoveryCount.gunTemperatureErr_2}/${errorObjThreshold.gunTemperatureErr_2_recovery}`);

      if (errorObjRecoveryCount.gunTemperatureErr_2 >= errorObjThreshold.gunTemperatureErr_2_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] Gun 2 temperature error recovered after ${errorObjThreshold.gunTemperatureErr_2_recovery} cycles`);
        errorObjCount.gunTemperatureErr_2 = 0;
        errorObjRecoveryCount.gunTemperatureErr_2 = 0;
        errorObj.gunTemperatureErr_2 = false;
      }
    } else {
      errorObjCount.gunTemperatureErr_2 = 0;
      errorObjRecoveryCount.gunTemperatureErr_2 = 0;
    }
  }

  if (errIOSource.includes("ground_fault")) {
    errorObj.groundFault =
      errorObjCount.groundFault >= errorObjThreshold.groundFault;
    incrementErrorCounter('groundFault');
    errorObjRecoveryCount.groundFault = 0;
  } else {

    if (errorObj.groundFault) {
      errorObjRecoveryCount.groundFault++;
      console.log(`[v${SCRIPT_VERSION}][RECOVERY] Ground fault cleared, recovery counter: ${errorObjRecoveryCount.groundFault}/${errorObjThreshold.groundFault_recovery}`);

      if (errorObjRecoveryCount.groundFault >= errorObjThreshold.groundFault_recovery) {
        console.log(`[v${SCRIPT_VERSION}][RECOVERY] Ground fault error recovered after ${errorObjThreshold.groundFault_recovery} cycles`);
        errorObjCount.groundFault = 0;
        errorObjRecoveryCount.groundFault = 0;
        errorObj.groundFault = false;
      }
    } else {
      errorObjCount.groundFault = 0;
      errorObjRecoveryCount.groundFault = 0;
    }
  }
}

function getConvArr(state) {
  let convTimeout = [];
  if (state.can1_RX_time && !state.can1_RX_time.conv_timeout) {

    for (let i = 0; i < state["numberOfModulesAvailable"]; i++) {
      if (!state.can1_RX_time[`mod_${i + 1}_timeout`]) {
        convTimeout.push(i);
      }
    }
  }
  return convTimeout;
}

function getVoltages(state) {
  let arr = [];

  for (let i = 0; i < getConvArr(state).length; i++) {
    const volt_ab = state[`can1_RX_m${i}_inputVoltage_AB`] || 0;
    const volt_bc = state[`can1_RX_m${i}_inputVoltage_BC`] || 0;
    const volt_ca = state[`can1_RX_m${i}_inputVoltage_CA`] || 0;
    arr.push(volt_ab, volt_bc, volt_ca);
  }
  return arr;
}

function getPhaseVoltages(state, phase) {
  let arr = [];

  for (let i = 0; i < getConvArr(state).length; i++) {
    const volt = state[`can1_RX_m${i}_${phase}`] || 0;
    arr.push(volt);
  }
  return arr;
}
const getVoltageArr = (states) => {

  const volts_arr = states
    .filter((o) => o.online)
    .reduce((a, o) => {
      a.push(getVoltages(o));
      return a;
    }, []);

  return [].concat.apply([], volts_arr);
};

const checkVoltsAboveThres = (currentValue) =>
  currentValue > Constants.UVThresh + Constants.UV_OV_Hysteresis;
const checkVoltsBelowThres = (currentValue) =>
  currentValue < Constants.UVThresh && currentValue > Constants.powermoduleundervoltage;

const checkVoltsBelow200 = (currentValue) =>
  currentValue < Constants.powermoduleundervoltage;

const checkTwoPhasesBelow200 = (voltages) => {
  const below200Count = voltages.filter(v => v < Constants.powermoduleundervoltage).length;
  return below200Count >= 2;
};

const checkOnePhasesBelow200 = (voltages) => {
  const below200Count = voltages.filter(v => v < Constants.powermoduleundervoltage).length;
  return below200Count === 1;
};

const powerrecoveracmeter = async (states, iostate) => {
  if (iostate["modbus.selec.online"] === true && errorObj.powerLossErr) {

    errorObjRecoveryCount.powerLossErr++;
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] AC meter online, recovery counter: ${errorObjRecoveryCount.powerLossErr}/${errorObjThreshold.powerLossRecovery}`);

    if (errorObjRecoveryCount.powerLossErr >= errorObjThreshold.powerLossRecovery) {
      console.log(`[v${SCRIPT_VERSION}][PL] Power loss recovered - AC meter stable for ${errorObjThreshold.powerLossRecovery} cycles, untripping.`);
      errorObjCount.powerLossErr = 0;
      errorObjRecoveryCount.powerLossErr = 0;
      errorObj.powerLossErr = false;
      errorObjFlags.powerLossErr = false;
      await untrip(states, "70");
    }
  } else {

    if (errorObjRecoveryCount.powerLossErr > 0) {
      console.log(`[v${SCRIPT_VERSION}][PL-Recovery] Conditions changed, resetting recovery counter: 0/${errorObjThreshold.powerLossRecovery}`);
      errorObjRecoveryCount.powerLossErr = 0;
    }
  }
};

const powerONRecoverCheck = async (states, volts) => {

  if (errorObj.powerLossErr && errorObjFlags.powerLossErr) {

    errorObjRecoveryCount.powerLossErr++;
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] IMD online, recovery counter: ${errorObjRecoveryCount.powerLossErr}/${errorObjThreshold.powerLossRecovery}`);

    if (errorObjRecoveryCount.powerLossErr >= errorObjThreshold.powerLossRecovery) {
      console.log(`[v${SCRIPT_VERSION}][PL] Power loss recovered - IMD stable for ${errorObjThreshold.powerLossRecovery} cycles, untripping.`);
      errorObjCount.powerLossErr = 0;
      errorObjRecoveryCount.powerLossErr = 0;
      errorObj.powerLossErr = false;
      errorObjFlags.powerLossErr = false;
      await untrip(states, "70");
    }
  } else {

    if (errorObjRecoveryCount.powerLossErr > 0) {
      console.log(`[v${SCRIPT_VERSION}][PL-Recovery] IMD conditions changed, resetting recovery counter: 0/${errorObjThreshold.powerLossRecovery}`);
      errorObjRecoveryCount.powerLossErr = 0;
    }
  }
};
const powerfailacmeter = async (states, iostate) => {
  errorObj.powerLossErr =
    errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
  incrementErrorCounter('powerLossErr');
  if (errorObjCount.underVoltageErr > 0) {
    errorObjCount.underVoltageErr = 0;
  }

  return;
};

const powerOffErrCheck = async (states, volts) => {
  const isModuleUnavilable = states.every(
    (obj) => obj.can1_RX_time && obj.can1_RX_time.conv_timeout === true
  );
  if (volts.some(checkVoltsBelow200)) {
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
    incrementErrorCounter('powerLossErr');
    console.log(
      `[v${SCRIPT_VERSION}] [PL] Power loss counter incremented: ${errorObjCount.powerLossErr}/${errorObjThreshold.powerLossErr}, voltage < 200V: ${volts}`
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
  } else if (
    volts.length > 0 &&
    !errorObj.powerLossErr &&
    volts.every(checkVoltsBelowThres)

  ) {
    incrementErrorCounter('powerLossErr');
    console.log(
      `[v${SCRIPT_VERSION}] [PL] Power loss counter incremented: ${errorObjCount.powerLossErr}/${errorObjThreshold.powerLossErr}, IMD offline + all phases < ${Constants.UVThresh}V: ${volts}`
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;

    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
  } else if (
    !errorObj.powerLossErr &&

    isModuleUnavilable
  ) {
    incrementErrorCounter('powerLossErr');
    console.log(
      `[v${SCRIPT_VERSION}] [PL] Power loss counter incremented: ${errorObjCount.powerLossErr}/${errorObjThreshold.powerLossErr}, IMD offline + module unavailable`
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;

    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
  } else if (
    volts.length > 0 &&
    !errorObj.eStopErr &&
    errorObj.powerLossErr &&
    volts.every(checkVoltsAboveThres) &&
    errorObjFlags.powerLossErr
  ) {
    console.log(
      `[v${SCRIPT_VERSION}] Bender/gongyuan offline, no eStopErr, power resumed, untrip power loss`
    );
    await powerONRecoverCheck(states, volts);
    return;
  } else {

    if (!errorObj.powerLossErr &&
      volts.length > 0 &&
      !volts.some(checkVoltsBelow200) &&
      !volts.every(checkVoltsBelowThres) &&
      !isModuleUnavilable) {
      if (errorObjCount.powerLossErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [PL] Power loss counter reset: 0/${errorObjThreshold.powerLossErr}, voltage normal and modules available`);
      }
      errorObjCount.powerLossErr = 0;
    }
  }

  if (errorObj.powerLossErr && !errorObjFlags.powerLossErr) {
    errorObjFlags.powerLossErr = true;
    console.log(
      `[v${SCRIPT_VERSION}] Bender/gongyuan offline, no communication to power module -> its power loss and we trip`
    );
    await trip(states, {
      msg: "ERR_POWERLOSS",
      code: "70",
      stopReason: "PowerLossError",
    });
  }
};

const checkUnderVoltageThroughPowerModule = async (
  states,
  voltages,
  t_case
) => {

  if (voltages.length === 0) {

    if (tripCaseUV == t_case && errorObjCount.underVoltageErr > 0) {
      console.log(`[v${SCRIPT_VERSION}] [UV] Undervoltage counter reset: 0/${errorObjThreshold.underVoltageErr} for phase ${t_case}, no voltage data available`);
      errorObjCount.underVoltageErr = 0;
      tripCaseUV = UVTripState.Idle;
    }
    return;
  }

  if (voltages.every(checkVoltsBelowThres)) {
    !!onTestingMode &&
      console.log(
        `[v${SCRIPT_VERSION}] Condition UnderVoltage, for phase ` +
        t_case +
        ` count ` +
        errorObjCount.underVoltageErr
      );

    if (tripCaseUV == UVTripState.Idle) {

      tripCaseUV = t_case;
    }

    if (
      !errorObj.underVoltageErr &&
      !errorObjFlags.underVoltageErr &&
      tripCaseUV == t_case
    ) {
      incrementErrorCounter('underVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [UV] Undervoltage counter incremented: ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr} for phase ${t_case}, voltages: ${voltages}`);
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] supply voltage is too low: ${voltages}`);
      errorObjFlags.underVoltageErr = true;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
  } else {

    if (tripCaseUV == t_case && !errorObj.underVoltageErr) {
      if (errorObjCount.underVoltageErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [UV] Undervoltage counter reset: 0/${errorObjThreshold.underVoltageErr} for phase ${t_case}, voltages normal: ${voltages}`);
      }
      errorObjCount.underVoltageErr = 0;
      tripCaseUV = UVTripState.Idle;
    }
  }
};

async function checkSuppyVoltageTripACmeter(states, volts, iostate) {
  const isOverThreshold = (currentValue) => currentValue > Constants.OVThresh;
  const isUnderThreshold = (currentValue) => currentValue < Constants.UVThresh;

  if (volts.some(isOverThreshold)) {
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] It's OverVoltage`);
    if (!errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      incrementErrorCounter('overVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [OV-AC] Overvoltage counter incremented: ${errorObjCount.overVoltageErr}/${errorObjThreshold.overVoltageErr}, voltages: ${volts}`);
      errorObj.overVoltageErr =
        errorObjCount.overVoltageErr >= errorObjThreshold.overVoltageErr;
    } else if (errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] Supply voltage is too high: ${volts}`);
      errorObjFlags.overVoltageErr = true;
      await trip(states, {
        msg: "ERR_OVER_VOLTAGE",
        code: "999",
        stopReason: "OverVoltageError",
      });
    }
  } else {

    if (!errorObj.overVoltageErr) {
      if (errorObjCount.overVoltageErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [OV-AC] Overvoltage counter reset: 0/${errorObjThreshold.overVoltageErr}, voltages normal: ${volts}`);
      }
      errorObjCount.overVoltageErr = 0;
    }
  }

  const benderOnline = iostate && iostate["modbus.ccs_bender.online"] === true;

  const gongyuanOnline = iostate && iostate["modbus.gongyuan.online"] === true;

  if (checkTwoPhasesBelow200(volts) && (benderOnline || gongyuanOnline)) {
    console.log(`[v${SCRIPT_VERSION}] [UV-AC] Undervoltage detected - 2+ phases < ${Constants.powermoduleundervoltage}V with Bender online: ${volts}`);
    if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      incrementErrorCounter('underVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [UV-AC] Undervoltage counter incremented (2 phases < 200V, Bender online): ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr}, voltages: ${volts}`);
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] Supply voltage too low (2 phases < 200V with Bender online): ${volts}`);
      errorObjFlags.underVoltageErr = true;
      tripCaseUV = UVTripState.Idle;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
    return;
  } else if (checkTwoPhasesBelow200(volts) && !(benderOnline || gongyuanOnline)) {

    console.log(`[v${SCRIPT_VERSION}] [PL-AC] Power loss detected - 2+ phases < ${Constants.powermoduleundervoltage}V: ${volts}`);
    incrementErrorCounter('powerLossErr');
    errorObj.powerLossErr = errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;

    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }

    if (errorObj.powerLossErr && !errorObjFlags.powerLossErr) {
      errorObjFlags.powerLossErr = true;
      console.log(`[v${SCRIPT_VERSION}] AC meter: 2+ phases < 200V -> power loss trip`);
      await trip(states, {
        msg: "ERR_POWERLOSS",
        code: "70",
        stopReason: "PowerLossError",
      });
    }
    return;
  }

  if (checkOnePhasesBelow200(volts)) {
    console.log(`[v${SCRIPT_VERSION}] [UV-AC] Single phase undervoltage alarm - 1 phase < ${Constants.powermoduleundervoltage}V: ${volts}`);
    if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      incrementErrorCounter('underVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [UV-AC] Single phase undervoltage counter incremented: ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr}, voltages: ${volts}`);
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] Single phase voltage too low: ${volts}`);
      errorObjFlags.underVoltageErr = true;
      tripCaseUV = UVTripState.Idle;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
    return;
  }

  if (volts.some(isUnderThreshold)) {
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] Condition UnderVoltage`);
    if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      incrementErrorCounter('underVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [UV-AC] Undervoltage counter incremented: ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr}, voltages: ${volts}`);
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] Supply voltage is too low: ${volts}`);
      errorObjFlags.underVoltageErr = true;

      tripCaseUV = UVTripState.Idle;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
  } else {

    if (!errorObj.underVoltageErr) {
      if (errorObjCount.underVoltageErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [UV-AC] Undervoltage counter reset: 0/${errorObjThreshold.underVoltageErr}, voltages normal: ${volts}`);
      }
      errorObjCount.underVoltageErr = 0;
      tripCaseUV = UVTripState.Idle;
    }
  }
}

async function checkSuppyVoltageTrip(states, volts, iostate) {

  const isOverThreshold = (currentValue) => currentValue > Constants.OVThresh;
  if (volts.some(isOverThreshold)) {
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] its OverVoltage `);
    if (!errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      incrementErrorCounter('overVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [OV] Overvoltage counter incremented: ${errorObjCount.overVoltageErr}/${errorObjThreshold.overVoltageErr}, voltages: ${volts}`);
      errorObj.overVoltageErr =
        errorObjCount.overVoltageErr >= errorObjThreshold.overVoltageErr;
    } else if (errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] supply voltage is too high: ${volts}`);
      errorObjFlags.overVoltageErr = true;
      await trip(states, {
        msg: "ERR_OVER_VOLTAGE",
        code: "999",
        stopReason: "OverVoltageError",
      });
    }
  } else {

    if (!errorObj.overVoltageErr) {
      if (errorObjCount.overVoltageErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [OV] Overvoltage counter reset: 0/${errorObjThreshold.overVoltageErr}, voltages normal: ${volts}`);
      }
      errorObjCount.overVoltageErr = 0;
    }
  }

  const benderOnline = iostate && iostate["modbus.ccs_bender.online"] === true;

  const gongyuanOnline = iostate && iostate["modbus.gongyuan.online"] === true;

  if (checkTwoPhasesBelow200(volts) && (benderOnline || gongyuanOnline)) {
    console.log(`[v${SCRIPT_VERSION}] [UV-PM] Undervoltage detected - 2+ phases < ${Constants.powermoduleundervoltage}V with Bender online: ${volts}`);
    if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      incrementErrorCounter('underVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [UV-PM] Undervoltage counter incremented (2 phases < 200V, Bender online): ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr}, voltages: ${volts}`);
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] Supply voltage too low (2 phases < 200V with Bender online): ${volts}`);
      errorObjFlags.underVoltageErr = true;
      tripCaseUV = UVTripState.Idle;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
    return;
  } else if (checkTwoPhasesBelow200(volts) && !benderOnline) {

    console.log(`[v${SCRIPT_VERSION}] [PL-PM] Power loss detected - 2+ phases < ${Constants.powermoduleundervoltage}V: ${volts}`);
    incrementErrorCounter('powerLossErr');
    errorObj.powerLossErr = errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;

    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }

    if (errorObj.powerLossErr && !errorObjFlags.powerLossErr) {
      errorObjFlags.powerLossErr = true;
      console.log(`[v${SCRIPT_VERSION}] Power module: 2+ phases < 200V -> power loss trip`);
      await trip(states, {
        msg: "ERR_POWERLOSS",
        code: "70",
        stopReason: "PowerLossError",
      });
    }
    return;
  }

  if (checkOnePhasesBelow200(volts)) {
    console.log(`[v${SCRIPT_VERSION}] [UV-PM] Single phase undervoltage alarm - 1 phase < ${Constants.powermoduleundervoltage}V: ${volts}`);
    if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      incrementErrorCounter('underVoltageErr');
      console.log(`[v${SCRIPT_VERSION}] [UV-PM] Single phase undervoltage counter incremented: ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr}, voltages: ${volts}`);
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`[v${SCRIPT_VERSION}] Single phase voltage too low: ${volts}`);
      errorObjFlags.underVoltageErr = true;
      tripCaseUV = UVTripState.Idle;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
    return;
  }

  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.All) {
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] check trip for All phases`);
    await checkUnderVoltageThroughPowerModule(states, volts, UVTripState.All);
  }

  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.AB) {

    let case2_inV_AB = states.reduce((a, o) => {
      a.push(getPhaseVoltages(o, "inputVoltage_AB"));
      return a;
    }, []);
    case2_inV_AB = [].concat.apply([], case2_inV_AB);
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] check trip for Phase _AB`, case2_inV_AB);
    await checkUnderVoltageThroughPowerModule(
      states,
      case2_inV_AB,
      UVTripState.AB
    );
  }

  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.BC) {

    let case2_inV_BC = states.reduce((a, o) => {
      a.push(getPhaseVoltages(o, "inputVoltage_BC"));
      return a;
    }, []);
    case2_inV_BC = [].concat.apply([], case2_inV_BC);
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] check trip for Phase _BC`, case2_inV_BC);
    await checkUnderVoltageThroughPowerModule(
      states,
      case2_inV_BC,
      UVTripState.BC
    );
  }

  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.CA) {

    let case2_inV_CA = states.reduce((a, o) => {
      a.push(getPhaseVoltages(o, "inputVoltage_CA"));
      return a;
    }, []);
    case2_inV_CA = [].concat.apply([], case2_inV_CA);
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] check trip for Phase _CA`, case2_inV_CA);
    await checkUnderVoltageThroughPowerModule(
      states,
      case2_inV_CA,
      UVTripState.CA
    );
  }
}

async function checkRecoveryConditions(volts, states) {

  const checkPowerLossRecoveryVal = (currentValue) => currentValue > Constants.powermoduleundervoltage;
  if (
    errorObj.powerLossErr &&
    errorObjFlags.powerLossErr &&
    volts.length > 0 &&
    volts.every(checkPowerLossRecoveryVal)
  ) {

    errorObjRecoveryCount.powerLossErr++;
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] All phases > ${Constants.powermoduleundervoltage}V, recovery counter: ${errorObjRecoveryCount.powerLossErr}/${errorObjThreshold.powerLossRecovery}, volts: ${volts}`);

    if (errorObjRecoveryCount.powerLossErr >= errorObjThreshold.powerLossRecovery) {
      console.log(`[v${SCRIPT_VERSION}][PL] Power loss recovered - voltage stable for ${errorObjThreshold.powerLossRecovery} cycles, untripping.`);
      errorObjCount.powerLossErr = 0;
      errorObjRecoveryCount.powerLossErr = 0;
      errorObj.powerLossErr = false;
      errorObjFlags.powerLossErr = false;
      await untrip(states, "70");
    }
    return;
  } else if (errorObj.powerLossErr && errorObjRecoveryCount.powerLossErr > 0) {

    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] Voltage conditions not met, resetting recovery counter: 0/${errorObjThreshold.powerLossRecovery}`);
    errorObjRecoveryCount.powerLossErr = 0;
  }

  const checkUVRecoveryVal = (currentValue) =>
    currentValue > Constants.UVThresh + Constants.UV_OV_Hysteresis;
  if (
    errorObj.underVoltageErr &&
    errorObjFlags.underVoltageErr &&
    volts.every(checkUVRecoveryVal)
  ) {
    errorObjRecoveryCount.underVoltageErr++;
    console.log(`[v${SCRIPT_VERSION}][UV-RECOVERY] Voltage above ${Constants.UVThresh + Constants.UV_OV_Hysteresis}V, recovery counter: ${errorObjRecoveryCount.underVoltageErr}/${errorObjThreshold.underVoltageErr_recovery}, volts: ${volts}`);

    if (errorObjRecoveryCount.underVoltageErr >= errorObjThreshold.underVoltageErr_recovery) {
      console.log(`[v${SCRIPT_VERSION}][UV-RECOVERY] Undervoltage recovered after ${errorObjThreshold.underVoltageErr_recovery} stable cycles`);
      errorObjCount.underVoltageErr = 0;
      errorObjRecoveryCount.underVoltageErr = 0;
      errorObj.underVoltageErr = false;
      errorObjFlags.underVoltageErr = false;
      tripCaseUV = UVTripState.Idle;
      await untrip(states, "997");
    }
    return;
  } else if (errorObj.underVoltageErr && errorObjRecoveryCount.underVoltageErr > 0) {

    console.log(`[v${SCRIPT_VERSION}][UV-RECOVERY] Voltage conditions not met, resetting recovery counter: 0/${errorObjThreshold.underVoltageErr_recovery}`);
    errorObjRecoveryCount.underVoltageErr = 0;
  }

  const checkOVRecoveryVal = (currentValue) =>
    currentValue < Constants.OVThresh - Constants.UV_OV_Hysteresis;
  if (
    errorObj.overVoltageErr &&
    errorObjFlags.overVoltageErr &&
    volts.every(checkOVRecoveryVal)
  ) {
    errorObjRecoveryCount.overVoltageErr++;
    console.log(`[v${SCRIPT_VERSION}][OV-RECOVERY] Voltage below ${Constants.OVThresh - Constants.UV_OV_Hysteresis}V, recovery counter: ${errorObjRecoveryCount.overVoltageErr}/${errorObjThreshold.overVoltageErr_recovery}, volts: ${volts}`);

    if (errorObjRecoveryCount.overVoltageErr >= errorObjThreshold.overVoltageErr_recovery) {
      console.log(`[v${SCRIPT_VERSION}][OV-RECOVERY] Overvoltage recovered after ${errorObjThreshold.overVoltageErr_recovery} stable cycles`);
      errorObjCount.overVoltageErr = 0;
      errorObjRecoveryCount.overVoltageErr = 0;
      errorObj.overVoltageErr = false;
      errorObjFlags.overVoltageErr = false;
      await untrip(states, "997");
    }
    return;
  } else if (errorObj.overVoltageErr && errorObjRecoveryCount.overVoltageErr > 0) {

    console.log(`[v${SCRIPT_VERSION}][OV-RECOVERY] Voltage conditions not met, resetting recovery counter: 0/${errorObjThreshold.overVoltageErr_recovery}`);
    errorObjRecoveryCount.overVoltageErr = 0;
  }
}

function filterVolts(volts) {

  const isAllZero = volts.every((item) => item === 0);
  const someIsNotZero = volts.some((item) => item !== 0);
  if (isAllZero) {

    return [];
  } else if (someIsNotZero) {
    volts = volts.filter((val) => val !== 0);
  }
  return volts;
}

const injectEvent = async (e) => {
  await postRequest(`${baseURL}events/stream/inject`, {
    type: "alert",
    outlet: e.outlet,
    payload: e,
  });
};

function checkModuleFailure(obj) {
  if (
    obj.can1_RX_m0_moduleFailure ||
    obj.can1_RX_m1_moduleFailure ||
    obj.can1_RX_m2_moduleFailure ||
    obj.can1_RX_m3_moduleFailure
  ) {
    errorObj.powerModuleFailureErr =
      errorObjCount.powerModuleFailureErr >=
      errorObjThreshold.powerModuleFailureErr;
    incrementErrorCounter('powerModuleFailureErr');
  } else {
    errorObj.powerModuleFailureErr = false;
    errorObjCount.powerModuleFailureErr = 0;
    errorObjFlags.powerModuleFailureErr = false;
  }
}

async function getIMDData(controller) {
  if (!controller) return null;

  if (controller["modbus.gongyuan.online"] !== undefined) {
    return {
      type: "gongyuan",
      isOnline: controller["modbus.gongyuan.online"],
    };
  }

  else if (controller["modbus.ccs_bender.online"] !== undefined) {
    return {
      type: "bender",
      isOnline: controller["modbus.ccs_bender.online"],
    };
  }
  return null;
}

const IMD_CONSTANTS = {
  UNHEALTHY_RESISTANCE: 65535,
  HEALTHY_THRESHOLD: 60000,
};

let firstUnhealthyIMDData = {
  gun: null,
  timestamp: null,
  isTripped: false,
  gpioConfirmed: false,
};

async function checkIMDResistance(states, iostate) {
  try {
    const outlet0 = states[0] || {};
    const outlet1 = states[1] || {};
    const currentTime = Date.now();
    const gpioValue = iostate.controller1["gpio_470"];

    const isGunInValidState = (state) => {

      return state.phs > 3 && state.phs < 8 && !state.needsUnplug;
    };

    const isGunUnplugged = (state) => {
      return state.pilot === 0 || state.pilot === 1;
    };

    const isDualCharging =
      isGunInValidState(outlet0) && isGunInValidState(outlet1);
    const isSingleCharging = (isGunInValidState(outlet0) && !isGunInValidState(outlet1)) || (!isGunInValidState(outlet0) && isGunInValidState(outlet1));

    const gun1Data = iostate.controller1
      ? {
        negativeResistance:
          iostate.controller1[
          "modbus.gongyuan.Negative Pole-to-Ground Insulation Resistance"
          ],
        positiveResistance:
          iostate.controller1[
          "modbus.gongyuan.Positive Pole-to-Ground Insulation Resistance"
          ],
        isUnhealthy: false,
      }
      : null;

    const gun2Data = iostate.controller2
      ? {
        negativeResistance:
          iostate.controller2[
          "modbus.gongyuan.Negative Pole-to-Ground Insulation Resistance"
          ],
        positiveResistance:
          iostate.controller2[
          "modbus.gongyuan.Positive Pole-to-Ground Insulation Resistance"
          ],
        isUnhealthy: false,
      }
      : null;

    if (gun1Data) {
      gun1Data.isUnhealthy =
        gun1Data.negativeResistance !== IMD_CONSTANTS.HEALTHY_THRESHOLD ||
        gun1Data.positiveResistance !== IMD_CONSTANTS.HEALTHY_THRESHOLD;
    }
    if (gun2Data) {
      gun2Data.isUnhealthy =
        gun2Data.negativeResistance !== IMD_CONSTANTS.HEALTHY_THRESHOLD ||
        gun2Data.positiveResistance !== IMD_CONSTANTS.HEALTHY_THRESHOLD;
    }

    if (isDualCharging) {

      if (firstUnhealthyIMDData.gun === null) {

        if (gun1Data && gun1Data.isUnhealthy && gun2Data && !gun2Data.isUnhealthy) {
          firstUnhealthyIMDData.gun = 1;
          firstUnhealthyIMDData.timestamp = currentTime;
          console.log(
            `[v${SCRIPT_VERSION}] During dual charging - Gun 1 first showed unhealthy IMD at:`,
            new Date(currentTime).toISOString()
          );
        }

        if (gun2Data && gun2Data.isUnhealthy && gun1Data && !gun1Data.isUnhealthy) {
          firstUnhealthyIMDData.gun = 2;
          firstUnhealthyIMDData.timestamp = currentTime;
          console.log(
            `[v${SCRIPT_VERSION}] During dual charging - Gun 2 first showed unhealthy IMD at:`,
            new Date(currentTime).toISOString()
          );
        }

        else if ((gun1Data && gun1Data.isUnhealthy) && (gun2Data && gun2Data.isUnhealthy)) {
          const gun1MaxResistance = Math.max(
            gun1Data.negativeResistance,
            gun1Data.positiveResistance
          );
          const gun2MaxResistance = Math.max(
            gun2Data.negativeResistance,
            gun2Data.positiveResistance
          );

          firstUnhealthyIMDData.gun =
            gun1MaxResistance >= gun2MaxResistance ? 1 : 2;
          firstUnhealthyIMDData.timestamp = currentTime;
          console.log(
            `[v${SCRIPT_VERSION}] During dual charging - Gun ${firstUnhealthyIMDData.gun} marked as first fault (both showed unhealthy) at:`,
            new Date(currentTime).toISOString()
          );
        }
      }

      if (
        firstUnhealthyIMDData.gun !== null &&
        !firstUnhealthyIMDData.gpioConfirmed &&
        gpioValue === true
      ) {
        firstUnhealthyIMDData.gpioConfirmed = true;
        console.log(
          `[v${SCRIPT_VERSION}] GPIO confirmed IMD error for Gun ${firstUnhealthyIMDData.gun} at:`,
          new Date(currentTime).toISOString()
        );
      }

      if (firstUnhealthyIMDData.gpioConfirmed) {

        if (
          firstUnhealthyIMDData.gun === 1 &&
          !firstUnhealthyIMDData.isTripped && gun1Data &&
          gun1Data.isUnhealthy
        ) {
          incrementErrorCounter('imdResistanceErr_1');
          errorObj.imdResistanceErr_1 =
            errorObjCount.imdResistanceErr_1 >=
            errorObjThreshold.imdResistanceErr_1;

          if (errorObj.imdResistanceErr_1) {
            console.log(
              `[v${SCRIPT_VERSION}] IMD Resistance Error on Gun 1 (First unhealthy gun) - Negative: ${gun1Data.negativeResistance}, Positive: ${gun1Data.positiveResistance}`
            );
            const gun1States = states.filter((state) => state.outlet == 1);
            if (gun1States.length > 0) {
              await trip(gun1States, {
                msg: "ERR_IMD_RESISTANCE",
                code: "993",
                stopReason: "IMDResistanceError",
              });
              firstUnhealthyIMDData.isTripped = true;
            }
          }
        } else if (
          firstUnhealthyIMDData.gun === 2 &&
          !firstUnhealthyIMDData.isTripped && gun2Data &&
          gun2Data.isUnhealthy
        ) {
          incrementErrorCounter('imdResistanceErr_2');
          errorObj.imdResistanceErr_2 =
            errorObjCount.imdResistanceErr_2 >=
            errorObjThreshold.imdResistanceErr_2;

          if (errorObj.imdResistanceErr_2) {
            console.log(
              `[v${SCRIPT_VERSION}] IMD Resistance Error on Gun 2 (First unhealthy gun) - Negative: ${gun2Data.negativeResistance}, Positive: ${gun2Data.positiveResistance}`
            );
            const gun2States = states.filter((state) => state.outlet == 2);
            if (gun2States.length > 0) {
              await trip(gun2States, {
                msg: "ERR_IMD_RESISTANCE",
                code: "993",
                stopReason: "IMDResistanceError",
              });
              firstUnhealthyIMDData.isTripped = true;
            }
          }
        }
      }
    }

    else if (isSingleCharging) {

      if (iostate.controller1 && iostate.controller1 !== null && isGunInValidState(outlet0)) {
        if (gun1Data.isUnhealthy) {
          if (firstUnhealthyIMDData.gun === null) {
            firstUnhealthyIMDData.gun = 1;
            firstUnhealthyIMDData.timestamp = currentTime;
            console.log(
              `[v${SCRIPT_VERSION}] Gun 1 first showed unhealthy IMD resistance at:`,
              new Date(currentTime).toISOString()
            );
          }

          if (!firstUnhealthyIMDData.gpioConfirmed && gpioValue === true) {
            firstUnhealthyIMDData.gpioConfirmed = true;
            console.log(
              `[v${SCRIPT_VERSION}] GPIO confirmed IMD error for Gun 1 at:`,
              new Date(currentTime).toISOString()
            );
          }

          if (
            firstUnhealthyIMDData.gpioConfirmed &&
            firstUnhealthyIMDData.gun === 1 &&
            !firstUnhealthyIMDData.isTripped
          ) {
            incrementErrorCounter('imdResistanceErr_1');
            errorObj.imdResistanceErr_1 =
              errorObjCount.imdResistanceErr_1 >=
              errorObjThreshold.imdResistanceErr_1;

            if (errorObj.imdResistanceErr_1) {
              console.log(
                `[v${SCRIPT_VERSION}] IMD Resistance Error on Gun 1 - Negative: ${gun1Data.negativeResistance}, Positive: ${gun1Data.positiveResistance}`
              );
              const gun1States = states.filter((state) => state.outlet == 1);
              if (gun1States.length > 0) {
                await trip(gun1States, {
                  msg: "ERR_IMD_RESISTANCE",
                  code: "993",
                  stopReason: "IMDResistanceError",
                });
                firstUnhealthyIMDData.isTripped = true;
              }
            }
          }
        }
      }

      if (iostate.controller2 && iostate.controller2 !== null && isGunInValidState(outlet1)) {
        if (gun2Data.isUnhealthy) {
          if (firstUnhealthyIMDData.gun === null) {
            firstUnhealthyIMDData.gun = 2;
            firstUnhealthyIMDData.timestamp = currentTime;
            console.log(
              `[v${SCRIPT_VERSION}] Gun 2 first showed unhealthy IMD resistance at:`,
              new Date(currentTime).toISOString()
            );
          }

          if (!firstUnhealthyIMDData.gpioConfirmed && gpioValue === true) {
            firstUnhealthyIMDData.gpioConfirmed = true;
            console.log(
              `[v${SCRIPT_VERSION}] GPIO confirmed IMD error for Gun 2 at:`,
              new Date(currentTime).toISOString()
            );
          }

          if (
            firstUnhealthyIMDData.gpioConfirmed &&
            firstUnhealthyIMDData.gun === 2 &&
            !firstUnhealthyIMDData.isTripped
          ) {
            incrementErrorCounter('imdResistanceErr_2');
            errorObj.imdResistanceErr_2 =
              errorObjCount.imdResistanceErr_2 >=
              errorObjThreshold.imdResistanceErr_2;

            if (errorObj.imdResistanceErr_2) {
              console.log(
                `[v${SCRIPT_VERSION}] IMD Resistance Error on Gun 2 - Negative: ${gun2Data.negativeResistance}, Positive: ${gun2Data.positiveResistance}`
              );
              const gun2States = states.filter((state) => state.outlet == 2);
              if (gun2States.length > 0) {
                await trip(gun2States, {
                  msg: "ERR_IMD_RESISTANCE",
                  code: "993",
                  stopReason: "IMDResistanceError",
                });
                firstUnhealthyIMDData.isTripped = true;
              }
            }
          }
        }
      }
    }

    if (isGunUnplugged(outlet0) && firstUnhealthyIMDData.gun === 1) {
      firstUnhealthyIMDData = {
        gun: null,
        timestamp: null,
        isTripped: false,
        gpioConfirmed: false,
      };
      errorObjCount.imdResistanceErr_1 = 0;
      errorObj.imdResistanceErr_1 = false;
      console.log(`[v${SCRIPT_VERSION}] Gun 1 (First unhealthy gun) error reset - gun unplugged`);
    }
    if (isGunUnplugged(outlet1) && firstUnhealthyIMDData.gun === 2) {
      firstUnhealthyIMDData = {
        gun: null,
        timestamp: null,
        isTripped: false,
        gpioConfirmed: false,
      };
      errorObjCount.imdResistanceErr_2 = 0;
      errorObj.imdResistanceErr_2 = false;
      console.log(`[v${SCRIPT_VERSION}] Gun 2 (First unhealthy gun) error reset - gun unplugged`);
    }
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}] Error in checkIMDResistance:`, err);
  }
}

async function checkIMDDeviceFaults(states, controller1State, controller2State) {
  try {
    const controller1IMD = await getIMDData(controller1State);
    const controller2IMD = controller2State !== null ? await getIMDData(controller2State) : null;

    console.log(`[v${SCRIPT_VERSION}][IMD-DEBUG] Controller 1 IMD: ${controller1IMD ? `${controller1IMD.type}, online=${controller1IMD.isOnline}` : 'null'}`);
    console.log(`[v${SCRIPT_VERSION}][IMD-DEBUG] Controller 2 IMD: ${controller2IMD ? `${controller2IMD.type}, online=${controller2IMD.isOnline}` : 'null'}`);

    const bothOffline = controller1IMD && controller1IMD.isOnline === false &&
      (controller2IMD === null || controller2IMD.isOnline === false);

    console.log(`[v${SCRIPT_VERSION}][IMD-DEBUG] bothOffline: ${bothOffline} (C1: ${controller1IMD ? `${controller1IMD.type}, online=${controller1IMD.isOnline}` : 'null'}, C2: ${controller2IMD ? `${controller2IMD.type}, online=${controller2IMD.isOnline}` : 'null'})`);

    if (bothOffline) {

      let volts = [];

      if (controller1State && "modbus.selec.online" in controller1State && controller1State["modbus.selec.online"] === true) {
        volts = [
          controller1State["modbus.selec.voltage_L1_L2"] || 0,
          controller1State["modbus.selec.voltage_L1_L3"] || 0,
          controller1State["modbus.selec.voltage_L3_L2"] || 0
        ];
        console.log(`[v${SCRIPT_VERSION}][IMD-DEBUG] AC Meter voltages: ${volts}`);
      } else {

        volts = await getVoltageArr(states);
        console.log(`[v${SCRIPT_VERSION}][IMD-DEBUG] Power Module voltages: ${volts}`);
      }

      const voltageOK = !checkTwoPhasesBelow200(volts);
      console.log(`[v${SCRIPT_VERSION}][IMD-DEBUG] Voltage OK (≥2 phases ≥200V): ${voltageOK}`);

      if (voltageOK) {

        const imdType = controller1IMD.type;
        console.log(`[v${SCRIPT_VERSION}][IMD-FAULT] Both ${imdType} IMDs offline with power available - triggering single merged charger-level IMD failure`);

        if (!errorObj.imdFaultyErr) {
          incrementErrorCounter('imdFaultyErr');
          console.log(`[v${SCRIPT_VERSION}][IMD-FAULT] IMD fault counter (${imdType}, both guns): ${errorObjCount.imdFaultyErr}/${errorObjThreshold.imdFaultyErr}`);
        }
        errorObjRecoveryCount.imdFaultyErr = 0;
        errorObj.imdFaultyErr = errorObjCount.imdFaultyErr >= errorObjThreshold.imdFaultyErr;

        if (errorObj.imdFaultyErr && errorObjCount.imdFaultyErr === errorObjThreshold.imdFaultyErr) {
          console.log(`[v${SCRIPT_VERSION}][IMD-FAULT] Charger-level ${imdType} failure alarm triggered! Tripping all connectors.`);
          await trip(states, {
            msg: "ERR_BENDER_FAILURE",
            code: "992",
            stopReason: "BenderFailure",
            vendorErrorCode: 78,
          });
        }

        return;
      } else {

        console.log(`[v${SCRIPT_VERSION}][IMD-FAULT] Both IMDs offline with low voltage - this is power loss, not IMD device fault. Skipping IMD fault detection.`);

        errorObjCount.imdFaultyErr = 0;
        errorObjRecoveryCount.imdFaultyErr = 0;
        return;
      }
    }

    const bothNowOnline = (controller1IMD && controller1IMD.isOnline === true) &&
      (controller2IMD === null || controller2IMD.isOnline === true);

    if (errorObj.imdFaultyErr) {
      if (bothNowOnline) {

        errorObjRecoveryCount.imdFaultyErr++;
        console.log(`[v${SCRIPT_VERSION}][IMD-RECOVERY] Both IMDs online, recovery counter: ${errorObjRecoveryCount.imdFaultyErr}/${errorObjThreshold.imdFaultyRecovery}`);

        if (errorObjRecoveryCount.imdFaultyErr >= errorObjThreshold.imdFaultyRecovery) {
          console.log(`[v${SCRIPT_VERSION}][IMD-RECOVERY] Charger-level IMD fault recovered - untripping all connectors`);
          errorObjCount.imdFaultyErr = 0;
          errorObjRecoveryCount.imdFaultyErr = 0;
          errorObj.imdFaultyErr = false;
          await untrip(states, "78");
        }
      } else {

        if (errorObjRecoveryCount.imdFaultyErr > 0) {
          console.log(`[v${SCRIPT_VERSION}][IMD-RECOVERY] IMD recovery interrupted, resetting recovery counter`);
          errorObjRecoveryCount.imdFaultyErr = 0;
        }
      }
    } else {

      errorObjCount.imdFaultyErr = 0;
      errorObjRecoveryCount.imdFaultyErr = 0;
    }
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}][IMD-FAULT] Error in checkIMDDeviceFaults:`, err);
  }
}

async function checkDCEnergyStuck(states) {
  try {
    const now = Date.now();

    for (const state of states) {
      const gun = state.outlet;
      const tracker = dcEnergyTracker[gun];
      if (!tracker) continue;

      const isCharging = state.phs === 7;
      const currentEnergy = state.dc_meter ? state.dc_meter.total_import_device_energy : undefined;
      const errKey = `dcEnergyStuckErr_${gun}`;

      if (!isCharging) {

        if (tracker.tripped) {
          console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} exited charging phase - clearing DC energy stuck error`);
          errorObj[errKey] = false;
          tracker.tripped = false;
          const gunStates = states.filter((s) => s.outlet == gun);
          if (gunStates.length > 0) {
            const vendorCode = gun === "1" ? "50092" : "50093";
            await untrip(gunStates, vendorCode);
          }
        }
        tracker.lastEnergy = null;
        tracker.lastChangeTime = null;
        continue;
      }

      if (currentEnergy === undefined || currentEnergy === null) {
        console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} has no dc_meter data, skipping`);
        continue;
      }

      if (tracker.lastEnergy === null) {

        tracker.lastEnergy = currentEnergy;
        tracker.lastChangeTime = now;
        console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} started charging, initial energy: ${currentEnergy} Wh`);
        continue;
      }

      if (currentEnergy !== tracker.lastEnergy) {

        console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} energy changing: ${tracker.lastEnergy} → ${currentEnergy} Wh`);
        tracker.lastEnergy = currentEnergy;
        tracker.lastChangeTime = now;

        if (tracker.tripped) {
          console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} DC energy resumed - clearing stuck error`);
          errorObj[errKey] = false;
          tracker.tripped = false;
          const gunStates = states.filter((s) => s.outlet == gun);
          if (gunStates.length > 0) {
            const vendorCode = gun === "1" ? "50092" : "50093";
            await untrip(gunStates, vendorCode);
          }
        }
        continue;
      }

      const stuckDuration = now - tracker.lastChangeTime;
      console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} energy stuck at ${currentEnergy} Wh for ${Math.round(stuckDuration / 1000)}s`);

      if (stuckDuration >= DC_ENERGY_STUCK_TIMEOUT_MS && !tracker.tripped) {
        console.log(`[v${SCRIPT_VERSION}][DC-ENERGY] Gun ${gun} DC energy stuck for >${DC_ENERGY_STUCK_TIMEOUT_MS / 1000}s during charging - triggering error`);
        errorObj[errKey] = true;
        tracker.tripped = true;
        const gunStates = states.filter((s) => s.outlet == gun);
        if (gunStates.length > 0) {
          const vendorCode = gun === "1" ? "50092" : "50093";
          await trip(gunStates, {
            msg: "ERR_DC_ENERGY_STUCK",
            code: vendorCode,
            stopReason: "DCEnergyStuck",
          });
        }
      }
    }
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}][DC-ENERGY] Error in checkDCEnergyStuck:`, err);
  }
}

async function checkACEnergyMeterFail(states, controller1State, controller2State, powerSaveInIdleMode) {
  try {

    if (!powerSaveInIdleMode) {

      if (errorObjCount.ac_em_fail > 0 || errorObj.ac_em_fail) {
        console.log(`[v${SCRIPT_VERSION}][AC-EM] powerSaveInIdleMode=false, resetting AC meter failure counters`);
        errorObjCount.ac_em_fail = 0;
        errorObjRecoveryCount.ac_em_fail = 0;
        errorObj.ac_em_fail = false;
      }
      return;
    }

    const acMeterOffline = !controller1State ||
      !("modbus.selec.online" in controller1State) ||
      controller1State["modbus.selec.online"] === false;

    const controller1IMD = await getIMDData(controller1State);
    const controller2IMD = controller2State !== null ? await getIMDData(controller2State) : null;

    const atLeastOneIMDOnline = (controller1IMD && controller1IMD.isOnline === true) ||
      (controller2IMD && controller2IMD.isOnline === true);

    console.log(`[v${SCRIPT_VERSION}][AC-EM-DEBUG] powerSaveInIdleMode: ${powerSaveInIdleMode}, AC meter offline: ${acMeterOffline}, At least one IMD online: ${atLeastOneIMDOnline}`);

    if (acMeterOffline && atLeastOneIMDOnline) {

      if (!errorObj.ac_em_fail) {
        incrementErrorCounter('ac_em_fail');
        console.log(`[v${SCRIPT_VERSION}][AC-EM-FAULT] AC Energy Meter offline with IMD online, counter: ${errorObjCount.ac_em_fail}/${errorObjThreshold.ac_em_fail}`);
      }

      errorObjRecoveryCount.ac_em_fail = 0;

      errorObj.ac_em_fail = errorObjCount.ac_em_fail >= errorObjThreshold.ac_em_fail;

      if (errorObj.ac_em_fail && errorObjCount.ac_em_fail === errorObjThreshold.ac_em_fail) {
        console.log(`[v${SCRIPT_VERSION}][AC-EM-FAULT] AC Energy Meter failure alarm triggered!`);
        errorObjFlags.ac_em_fail = true;
        await trip(states, {
          msg: "ERR_AC_EM_FAIL",
          code: "990",
          stopReason: "ACEnergyMeterFailure",
          vendorErrorCode: 80,
        });
      }
    } else {

      if (errorObj.ac_em_fail) {
        if (!acMeterOffline) {

          errorObjRecoveryCount.ac_em_fail++;
          console.log(`[v${SCRIPT_VERSION}][AC-EM-RECOVERY] AC meter online, recovery counter: ${errorObjRecoveryCount.ac_em_fail}/${errorObjThreshold.ac_em_fail_recovery}`);

          if (errorObjRecoveryCount.ac_em_fail >= errorObjThreshold.ac_em_fail_recovery) {
            console.log(`[v${SCRIPT_VERSION}][AC-EM-RECOVERY] AC Energy Meter failure recovered after ${errorObjThreshold.ac_em_fail_recovery} cycles`);
            errorObjCount.ac_em_fail = 0;
            errorObjRecoveryCount.ac_em_fail = 0;
            errorObj.ac_em_fail = false;
            errorObjFlags.ac_em_fail = false;
            await untrip(states, "80");
          }
        } else {

          console.log(`[v${SCRIPT_VERSION}][AC-EM] AC meter offline but all IMDs offline - resetting AC meter failure counters`);
          errorObjCount.ac_em_fail = 0;
          errorObjRecoveryCount.ac_em_fail = 0;
        }
      } else {

        errorObjCount.ac_em_fail = 0;
        errorObjRecoveryCount.ac_em_fail = 0;
      }
    }
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}][AC-EM-FAULT] Error in checkACEnergyMeterFail:`, err);
  }
}

const checkPowerModuleFailureErr = async (states) => {
  for (const obj of states) {
    checkModuleFailure(obj);
    if (
      errorObj.powerModuleFailureErr &&
      !errorObjFlags.powerModuleFailureErr
    ) {
      errorObjFlags.powerModuleFailureErr = true;
      const payload = {
        outlet: obj.outlet,
        msg: "ERR_POWER_MODULE_FAILURE",
        code: "998",
      };
      await injectEvent(payload).catch((err) => {
        console.error(`[v${SCRIPT_VERSION}] Failed to inject event for outlet ${obj.outlet}`, err);
      });
    }
  }
};

const checkPowerModuleCommErr = async (states, iostate) => {
  for (const obj of states) {
    if (obj.outlet == 1) {
      if (powerSaveInIdleMode == true || powerSaveInIdleMode == null) {

        if (obj.phs == 5 && chargingStartTime.outlet1 === null) {
          console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 1 entering charging phase 5 - resetting comm error counter and starting grace period`);
          errorObjCount.powerModuleCommErr_1 = 0;
          errorObj.powerModuleCommErr_1 = false;
          chargingStartTime.outlet1 = Date.now();
        }

        if (obj.phs > 4 && obj.phs < 8) {

          const inGracePeriod = chargingStartTime.outlet1 &&
            (Date.now() - chargingStartTime.outlet1) < COMM_GRACE_PERIOD_MS;

          if (!inGracePeriod) {

            if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
              errorObj.powerModuleCommErr_1 =
                errorObjCount.powerModuleCommErr_1 >=
                errorObjThreshold.powerModuleCommErr_1;
              incrementErrorCounter('powerModuleCommErr_1');
              if (errorObjCount.underVoltageErr > 0) {
                errorObjCount.underVoltageErr = 0;
              }
            } else {
              errorObj.powerModuleCommErr_1 = false;
              errorObjCount.powerModuleCommErr_1 = 0;
            }
          } else {

            const remainingGrace = COMM_GRACE_PERIOD_MS - (Date.now() - chargingStartTime.outlet1);
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 1 in grace period, ${Math.ceil(remainingGrace / 1000)}s remaining`);
          }
        } else {

          if (errorObjCount.powerModuleCommErr_1 > 0) {
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 1 left charging phases - clearing comm error counter`);
            errorObjCount.powerModuleCommErr_1 = 0;
            errorObj.powerModuleCommErr_1 = false;
          }

          chargingStartTime.outlet1 = null;
        }
      } else {

        if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
          errorObj.powerModuleCommErr_1 =
            errorObjCount.powerModuleCommErr_1 >=
            errorObjThreshold.powerModuleCommErr_1;
          incrementErrorCounter('powerModuleCommErr_1');
          if (errorObjCount.underVoltageErr > 0) {
            errorObjCount.underVoltageErr = 0;
          }
        } else {
          errorObj.powerModuleCommErr_1 = false;
          errorObjCount.powerModuleCommErr_1 = 0;
        }
      }
    } else if (obj.outlet == 2) {
      if (powerSaveInIdleMode == true || powerSaveInIdleMode == null) {

        if (obj.phs == 5 && chargingStartTime.outlet2 === null) {
          console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 2 entering charging phase 5 - resetting comm error counter and starting grace period`);
          errorObjCount.powerModuleCommErr_2 = 0;
          errorObj.powerModuleCommErr_2 = false;
          chargingStartTime.outlet2 = Date.now();
        }

        if (obj.phs > 4 && obj.phs < 8) {

          const inGracePeriod = chargingStartTime.outlet2 &&
            (Date.now() - chargingStartTime.outlet2) < COMM_GRACE_PERIOD_MS;

          if (!inGracePeriod) {

            if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
              errorObj.powerModuleCommErr_2 =
                errorObjCount.powerModuleCommErr_2 >=
                errorObjThreshold.powerModuleCommErr_2;
              incrementErrorCounter('powerModuleCommErr_2');
              if (errorObjCount.underVoltageErr > 0) {
                errorObjCount.underVoltageErr = 0;
              }
            } else {
              errorObj.powerModuleCommErr_2 = false;
              errorObjCount.powerModuleCommErr_2 = 0;
            }
          } else {

            const remainingGrace = COMM_GRACE_PERIOD_MS - (Date.now() - chargingStartTime.outlet2);
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 2 in grace period, ${Math.ceil(remainingGrace / 1000)}s remaining`);
          }
        } else {

          if (errorObjCount.powerModuleCommErr_2 > 0) {
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 2 left charging phases - clearing comm error counter`);
            errorObjCount.powerModuleCommErr_2 = 0;
            errorObj.powerModuleCommErr_2 = false;
          }

          chargingStartTime.outlet2 = null;
        }
      } else {

        if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
          errorObj.powerModuleCommErr_2 =
            errorObjCount.powerModuleCommErr_2 >=
            errorObjThreshold.powerModuleCommErr_2;
          incrementErrorCounter('powerModuleCommErr_2');
          if (errorObjCount.underVoltageErr > 0) {
            errorObjCount.underVoltageErr = 0;
          }
        } else {
          errorObj.powerModuleCommErr_2 = false;
          errorObjCount.powerModuleCommErr_2 = 0;
        }
      }
    }
  }
};

const fetchJsonOrNull = async (url, options, label) => {
  const log = (msg) => { if (label) console.error(`[v${SCRIPT_VERSION}] [${label}] ${msg}`); };
  try {
    const response = await fetch(url, options);
    if (!response.ok) { log(`HTTP ${response.status} - using defaults`); return null; }
    const bodyText = await response.text();
    if (!bodyText || bodyText.trim().length === 0) { log("empty body - using defaults"); return null; }
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      log(`malformed JSON (${parseErr.message}) - using defaults`);
      return null;
    }
  } catch (err) {
    log(`fetch error (${err.message}) - using defaults`);
    return null;
  }
};

const set_ov_uv = async () => {

  const config = await fetchJsonOrNull(configEndpoint, { method: "GET" });
  if (!config) return;
  if (config.underVoltageThreshold) Constants.UVThresh = config.underVoltageThreshold;
  if (config.overVoltageThreshold) Constants.OVThresh = config.overVoltageThreshold;
};

const checkErrors = async () => {
  try {

    const states = await getFromApi("state");
    if (states === undefined || states.length === 0) {
      return;
    }

    let volts = await getVoltageArr(states);

    await ioMapperState().then(async (iostateValue) => {

      latestIOMapping = iostateValue;

      if (iostateValue !== undefined && iostateValue.controller1 !== null) {

        console.log(`[v${SCRIPT_VERSION}] [ERROR CHECK] Processing Controller 1 IO state data`);
        const iostate = iostateValue.controller1;
        const controller2State = iostateValue.controller2;
        if (controller2State !== null) {
          console.log(`[v${SCRIPT_VERSION}] [ERROR CHECK] Controller 2 data also available`);
        } else {
          console.log(`[v${SCRIPT_VERSION}] [ERROR CHECK] Controller 2 data not available - Single controller mode`);
        }

        if (
          iostate.hasOwnProperty("safety_tripped") &&
          iostate.safety_tripped
        ) {
          errIOSource = Object.keys(iostate)
            .filter((k) => k.startsWith("alert.trip."))
            .filter((key) => iostate[key] === true)
            .map((e) => {
              return e.split("alert.trip.")[1];
            });
        } else {
          errIOSource = [];
        }
      } else {
        if (iostateValue === undefined) {
          console.log(`[v${SCRIPT_VERSION}] [ERROR CHECK] No IO state data available from controllers`);
        } else if (iostateValue.controller1 === null) {
          console.log(`[v${SCRIPT_VERSION}] [ERROR CHECK] Controller 1 not available - cannot process errors`);
        }
        errIOSource = [];
      }

      if (iostateValue !== undefined && iostateValue.controller1 !== null) {
        const iostate = iostateValue.controller1;

        temperatures = {
          cabinet_temp: iostate["secc.pt4_temp"],
          outlet_temp: iostate["secc.pt5_temp"],
          CCS_A1_temp: iostate["secc.cppp.ADC-CCS-A1_temp"],
          CCS_A2_temp: iostate["secc.cppp.ADC-CCS-A2_temp"],
          CCS_B1_temp: iostate["secc.cppp.ADC-CCS-B1_temp"],
          CCS_B2_temp: iostate["secc.cppp.ADC-CCS-B2_temp"],
        };

        const IMDOnline = await getIMDData(iostate);

        if ("modbus.selec.online" in iostate) {
          if (iostate["modbus.selec.online"] === false) {
            volts = await getVoltageArr(states);
            if (IMDOnline.isOnline === false) {
              console.log(`[v${SCRIPT_VERSION}] bender/gongyuan is offline`);
              await powerOffErrCheck(states, volts);
            } else if (IMDOnline.isOnline === true) {
              console.log(`[v${SCRIPT_VERSION}] bender/gongyuan is online`);
              await powerONRecoverCheck(states, volts);
            }
          } else if (iostate["modbus.selec.online"] === true) {

            const voltageKeys = [
              "modbus.selec.voltage_L1_L2",
              "modbus.selec.voltage_L1_L3",
              "modbus.selec.voltage_L3_L2",
            ];

            const acVolts = voltageKeys.map((key) => iostate[key]);
            const hasVoltageData = acVolts.every((v) => typeof v === "number" && !Number.isNaN(v));

            const benderOnline = iostate["modbus.ccs_bender.online"] === true;
            const gongyuanOnline = iostate["modbus.gongyuan.online"] === true;

            if (!hasVoltageData) {

              console.log(`[v${SCRIPT_VERSION}] [AC Meter] selec online but voltage data unavailable - skipping UV/PL check:`, acVolts);
            } else if (checkTwoPhasesBelow200(acVolts) && (benderOnline || gongyuanOnline)) {
              console.log(`[v${SCRIPT_VERSION}] [AC Meter] Undervoltage condition - 2+ phases < ${Constants.powermoduleundervoltage}V with Bender online:`, acVolts);

              if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
                incrementErrorCounter('underVoltageErr');
                console.log(`[v${SCRIPT_VERSION}] [UV-AC Meter] Undervoltage counter incremented (2 phases < 200V, Bender online): ${errorObjCount.underVoltageErr}/${errorObjThreshold.underVoltageErr}`);
                errorObj.underVoltageErr = errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;

                if (errorObj.underVoltageErr) {
                  console.log(`[v${SCRIPT_VERSION}] Supply voltage too low (2 phases < 200V with Bender online): ${acVolts}`);
                  errorObjFlags.underVoltageErr = true;
                  tripCaseUV = UVTripState.Idle;
                  await trip(states, {
                    msg: "ERR_UNDER_VOLTAGE",
                    code: "997",
                    stopReason: "UnderVoltageError",
                  });
                }
              }
            } else if (checkTwoPhasesBelow200(acVolts) && !(benderOnline || gongyuanOnline)) {
              console.log(`[v${SCRIPT_VERSION}] [AC Meter] Power loss detected - 2+ phases < ${Constants.powermoduleundervoltage}V:`, acVolts);
              await powerfailacmeter(states, iostate);
            } else {
              await powerrecoveracmeter(states, iostate);
            }
          }
        }

        else {
          volts = await getVoltageArr(states);
          if (IMDOnline.isOnline === false) {
            console.log(`[v${SCRIPT_VERSION}] bender/gongyuan is offline`);
            await powerOffErrCheck(states, volts);
          } else if (IMDOnline.isOnline === true) {
            console.log(`[v${SCRIPT_VERSION}] bender/gongyuan is online`);
            await powerONRecoverCheck(states, volts);
          }
        }
      }

      if (iostateValue !== undefined && iostateValue.controller1 !== null) {
        await checkIOTrip();
      }

      if (!errorObj.powerLossErr && !errorObj.eStopErr) {
        if (iostateValue !== undefined && iostateValue.controller1 !== null) {

          console.log(`[v${SCRIPT_VERSION}] [VOLTAGE CHECK] Processing voltage data from Controller 1`);
          const iostate = iostateValue.controller1;

          if (
            powerSaveInIdleMode === true &&
            "modbus.selec.online" in iostate &&
            iostate["modbus.selec.online"] === true
          ) {

            if (lastMonitoringSource === 'power_module') {
              console.log(`[v${SCRIPT_VERSION}] [UV/OV] Switching from power module to AC meter monitoring - resetting UV/OV counters and trip state`);
              errorObjCount.underVoltageErr = 0;
              errorObjCount.overVoltageErr = 0;
              errorObj.underVoltageErr = false;
              errorObj.overVoltageErr = false;
              tripCaseUV = UVTripState.Idle;
            }
            lastMonitoringSource = 'ac_meter';

            const voltageKeys = [
              "modbus.selec.voltage_L1_L2",
              "modbus.selec.voltage_L1_L3",
              "modbus.selec.voltage_L3_L2",
            ];

            var voltsFiltered = voltageKeys.map((key) => iostate[key]);
            const hasACVoltageData = voltsFiltered.every((v) => typeof v === "number" && !Number.isNaN(v));

            if (!hasACVoltageData) {

              console.log(`[v${SCRIPT_VERSION}] [AC Meter] selec online but voltage data unavailable - skipping UV/OV check:`, voltsFiltered);
            } else if (checkTwoPhasesBelow200(voltsFiltered)) {
              console.log(`[v${SCRIPT_VERSION}] [AC Meter] Skipping UV/OV check - power loss condition detected (2+ phases < ${Constants.powermoduleundervoltage}V):`, voltsFiltered);

            } else if (voltsFiltered.length > 0 && !errorObj.powerLossErr) {
              await checkSuppyVoltageTripACmeter(states, voltsFiltered, iostate);

              await checkRecoveryConditions(voltsFiltered, states);
            }
          } else {

            if (lastMonitoringSource === 'ac_meter') {
              console.log(`[v${SCRIPT_VERSION}] [UV/OV] Switching from AC meter to power module monitoring - resetting UV/OV counters and trip state`);
              errorObjCount.underVoltageErr = 0;
              errorObjCount.overVoltageErr = 0;
              errorObj.underVoltageErr = false;
              errorObj.overVoltageErr = false;
              tripCaseUV = UVTripState.Idle;
            }
            lastMonitoringSource = 'power_module';

            if (powerSaveInIdleMode === false) {
              console.log(`[v${SCRIPT_VERSION}] No AC meter installed (powerSaveInIdleMode=false), using power module voltages`);
            } else {
              console.log(`[v${SCRIPT_VERSION}] AC meter not available/offline, using power module voltages`);
            }

            const volts = await getVoltageArr(states);

            var voltsFiltered = await filterVolts(volts);

            await checkSuppyVoltageTrip(states, voltsFiltered, iostate);

            await checkRecoveryConditions(voltsFiltered, states);
          }

          if (
            errorObj.powerLossErr === false &&
            errorObj.eStopErr === false &&
            errorObj.underVoltageErr === false
          ) {
            await checkPowerModuleCommErr(states, iostate);
          }

          await checkPowerModuleFailureErr(states);

          await checkIMDDeviceFaults(states, iostate, iostateValue.controller2);

          if (!emulatedMetering) {
            await checkDCEnergyStuck(states);
          }

          await checkACEnergyMeterFail(states, iostate, iostateValue.controller2, powerSaveInIdleMode);
        }
      }

      console.log(`[v${SCRIPT_VERSION}] [ERROR OBJ] Current error states:`, JSON.stringify(errorObj, null, 2));
      console.log(`[v${SCRIPT_VERSION}] [ERROR COUNT] Error counters:`, JSON.stringify(errorObjCount, null, 2));

      if (iostateValue !== undefined && iostateValue.controller1 !== null) {
        const iostate = iostateValue.controller1
        if ("modbus.selec.online" in iostate) {
          if (iostate["modbus.selec.online"] === false) {
            for (const obj of states) {
              const payload = {
                temperatures: temperatures,
                errorObj: errorObj,
                modbus_selec_online: false,
                voltage_L1_L2: 0,
                voltage_L2_L3: 0,
                voltage_L3_L1: 0,
                voltage_L1: 0,
                voltage_L2: 0,
                voltage_L3: 0,
                current_L1: 0,
                current_L2: 0,
                current_L3: 0,
                average_pf: 0,
                reactive_import_total: 0,
                reactive_total: 0,
                active_total: 0,
                total_net_kWh: 0,
              };

              if (typeof iostate["modbus.ccs_bender.online"] !== "undefined") {
                payload.modbus_ccs_bender_online =
                  iostate["modbus.ccs_bender.online"];
              } else if (
                typeof iostate["modbus.gongyuan.online"] !== "undefined"
              ) {
                payload.modbus_gongyuan_online =
                  iostate["modbus.gongyuan.online"];
              }

              await postRequest(
                `${baseURL}outlets/${obj.outlet}/state`,
                payload
              ).catch(function (err) {
                console.error(`[v${SCRIPT_VERSION}] failed to post on outlet ` + obj.outlet, err);
              });
            }
          } else {
            for (const obj of states) {
              const payload = {
                temperatures: temperatures,
                errorObj: errorObj,
                modbus_selec_online: iostate["modbus.selec.online"],
                voltage_L1_L2: iostate["modbus.selec.voltage_L1_L2"],
                voltage_L2_L3: iostate["modbus.selec.voltage_L3_L2"],
                voltage_L3_L1: iostate["modbus.selec.voltage_L1_L3"],
                voltage_L1: iostate["modbus.selec.voltage_L1"],
                voltage_L2: iostate["modbus.selec.voltage_L2"],
                voltage_L3: iostate["modbus.selec.voltage_L3"],
                current_L1: iostate["modbus.selec.current_L1"],
                current_L2: iostate["modbus.selec.current_L2"],
                current_L3: iostate["modbus.selec.current_L3"],
                total_net_kWh: iostate["modbus.selec.active_import_total"],
                average_pf: iostate["modbus.selec.average_pf"],
                reactive_import_total:
                  iostate["modbus.selec.reactive_import_total"],
                reactive_total: iostate["modbus.selec.reactive_total"],
                active_total: iostate["modbus.selec.active_total"],
              };

              if (typeof iostate["modbus.ccs_bender.online"] !== "undefined") {
                payload.modbus_ccs_bender_online =
                  iostate["modbus.ccs_bender.online"];
              } else if (
                typeof iostate["modbus.gongyuan.online"] !== "undefined"
              ) {
                payload.modbus_gongyuan_online =
                  iostate["modbus.gongyuan.online"];
              }

              await postRequest(
                `${baseURL}outlets/${obj.outlet}/state`,
                payload
              ).catch(function (err) {
                console.error(`[v${SCRIPT_VERSION}] failed to post on outlet ` + obj.outlet, err);
              });
            }
          }
        } else {
          for (const obj of states) {
            await postRequest(`${baseURL}outlets/${obj.outlet}/state`, {
              temperatures: temperatures,
              errorObj: errorObj,
            }).catch((err) => {
              console.error(`[v${SCRIPT_VERSION}] failed to post on outlet ${obj.outlet}`, err);
            });
          }
        }
      }

    });
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}] [ERROR] Error in checkErrors function:`, err.message || err);
    console.error(`[v${SCRIPT_VERSION}] [ERROR] Stack trace:`, err.stack);
  }
};

const ensureOcppClientRunning = async () => {
  const maxConsecutiveInactive = 6;
  let consecutiveInactiveCount = 0;

  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Checking OCPP client service status...`);

  while (consecutiveInactiveCount < maxConsecutiveInactive) {
    try {
      const statusResponse = await fetch(`${baseURL}ocpp-client/servicestatus`, { method: "GET" });
      const status = await statusResponse.text();

      if (status.trim() === "active") {
        console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service is active.`);
        return;
      }

      consecutiveInactiveCount++;
      console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service not active (${consecutiveInactiveCount}/${maxConsecutiveInactive}, status: "${status.trim()}").${consecutiveInactiveCount < maxConsecutiveInactive ? " Rechecking in 10s..." : ""}`);
    } catch (err) {
      consecutiveInactiveCount++;
      console.error(`[v${SCRIPT_VERSION}] [STARTUP] Error checking OCPP client service status (${consecutiveInactiveCount}/${maxConsecutiveInactive}):`, err.message || err);
    }

    if (consecutiveInactiveCount < maxConsecutiveInactive) {
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  try {
    console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service inactive for ${maxConsecutiveInactive} consecutive checks. Starting service...`);
    const startResponse = await fetch(`${baseURL}ocpp-client/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (startResponse.ok) {
      console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service start request sent successfully. Will check every 60s until active...`);
    } else {
      console.error(`[v${SCRIPT_VERSION}] [STARTUP] Failed to start OCPP client service. HTTP ${startResponse.status}`);
    }
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}] [STARTUP] Error starting OCPP client service:`, err.message || err);
  }

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 60000));

    let inactiveCount = 0;
    for (let i = 0; i < maxConsecutiveInactive; i++) {
      try {
        const statusResponse = await fetch(`${baseURL}ocpp-client/servicestatus`, { method: "GET" });
        const status = await statusResponse.text();
        if (status.trim() === "active") {
          console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service is now active.`);
          return;
        }
        inactiveCount++;
        console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service not active (${inactiveCount}/${maxConsecutiveInactive}, status: "${status.trim()}").${inactiveCount < maxConsecutiveInactive ? " Rechecking in 10s..." : ""}`);
      } catch (err) {
        inactiveCount++;
        console.error(`[v${SCRIPT_VERSION}] [STARTUP] Error checking OCPP client service status (${inactiveCount}/${maxConsecutiveInactive}):`, err.message || err);
      }

      if (inactiveCount < maxConsecutiveInactive) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    try {
      console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service inactive for ${maxConsecutiveInactive} consecutive checks. Starting service again...`);
      const startResponse = await fetch(`${baseURL}ocpp-client/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (startResponse.ok) {
        console.log(`[v${SCRIPT_VERSION}] [STARTUP] OCPP client service start request sent successfully.`);
      } else {
        console.error(`[v${SCRIPT_VERSION}] [STARTUP] Failed to start OCPP client service. HTTP ${startResponse.status}`);
      }
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] [STARTUP] Error starting OCPP client service:`, err.message || err);
    }
  }
};

const getpowersaveinidlemode = async () => {
  const config = await fetchJsonOrNull(`${baseURL}ocpp-client/config`, { method: "GET" }, "PWRSAVE CONFIG");
  if (!config) {

    powerSaveInIdleMode = false;
    console.error(`[v${SCRIPT_VERSION}] powerSaveInIdleMode config unavailable - using default: false`);
    return false;
  }
  if (typeof config.powerSaveInIdleMode === 'boolean') {
    powerSaveInIdleMode = config.powerSaveInIdleMode;
  }
  if (typeof config.emulatedMetering === 'boolean') {
    emulatedMetering = config.emulatedMetering;
  }
  console.log(`[v${SCRIPT_VERSION}] powerSaveInIdleMode configured as: ${powerSaveInIdleMode}`);
  console.log(`[v${SCRIPT_VERSION}] emulatedMetering configured as: ${emulatedMetering}`);
  return true;
};

const start = async () => {
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] EcoG Error Reporting Script v${SCRIPT_VERSION}`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Initializing system...`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================`);

  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Checking connected controllers...`);
  await getConnectedControllers();

  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Ensuring OCPP client service is running...`);
  ensureOcppClientRunning();

  for (let i = 0; i < 3; i++) {
    const ok = await getpowersaveinidlemode();
    if (ok) break;
    if (i === 2) {
      console.log(`[v${SCRIPT_VERSION}] Using default powerSaveInIdleMode value: false after ${i + 1} attempts`);
    } else {
      console.log(`[v${SCRIPT_VERSION}] Config fetch attempt ${i + 1} failed - retrying in 1s`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Setting up periodic controller check (every 30 seconds)`);
  setInterval(async () => {
    console.log(`[v${SCRIPT_VERSION}] [PERIODIC CHECK] Refreshing connected controllers list...`);
    await getConnectedControllers();
  }, 30000);

  const loop = async () => {
    try {
      await set_ov_uv();
      await checkErrors();

      setTimeout(loop, 2000);
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] [MAIN LOOP ERROR] Error executing checkErrors:`, err.message || err);
      if (err.stack) {
        console.error(`[v${SCRIPT_VERSION}] [MAIN LOOP ERROR] Stack:`, err.stack);
      }
      setTimeout(loop, 2000);
    }
  };

  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] System initialization complete`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Starting error monitoring loop (2 second interval)`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================\n`);

  loop();
};

console.log(`[v${SCRIPT_VERSION}][INIT] Calling start() function...`);
start();

console.log(`[v${SCRIPT_VERSION}][INIT] Starting IMD resistance monitor...`);

startIMDResistanceMonitor();

console.log(`[v${SCRIPT_VERSION}][INIT] All initialization calls complete`);