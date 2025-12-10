// Immediate startup log to verify script is running
//console.log(`[INIT] Script error-reporting_112.js v${SCRIPT_VERSION} starting at`, new Date().toISOString());

/*
 *
 * EcoG Error Reporting Script Created on 2023
 *2
 * Only licensed to be used on/with EcoG OS
 *
 * To the maximum extent permitted by applicable law, in no event shall,
 * EcoG GmbH or its suppliers be liable for any special, incidental,
 * indirect, or consequential damages whatsoever (including, but not
 * limited to, damages for loss of profits, loss of data or other information,
 * for business interruption, for personal injury, loss of privacy arising
 * out of or in any way related to the use of or inability to use the
 * Application, third-party software and/or third-party hardware used
 * with the Application, or otherwise in connection with any provision
 * of this Agreement), even if EcoG GmbH or any supplier has been
 * advised of the possibility of such damages and even if the remedy
 * fails of its essential purpose.
 *
 * Copyright (c) EcoG GmbH 2023
 * * All rights reserved
 * EcoG Error Reporting Script - Monitors IO, Temperature, and Supply Voltage errors
 * Version: 1.1.2 (Updated with v1.1.4 universal recovery counters)
 * Modified: 12 October 2025
 *
 * Key Changes:
 * • Universal recovery counters for 10 error types (E-Stop, door, temperatures, ground fault, voltage errors)
 * • Requires 3 consecutive stable cycles before clearing errors
 * • UV/OV hysteresis increased from 5V to 10V for better voltage stability
 * • Prevents error oscillation and false alarms from transient conditions
 * • Condensed header comments for better code readability
 * • Total: 10 alarms with recovery logic, matching v1.1.4 core behavior
 */

// import fetch from "node-fetch";

// Script Version
const SCRIPT_VERSION = "1.1.2";

// Global Objects
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
  imdResistanceErr_2: 0
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
  groundFault: 0
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
  imdResistanceErr_1: false, // Added IMD resistance error state for gun 1
  imdResistanceErr_2: false, // Added IMD resistance error state for gun 2
};

const errorObjThreshold = {
  powerLossErr: 1, // Threshold for power loss error
  powerLossRecovery: 3, // Threshold for power loss recovery (3 consecutive stable cycles)
  eStopErr: 1,
  doorOpenErr: 2,
  outletTemperatureErr: 4,
  cabinetTemperatureErr: 4,
  overVoltageErr: 55, // changed to 55 from 20
  underVoltageErr: 55, // changed to 55 from 20
  powerModuleFailureErr: 6,
  gunTemperatureErr_1: 6,
  gunTemperatureErr_2: 6,
  powerModuleCommErr_1: 25, // changed to 25 from 14
  powerModuleCommErr_2: 25, // changed to 25 from 14
  groundFault: 5,
  imdResistanceErr_1: 1, // Added IMD resistance threshold for gun 1 (3 consecutive readings)
  imdResistanceErr_2: 1, // Added IMD resistance threshold for gun 2 (3 consecutive readings)
  // Recovery thresholds - require 3 consecutive stable cycles before clearing errors
  eStopErr_recovery: 3,
  doorOpenErr_recovery: 3,
  outletTemperatureErr_recovery: 3,
  cabinetTemperatureErr_recovery: 3,
  underVoltageErr_recovery: 3,
  overVoltageErr_recovery: 3,
  gunTemperatureErr_1_recovery: 3,
  gunTemperatureErr_2_recovery: 3,
  groundFault_recovery: 3
};

const errorObjFlags = {
  powerLossErr: false,
  overVoltageErr: false,
  underVoltageErr: false,
  powerModuleFailureErr: false,
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
  UV_OV_Hysteresis: 10, // Increased from 5 to 10 for better voltage stability
  powermoduleundervoltage: 200
};

// BEFORE FIX: Config could be null during initial checks
// AFTER FIX: Initialize with default value and ensure it's loaded before use
// Modified: 16 August 2025 by Kushagra Mittal
let powerSaveInIdleMode = false; // Default to false for safety

const configEndpoint = "http://localhost:3001/db/config";
const baseURL = "http://localhost:3001/";
const baseURLsecc = "http://10.20.27.100/api/system/userconfig";
const baseURLseccle = "http://10.20.27.101/api/system/userconfig";
let tripCaseUV = UVTripState.Idle;
let errIOSource = [];
let temperatures = {};
let voltage = {};

// Track charging start times for grace period implementation
let chargingStartTime = {
  outlet1: null,
  outlet2: null
};

// Grace period in milliseconds for power module communication after entering charging
const COMM_GRACE_PERIOD_MS = 5000; // 5 seconds

// Testing variables
const onTestingMode = false;

// Global variable to store the latest IO Mapper data
let latestIOMapping = null;

// Global variable to store connected controllers
let connectedControllers = [];

// Helper function to increment error counter with max limit of 512
const incrementErrorCounter = (errorType) => {
  if (errorObjCount[errorType] < 512) {
    errorObjCount[errorType]++;
  }
};

// BEFORE FIX: No cleanup mechanism for timeout, potential memory leak
// AFTER FIX: Added proper cleanup with clearTimeout and active flag
let imdMonitorTimeout = null;
let imdMonitorActive = false;

// High-frequency IMD resistance monitoring loop
const startIMDResistanceMonitor = async () => {
  imdMonitorActive = true;
  
  const loop = async () => {
    try {
      // Check if monitoring should continue
      if (!imdMonitorActive) {
        console.log(`[v${SCRIPT_VERSION}] IMD monitor loop stopped.`);
        return;
      }
      
      // Fetch the latest IO Mapper data
      const iostateValue = await ioMapperState();
      if (iostateValue !== undefined && iostateValue.controller1 !== null) {
        const iostate = iostateValue.controller1;
        const IMDOnline = await getIMDData(iostate);

        if (IMDOnline && IMDOnline.type === 'bender') {
          console.log(`[v${SCRIPT_VERSION}] IMD type is bender. Stopping IMD resistance monitor loop.`);
          imdMonitorActive = false;
          return; // Stop the loop
        }

        latestIOMapping = iostateValue;
        // Fetch the latest outlet states
        const states = await getFromApi("state");
        if (states !== undefined && states.length > 0) {
          // Call checkIMDResistance with the freshest data
          await checkIMDResistance(states, iostateValue);
        }
      }

      // Schedule next loop with cleanup
      if (imdMonitorActive) {
        imdMonitorTimeout = setTimeout(loop, 20);
      }
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] Error in IMD resistance monitor loop`, err);
      // Continue loop despite errors if still active
      if (imdMonitorActive) {
        imdMonitorTimeout = setTimeout(loop, 20);
      }
    }
  };

  loop(); // Start the loop
};

// Cleanup function to stop IMD monitor
const stopIMDResistanceMonitor = () => {
  imdMonitorActive = false;
  if (imdMonitorTimeout) {
    clearTimeout(imdMonitorTimeout);
    imdMonitorTimeout = null;
  }
};


// EcoG Helper Functions
const getFromApi = async (path) =>
  fetch(`${baseURL}${path}`)
    .then((response) => response.json())
    .then((states) => {
      if (states !== undefined) {
        if (!Array.isArray(states)) states = [states];
        states = states.filter((state) => state.online);
        return states;
      }
    })
    .catch((err) => {
      // BEFORE FIX: Error only logged, not propagated
      // AFTER FIX: Re-throw error for proper error handling
      // Modified: 16 August 2025 by Kushagra Mittal
      console.error(`[v${SCRIPT_VERSION}] [errorReporting] error in getFromApi `, err);
      throw err;
    });

// Function to fetch connected controllers
const getConnectedControllers = async () => {
  try {
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] Fetching connected controllers from API...`);
    const response = await fetch(`${baseURL}controllers`);
    const controllers = await response.json();

    // Extract controller IDs from the response
    connectedControllers = controllers.map(controller => controller.id);

    // Log detailed controller status
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] API Response:`, JSON.stringify(controllers));
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER FETCH] Connected controllers detected:`, connectedControllers);

    // Log individual controller status
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

    // Log configuration summary
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
    // Fallback to default if API fails
    connectedControllers = [1, 2];
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 1: ASSUMED AVAILABLE (fallback)`);
    console.log(`[v${SCRIPT_VERSION}] [CONTROLLER STATUS] Controller 2: ASSUMED AVAILABLE (fallback)`);
    return connectedControllers;
  }
};

const ioMapperState = async () => {
  try {
    // Use dynamically detected controllers or cached value
    const controllers = connectedControllers.length > 0 ? connectedControllers : await getConnectedControllers();

    const result = {};

    // Fetch data only for connected controllers
    if (controllers.includes(1)) {
      try {
        console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Fetching data for Controller 1...`);
        const controller1Response = await fetch(`${baseURL}controllers/1/api/proxy/iomapper/`, {
          headers: { "Content-Type": "application/json" },
        });
        result.controller1 = await controller1Response.json();
        console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller 1 data fetched successfully`);
      } catch (err) {
        console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Error fetching Controller 1 data:`, err.message);
        result.controller1 = null;
      }
    } else {
      console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller 1 not available - skipping data fetch`);
      result.controller1 = null;
    }

    if (controllers.includes(2)) {
      try {
        console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Fetching data for Controller 2...`);
        const controller2Response = await fetch(`${baseURL}controllers/2/api/proxy/iomapper/`, {
          headers: { "Content-Type": "application/json" },
        });
        result.controller2 = await controller2Response.json();
        console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller 2 data fetched successfully`);
      } catch (err) {
        console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Error fetching Controller 2 data:`, err.message);
        result.controller2 = null;
      }
    } else {
      console.log(`[v${SCRIPT_VERSION}] [IOMAPPER] Controller 2 not available - skipping data fetch`);
      result.controller2 = null;
    }

    return result;
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}] [IOMAPPER] Critical error in ioMapperState:`, err);
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

// BEFORE FIX: Function was synchronous but called with await
// AFTER FIX: Made function async to properly support await calls
// Modified: 16 August 2025 by Kushagra Mittal
async function checkIOTrip() {
  // Check for EStop
  if (errIOSource.includes("emergency")) {
    errorObj.eStopErr = errorObjCount.eStopErr >= errorObjThreshold.eStopErr;
    incrementErrorCounter('eStopErr');
    errorObjCount.powerModuleCommErr_1 = 0;
    errorObjCount.powerModuleCommErr_2 = 0;
    //  if its EStop, reset inputUnderVoltage counter
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
    // Reset recovery counter when error is active
    errorObjRecoveryCount.eStopErr = 0;
  } else {
    // Check for recovery
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
  // Check for doorOpenErr
  if (errIOSource.includes("door_open")) {
    errorObj.doorOpenErr =
      errorObjCount.doorOpenErr >= errorObjThreshold.doorOpenErr;
    incrementErrorCounter('doorOpenErr');
    errorObjRecoveryCount.doorOpenErr = 0;
  } else {
    // Check for recovery
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
  // Check for outletTemperatureErr
  if (errIOSource.includes("outlet_temp")) {
    errorObj.outletTemperatureErr =
      errorObjCount.outletTemperatureErr >=
      errorObjThreshold.outletTemperatureErr;
    incrementErrorCounter('outletTemperatureErr');
    errorObjRecoveryCount.outletTemperatureErr = 0;
  } else {
    // Check for recovery
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
  // Check for Cabinet temperature
  if (errIOSource.includes("cab_temp")) {
    errorObj.cabinetTemperatureErr =
      errorObjCount.cabinetTemperatureErr >=
      errorObjThreshold.cabinetTemperatureErr;
    incrementErrorCounter('cabinetTemperatureErr');
    errorObjRecoveryCount.cabinetTemperatureErr = 0;
  } else {
    // Check for recovery
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
  // Check for Gun A Temperature
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
    // Check for recovery
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
  // Check for Gun B Temperature
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
    // Check for recovery
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
  // Check for Ground Fault
  if (errIOSource.includes("ground_fault")) {
    errorObj.groundFault =
      errorObjCount.groundFault >= errorObjThreshold.groundFault;
    incrementErrorCounter('groundFault');
    errorObjRecoveryCount.groundFault = 0;
  } else {
    // Check for recovery
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
    // get active modules
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
  // get voltage from active modules
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
  // get voltage from active modules
  for (let i = 0; i < getConvArr(state).length; i++) {
    const volt = state[`can1_RX_m${i}_${phase}`] || 0;
    arr.push(volt);
  }
  return arr;
}
const getVoltageArr = (states) => {
  // get voltages
  const volts_arr = states
    .filter((o) => o.online)
    .reduce((a, o) => {
      a.push(getVoltages(o));
      return a;
    }, []);

  // concat voltage arrays
  return [].concat.apply([], volts_arr);
};

const checkVoltsAboveThres = (currentValue) =>
  currentValue > Constants.UVThresh + Constants.UV_OV_Hysteresis;
const checkVoltsBelowThres = (currentValue) =>
  currentValue < Constants.UVThresh && currentValue > Constants.powermoduleundervoltage;

const checkVoltsBelow200 = (currentValue) =>
  currentValue < Constants.powermoduleundervoltage;

// New functions for phase-specific voltage monitoring
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
    // Increment recovery counter - require multiple consecutive stable cycles
    errorObjRecoveryCount.powerLossErr++;
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] AC meter online, recovery counter: ${errorObjRecoveryCount.powerLossErr}/${errorObjThreshold.powerLossRecovery}`);

    // Only recover after threshold consecutive stable cycles
    if (errorObjRecoveryCount.powerLossErr >= errorObjThreshold.powerLossRecovery) {
      console.log(`[v${SCRIPT_VERSION}][PL] Power loss recovered - AC meter stable for ${errorObjThreshold.powerLossRecovery} cycles, untripping.`);
      errorObjCount.powerLossErr = 0;
      errorObjRecoveryCount.powerLossErr = 0;
      errorObj.powerLossErr = false;
      errorObjFlags.powerLossErr = false;
      await untrip(states, "70");
    }
  } else {
    // Reset recovery counter if conditions are not met
    if (errorObjRecoveryCount.powerLossErr > 0) {
      console.log(`[v${SCRIPT_VERSION}][PL-Recovery] Conditions changed, resetting recovery counter: 0/${errorObjThreshold.powerLossRecovery}`);
      errorObjRecoveryCount.powerLossErr = 0;
    }
  }
};

// Check to recover on PowerLoss
const powerONRecoverCheck = async (states, volts) => {
  // if (errorObj.powerLossErr && errorObjFlags.powerLossErr && volts.length > 0) {
  if (errorObj.powerLossErr && errorObjFlags.powerLossErr) {
    // Increment recovery counter - require multiple consecutive stable cycles
    errorObjRecoveryCount.powerLossErr++;
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] IMD online, recovery counter: ${errorObjRecoveryCount.powerLossErr}/${errorObjThreshold.powerLossRecovery}`);

    // Only recover after threshold consecutive stable cycles
    if (errorObjRecoveryCount.powerLossErr >= errorObjThreshold.powerLossRecovery) {
      console.log(`[v${SCRIPT_VERSION}][PL] Power loss recovered - IMD stable for ${errorObjThreshold.powerLossRecovery} cycles, untripping.`);
      errorObjCount.powerLossErr = 0;
      errorObjRecoveryCount.powerLossErr = 0;
      errorObj.powerLossErr = false;
      errorObjFlags.powerLossErr = false;
      await untrip(states, "70");
    }
  } else {
    // Reset recovery counter if conditions are not met
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
  // REMOVED: Unconditional call to powerrecoveracmeter() - recovery now handled separately
  // This prevents immediate toggle within same execution cycle
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
    volts.every(checkVoltsBelowThres) //&&
    //!errorObj.eStopErr //////////////////////////////////Check for Power loss even when E stop is active
  ) {
    incrementErrorCounter('powerLossErr');
    console.log(
      `[v${SCRIPT_VERSION}] [PL] Power loss counter incremented: ${errorObjCount.powerLossErr}/${errorObjThreshold.powerLossErr}, IMD offline + all phases < ${Constants.UVThresh}V: ${volts}`
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    // we are in power loss state, reset under voltage
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
  } else if (
    !errorObj.powerLossErr &&
    //!errorObj.eStopErr && //////////////////////////////////Check for E stop even when Power loss is active
    isModuleUnavilable
  ) {
    incrementErrorCounter('powerLossErr');
    console.log(
      `[v${SCRIPT_VERSION}] [PL] Power loss counter incremented: ${errorObjCount.powerLossErr}/${errorObjThreshold.powerLossErr}, IMD offline + module unavailable`
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    // we are in power loss state, reset under voltage
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
    // Reset power loss counter when none of the conditions are met
    // (voltage is normal and no module unavailability)
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

  // Above Threshold, trip power loss
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
  // Skip undervoltage check if voltage array is empty (no power/no data)
  if (voltages.length === 0) {
    // Reset counter if it was incrementing before power was lost
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
      // if Idle then assign the case,
      // to make the counter increase only for 1 case, for ex: _All or _AB, etc.
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
    // Reset counter when voltage returns to normal
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

  // Check Over Voltage
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
    // Reset overvoltage counter when voltage returns to normal
    if (!errorObj.overVoltageErr) {
      if (errorObjCount.overVoltageErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [OV-AC] Overvoltage counter reset: 0/${errorObjThreshold.overVoltageErr}, voltages normal: ${volts}`);
      }
      errorObjCount.overVoltageErr = 0;
    }
  }

  // MODIFIED: Check for undervoltage when 2 phases < 200V and Bender is online
  const benderOnline = iostate && iostate["modbus.ccs_bender.online"] === true;
  
  if (checkTwoPhasesBelow200(volts) && benderOnline) {
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
    return; // Exit early, don't check other voltage conditions
  } else if (checkTwoPhasesBelow200(volts) && !benderOnline) {
    // Original power loss logic when Bender is offline
    console.log(`[v${SCRIPT_VERSION}] [PL-AC] Power loss detected - 2+ phases < ${Constants.powermoduleundervoltage}V: ${volts}`);
    incrementErrorCounter('powerLossErr');
    errorObj.powerLossErr = errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    
    // Reset undervoltage counter since power loss takes priority
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
    
    // Trip power loss if threshold reached
    if (errorObj.powerLossErr && !errorObjFlags.powerLossErr) {
      errorObjFlags.powerLossErr = true;
      console.log(`[v${SCRIPT_VERSION}] AC meter: 2+ phases < 200V -> power loss trip`);
      await trip(states, {
        msg: "ERR_POWERLOSS",
        code: "70",
        stopReason: "PowerLossError",
      });
    }
    return; // Exit early, don't check undervoltage
  }
  
  // NEW IMPLEMENTATION: Check for single phase undervoltage alarm (1 phase < 200V)
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
    return; // Exit early, don't check standard undervoltage
  }

  // Check Under Voltage (original logic for voltages below UVThresh)
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
      // Reset tripCaseUV when tripping from AC meter source
      tripCaseUV = UVTripState.Idle;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
  } else {
    // Reset undervoltage counter when voltage returns to normal
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
  // Check Over Voltage
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
    // Reset overvoltage counter when voltage returns to normal
    if (!errorObj.overVoltageErr) {
      if (errorObjCount.overVoltageErr > 0) {
        console.log(`[v${SCRIPT_VERSION}] [OV] Overvoltage counter reset: 0/${errorObjThreshold.overVoltageErr}, voltages normal: ${volts}`);
      }
      errorObjCount.overVoltageErr = 0;
    }
  }

  // MODIFIED: Check for undervoltage when 2 phases < 200V and Bender is online
  const benderOnline = iostate && iostate["modbus.ccs_bender.online"] === true;
  
  if (checkTwoPhasesBelow200(volts) && benderOnline) {
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
    return; // Exit early, don't check other voltage conditions
  } else if (checkTwoPhasesBelow200(volts) && !benderOnline) {
    // Original power loss logic when Bender is offline
    console.log(`[v${SCRIPT_VERSION}] [PL-PM] Power loss detected - 2+ phases < ${Constants.powermoduleundervoltage}V: ${volts}`);
    incrementErrorCounter('powerLossErr');
    errorObj.powerLossErr = errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    
    // Reset undervoltage counter since power loss takes priority
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
    
    // Trip power loss if threshold reached
    if (errorObj.powerLossErr && !errorObjFlags.powerLossErr) {
      errorObjFlags.powerLossErr = true;
      console.log(`[v${SCRIPT_VERSION}] Power module: 2+ phases < 200V -> power loss trip`);
      await trip(states, {
        msg: "ERR_POWERLOSS",
        code: "70",
        stopReason: "PowerLossError",
      });
    }
    return; // Exit early, don't check undervoltage
  }
  
  // NEW IMPLEMENTATION: Check for single phase undervoltage alarm (1 phase < 200V)
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
    return; // Exit early, don't check standard undervoltage
  }

  // From here on check Under Voltgae and Over Voltage (original logic)
  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.All) {
    !!onTestingMode && console.log(`[v${SCRIPT_VERSION}] check trip for All phases`); // all the voltage value is less than 353
    await checkUnderVoltageThroughPowerModule(states, volts, UVTripState.All);
  }

  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.AB) {
    // only _AB voltage values of all modules is less than 353
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
    // only _BC voltage values of all modules is less than 353
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
    // only _CA voltage values of all modules is less than 353
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

// Check Recovery conditions for UV and OV
async function checkRecoveryConditions(volts, states) {
  // NEW IMPLEMENTATION: Check power loss recovery first (all phases > 200V)
  const checkPowerLossRecoveryVal = (currentValue) => currentValue > Constants.powermoduleundervoltage;
  if (
    errorObj.powerLossErr &&
    errorObjFlags.powerLossErr &&
    volts.length > 0 &&
    volts.every(checkPowerLossRecoveryVal)
  ) {
    // Increment recovery counter - require multiple consecutive stable cycles
    errorObjRecoveryCount.powerLossErr++;
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] All phases > ${Constants.powermoduleundervoltage}V, recovery counter: ${errorObjRecoveryCount.powerLossErr}/${errorObjThreshold.powerLossRecovery}, volts: ${volts}`);

    // Only recover after threshold consecutive stable cycles
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
    // Reset recovery counter if power loss persists but voltages don't meet recovery criteria
    console.log(`[v${SCRIPT_VERSION}][PL-Recovery] Voltage conditions not met, resetting recovery counter: 0/${errorObjThreshold.powerLossRecovery}`);
    errorObjRecoveryCount.powerLossErr = 0;
  }

  // recover from UV
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
    // Reset recovery counter if undervoltage persists
    console.log(`[v${SCRIPT_VERSION}][UV-RECOVERY] Voltage conditions not met, resetting recovery counter: 0/${errorObjThreshold.underVoltageErr_recovery}`);
    errorObjRecoveryCount.underVoltageErr = 0;
  }

  // recover from OV
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
    // Reset recovery counter if overvoltage persists
    console.log(`[v${SCRIPT_VERSION}][OV-RECOVERY] Voltage conditions not met, resetting recovery counter: 0/${errorObjThreshold.overVoltageErr_recovery}`);
    errorObjRecoveryCount.overVoltageErr = 0;
  }
}

function filterVolts(volts) {
  // Check if the voltages are 0
  const isAllZero = volts.every((item) => item === 0);
  const someIsNotZero = volts.some((item) => item !== 0);
  if (isAllZero) {
    // no voltages, no need to check UV and OV
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

// Helper function to determine IMD device type and get resistance values
async function getIMDData(controller) {
  if (!controller) return null;

  // Check if it's a Gongyuan device
  if (controller["modbus.gongyuan.online"] !== undefined) {
    return {
      type: "gongyuan",
      isOnline: controller["modbus.gongyuan.online"],
    };
  }
  // Check if it's a CCS Bender device
  else if (controller["modbus.ccs_bender.online"] !== undefined) {
    return {
      type: "bender",
      isOnline: controller["modbus.ccs_bender.online"],
    };
  }
  return null;
}

// Constants for IMD resistance monitoring
const IMD_CONSTANTS = {
  UNHEALTHY_RESISTANCE: 65535,
  HEALTHY_THRESHOLD: 60000,
};

// Track which gun first showed unhealthy IMD and its timestamp
// BEFORE FIX: No synchronization mechanism for concurrent access
// AFTER FIX: Added isProcessing flag to prevent race conditions between main loop and IMD monitor loop
let firstUnhealthyIMDData = {
  gun: null,
  timestamp: null,
  isTripped: false,
  gpioConfirmed: false, // Track if GPIO has confirmed the error
  isProcessing: false, // Mutex flag to prevent concurrent modifications
};

async function checkIMDResistance(states, iostate) {
  try {
    const outlet0 = states[0] || {};
    const outlet1 = states[1] || {};
    const currentTime = Date.now();
    const gpioValue = iostate.controller1["gpio_470"];

    // Helper function to check if gun is in valid state for IMD check
    const isGunInValidState = (state) => {
      // Check if gun is between cable check and charging finish
      // phs > 3: After cable check started
      // phs < 8: Before charging finish
      return state.phs > 3 && state.phs < 8 && !state.needsUnplug;
    };

    // Helper function to check if gun is unplugged
    const isGunUnplugged = (state) => {
      return state.pilot === 0 || state.pilot === 1;
    };

    // Check if both guns are charging
    const isDualCharging =
      isGunInValidState(outlet0) && isGunInValidState(outlet1);
    const isSingleCharging = (isGunInValidState(outlet0) && !isGunInValidState(outlet1)) || (!isGunInValidState(outlet0) && isGunInValidState(outlet1));

    // Get IMD resistance values for both guns
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

    // Check unhealthy state for both guns
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

    // Handle dual charging scenario
    if (isDualCharging) {
      // If no gun is marked as first unhealthy yet
      if (firstUnhealthyIMDData.gun === null) {
        // Check which gun showed unhealthy first
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
        // If both guns show unhealthy at the same time, mark the one with higher resistance
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

      // Wait for GPIO confirmation before proceeding with error handling
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

      // Only process errors if GPIO has confirmed
      if (firstUnhealthyIMDData.gpioConfirmed) {
        // Process errors based on first unhealthy gun
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
                code: "75",
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
                code: "75",
                stopReason: "IMDResistanceError",
              });
              firstUnhealthyIMDData.isTripped = true;
            }
          }
        }
      }
    }
    // Handle single gun charging
    else if(isSingleCharging) {
      // Process Gun 1 (only if controller 1 is connected)
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

          // Wait for GPIO confirmation
          if (!firstUnhealthyIMDData.gpioConfirmed && gpioValue === true) {
            firstUnhealthyIMDData.gpioConfirmed = true;
            console.log(
              `[v${SCRIPT_VERSION}] GPIO confirmed IMD error for Gun 1 at:`,
              new Date(currentTime).toISOString()
            );
          }

          // Only process error if GPIO has confirmed
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
                  code: "75",
                  stopReason: "IMDResistanceError",
                });
                firstUnhealthyIMDData.isTripped = true;
              }
            }
          }
        }
      }

      // Process Gun 2 (only if controller 2 is connected)
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

          // Wait for GPIO confirmation
          if (!firstUnhealthyIMDData.gpioConfirmed && gpioValue === true) {
            firstUnhealthyIMDData.gpioConfirmed = true;
            console.log(
              `[v${SCRIPT_VERSION}] GPIO confirmed IMD error for Gun 2 at:`,
              new Date(currentTime).toISOString()
            );
          }

          // Only process error if GPIO has confirmed
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
                  code: "75",
                  stopReason: "IMDResistanceError",
                });
                firstUnhealthyIMDData.isTripped = true;
              }
            }
          }
        }
      }
    }

    // Handle error reset when guns are unplugged
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
        // Check if entering charging phase (5) and reset counter
        if (obj.phs == 5 && chargingStartTime.outlet1 === null) {
          console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 1 entering charging phase 5 - resetting comm error counter and starting grace period`);
          errorObjCount.powerModuleCommErr_1 = 0;
          errorObj.powerModuleCommErr_1 = false;
          chargingStartTime.outlet1 = Date.now();
        }
        
        if (obj.phs > 4 && obj.phs < 8) {
          // Check if we're still in grace period
          const inGracePeriod = chargingStartTime.outlet1 && 
                               (Date.now() - chargingStartTime.outlet1) < COMM_GRACE_PERIOD_MS;
          
          if (!inGracePeriod) {
            // Normal monitoring after grace period
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
            // Still in grace period, skip error checking
            const remainingGrace = COMM_GRACE_PERIOD_MS - (Date.now() - chargingStartTime.outlet1);
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 1 in grace period, ${Math.ceil(remainingGrace/1000)}s remaining`);
          }
        } else {
          // Clear counter when leaving charging phases
          if (errorObjCount.powerModuleCommErr_1 > 0) {
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 1 left charging phases - clearing comm error counter`);
            errorObjCount.powerModuleCommErr_1 = 0;
            errorObj.powerModuleCommErr_1 = false;
          }
          // Reset charging start time when not in charging phases
          chargingStartTime.outlet1 = null;
        }
      } else {
        // powerSaveInIdleMode = false, always monitor
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
        // Fixed Gun B logic to match Gun A (use same phase logic)
        // Check if entering charging phase (5) and reset counter
        if (obj.phs == 5 && chargingStartTime.outlet2 === null) {
          console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 2 entering charging phase 5 - resetting comm error counter and starting grace period`);
          errorObjCount.powerModuleCommErr_2 = 0;
          errorObj.powerModuleCommErr_2 = false;
          chargingStartTime.outlet2 = Date.now();
        }
        
        if (obj.phs > 4 && obj.phs < 8) {  // Changed to match Gun A logic
          // Check if we're still in grace period
          const inGracePeriod = chargingStartTime.outlet2 && 
                               (Date.now() - chargingStartTime.outlet2) < COMM_GRACE_PERIOD_MS;
          
          if (!inGracePeriod) {
            // Normal monitoring after grace period
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
            // Still in grace period, skip error checking
            const remainingGrace = COMM_GRACE_PERIOD_MS - (Date.now() - chargingStartTime.outlet2);
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 2 in grace period, ${Math.ceil(remainingGrace/1000)}s remaining`);
          }
        } else {
          // Clear counter when leaving charging phases
          if (errorObjCount.powerModuleCommErr_2 > 0) {
            console.log(`[v${SCRIPT_VERSION}] [PMCE] Gun 2 left charging phases - clearing comm error counter`);
            errorObjCount.powerModuleCommErr_2 = 0;
            errorObj.powerModuleCommErr_2 = false;
          }
          // Reset charging start time when not in charging phases
          chargingStartTime.outlet2 = null;
        }
      } else {
        // powerSaveInIdleMode = false, always monitor
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

const set_ov_uv = async () => {
  try {
    const response = await fetch(configEndpoint, { method: "GET" });
    const config = await response.json();
    if (!config || !config.underVoltageThreshold) {
      // console.log("Under voltage disabled in configuration");
    } else {
      Constants.UVThresh = config.underVoltageThreshold;
      // console.log("Undervoltage value set to :", Constants.UVThresh);
    }
    if (!config || !config.overVoltageThreshold) {
      // console.log("Over voltage disabled in configuration");
    } else {
      Constants.OVThresh = config.overVoltageThreshold;
      // console.log("Overvoltage value set to :", Constants.OVThresh);
    }
  } catch (err) {
    //console.error("error in set_ov_uv", err);
  }
};

// CheckErrors will check for Errors
const checkErrors = async () => {
  try {
    // get state
    const states = await getFromApi("state");
    if (states === undefined || states.length === 0) {
      return;
    }

    // get voltage Array
    let volts = await getVoltageArr(states);

    // get IO States
    await ioMapperState().then(async (iostateValue) => {

      if (iostateValue !== undefined && iostateValue.controller1 !== null) {
        // Process controller 1 data (only if controller 1 is connected)
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

      // Re-check for controller 1 availability for rest of processing
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

        // Check IMD resistance for both guns
        // await checkIMDResistance(states, iostateValue);

        // Handle error using AC meter
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
            // FIX for Issue 2: Check for power loss when AC meter is online but showing 0V
            const voltageKeys = [
              "modbus.selec.voltage_L1_L2",
              "modbus.selec.voltage_L1_L3",
              "modbus.selec.voltage_L3_L2",
            ];
            const acVolts = voltageKeys.map((key) => iostate[key] || 0);
            
            // MODIFIED: Check for undervoltage when 2 phases < 200V and Bender is online
            const benderOnline = iostate["modbus.ccs_bender.online"] === true;
            
            if (checkTwoPhasesBelow200(acVolts) && benderOnline) {
              console.log(`[v${SCRIPT_VERSION}] [AC Meter] Undervoltage condition - 2+ phases < ${Constants.powermoduleundervoltage}V with Bender online:`, acVolts);
              // Set undervoltage error directly here since we're not going through the normal voltage check
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
            } else if (checkTwoPhasesBelow200(acVolts) && !benderOnline) {
              console.log(`[v${SCRIPT_VERSION}] [AC Meter] Power loss detected - 2+ phases < ${Constants.powermoduleundervoltage}V:`, acVolts);
              await powerfailacmeter(states, iostate);
            } else {
              await powerrecoveracmeter(states, iostate);
            }
          }
        }
        // Handle error without AC meter
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

      // Check IO errors
      await checkIOTrip();

      // BYPASS Errors: Uncomment to enable the following checks
      if (!errorObj.powerLossErr && !errorObj.eStopErr) {
        if (iostateValue !== undefined && iostateValue.controller1 !== null) {
          // Process controller 1 data (only if controller 1 is connected)
          console.log(`[v${SCRIPT_VERSION}] [VOLTAGE CHECK] Processing voltage data from Controller 1`);
          const iostate = iostateValue.controller1;
          // FIX for Issue 1: Only use AC meter if powerSaveInIdleMode is true (AC meter installed)
          if (
            powerSaveInIdleMode === true &&
            "modbus.selec.online" in iostate &&
            iostate["modbus.selec.online"] === true
          ) {
            // Check if we're switching from power module to AC meter
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
            // Extract specific voltage values from iostate
            var voltsFiltered = voltageKeys.map((key) => iostate[key]);
            
            // NEW IMPLEMENTATION: Check for power loss condition before undervoltage
            if (checkTwoPhasesBelow200(voltsFiltered)) {
              console.log(`[v${SCRIPT_VERSION}] [AC Meter] Skipping UV/OV check - power loss condition detected (2+ phases < ${Constants.powermoduleundervoltage}V):`, voltsFiltered);
              // Don't check UV/OV during power loss - it's already handled above
            } else if (voltsFiltered.length > 0 && !errorObj.powerLossErr) {
              await checkSuppyVoltageTripACmeter(states, voltsFiltered, iostate);
              // Recover from Under Voltage, Over Voltage
              await checkRecoveryConditions(voltsFiltered, states);
            }
          } else {
            // Check if we're switching from AC meter to power module
            if (lastMonitoringSource === 'ac_meter') {
              console.log(`[v${SCRIPT_VERSION}] [UV/OV] Switching from AC meter to power module monitoring - resetting UV/OV counters and trip state`);
              errorObjCount.underVoltageErr = 0;
              errorObjCount.overVoltageErr = 0;
              errorObj.underVoltageErr = false;
              errorObj.overVoltageErr = false;
              tripCaseUV = UVTripState.Idle;
            }
            lastMonitoringSource = 'power_module';
            
            // Log the actual configuration status
            if (powerSaveInIdleMode === false) {
              console.log(`[v${SCRIPT_VERSION}] No AC meter installed (powerSaveInIdleMode=false), using power module voltages`);
            } else {
              console.log(`[v${SCRIPT_VERSION}] AC meter not available/offline, using power module voltages`);
            }
            // Get voltage array
            const volts = await getVoltageArr(states);

            // Filter voltage array
            var voltsFiltered = await filterVolts(volts);
            // Check Under Voltage, Over Voltage
            await checkSuppyVoltageTrip(states, voltsFiltered, iostate);
            // Recover from Under Voltage, Over Voltage
            await checkRecoveryConditions(voltsFiltered, states);
          }

          // // PowerModuleCommErr for individual outlets
          if (
            errorObj.powerLossErr === false &&
            errorObj.eStopErr === false &&
            errorObj.underVoltageErr === false
          ) {
            await checkPowerModuleCommErr(states, iostate);
          }
          // // Check for power module failure errors
          await checkPowerModuleFailureErr(states);
        }
      }

      // Log errorObj with proper formatting
      console.log(`[v${SCRIPT_VERSION}] [ERROR OBJ] Current error states:`, JSON.stringify(errorObj, null, 2));
      console.log(`[v${SCRIPT_VERSION}] [ERROR COUNT] Error counters:`, JSON.stringify(errorObjCount, null, 2));

      // post data to state obj
      if(iostateValue !== undefined && iostateValue.controller1 !== null){
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
              current_L1: 0,
              current_L2: 0,
              current_L3: 0,
              average_pf: 0,
              reactive_import_total: 0,
              reactive_total: 0,
              active_total: 0,
              total_net_kWh: 0,
            };

            // Add either bender or gongyuan based on availability
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

            // Add either bender or gongyuan based on availability
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

// BEFORE FIX: Async config fetch could leave powerSaveInIdleMode null
// AFTER FIX: Return promise and ensure config is loaded before starting main loop
// Modified: 16 August 2025 by Kushagra Mittal
const getpowersaveinidlemode = async () => {
  try {
    const response = await fetch(`${baseURL}ocpp-client/config`, {
      method: "GET",
    });
    const config = await response.json();
    if (config && typeof config.powerSaveInIdleMode === 'boolean') {
      powerSaveInIdleMode = config.powerSaveInIdleMode;
    }
    console.log(`[v${SCRIPT_VERSION}] powerSaveInIdleMode configured as: ${powerSaveInIdleMode}`);
  } catch (err) {
    console.error(`[v${SCRIPT_VERSION}] Error fetching powerSaveInIdleMode, using default: false`, err);
    // Keep default value on error
    powerSaveInIdleMode = false;
  }
};

// BEFORE FIX: Started loop immediately even if config fetch failed
// AFTER FIX: Ensure config is loaded with retry mechanism before starting
// Modified: 16 August 2025 by Kushagra Mittal
const start = async () => {
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] EcoG Error Reporting Script v${SCRIPT_VERSION}`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Initializing system...`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================`);

  // Check connected controllers on startup
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Checking connected controllers...`);
  await getConnectedControllers();

  // Retry config fetch up to 3 times
  for (let i = 0; i < 3; i++) {
    try {
      await getpowersaveinidlemode();
      break;
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] Attempt ${i + 1} to fetch config failed`, err);
      if (i === 2) {
        console.log(`[v${SCRIPT_VERSION}] Using default powerSaveInIdleMode value: false`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Periodically refresh connected controllers list (every 30 seconds)
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Setting up periodic controller check (every 30 seconds)`);
  setInterval(async () => {
    console.log(`[v${SCRIPT_VERSION}] [PERIODIC CHECK] Refreshing connected controllers list...`);
    await getConnectedControllers();
  }, 30000);

  // IIFE (Immediately Invoked Function Expression)
  const loop = async () => {
    try {
      await set_ov_uv();
      await checkErrors();

      setTimeout(loop, 1000); // Call the next loop
    } catch (err) {
      console.error(`[v${SCRIPT_VERSION}] [MAIN LOOP ERROR] Error executing checkErrors:`, err.message || err);
      if (err.stack) {
        console.error(`[v${SCRIPT_VERSION}] [MAIN LOOP ERROR] Stack:`, err.stack);
      }
      setTimeout(loop, 1000); // Call the next loop on error object
    }
  };

  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] System initialization complete`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] Starting error monitoring loop (1 second interval)`);
  console.log(`[v${SCRIPT_VERSION}] [STARTUP] ========================================\n`);

  loop();
};

console.log(`[v${SCRIPT_VERSION}][INIT] Calling start() function...`);
start();

console.log(`[v${SCRIPT_VERSION}][INIT] Starting IMD resistance monitor...`);
// Start the high-frequency IMD resistance monitor
startIMDResistanceMonitor();

console.log(`[v${SCRIPT_VERSION}][INIT] All initialization calls complete`);
