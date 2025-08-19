/*
 *
 * EcoG Error Reporting Script Created on 2023
 *
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
 * This script monitors the IO errors,Temperature errors and Supply Voltage errors
 * Version: 1.0.2
 */

// import fetch from "node-fetch";
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
  imdResistanceErr_1: 0, // Added IMD resistance error counter for gun 1
  imdResistanceErr_2: 0, // Added IMD resistance error counter for gun 2
};

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
  powerLossErr: 1,
  eStopErr: 1,
  doorOpenErr: 2,
  outletTemperatureErr: 4,
  cabinetTemperatureErr: 4,
  overVoltageErr: 10,
  underVoltageErr: 10,
  powerModuleFailureErr: 6,
  gunTemperatureErr_1: 6,
  gunTemperatureErr_2: 6,
  powerModuleCommErr_1: 14,
  powerModuleCommErr_2: 14,
  groundFault: 2,
  imdResistanceErr_1: 1, // Added IMD resistance threshold for gun 1 (3 consecutive readings)
  imdResistanceErr_2: 1, // Added IMD resistance threshold for gun 2 (3 consecutive readings)
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
  OVThresh: 477,
  UVThresh: 353,
  UV_OV_Hysteresis: 5,
  powermoduleundervoltage: 200
};

let powerSaveInIdleMode = null;

const configEndpoint = "http://localhost:3001/db/config";
const baseURL = "http://localhost:3001/";
let tripCaseUV = UVTripState.Idle;
let errIOSource = [];
let temperatures = {};
let voltage = {};

// Testing variables
const onTestingMode = false;

// Global variable to store the latest IO Mapper data
let latestIOMapping = null;

// High-frequency IMD resistance monitoring loop
const startIMDResistanceMonitor = async () => {
  const loop = async () => {
    try {
      // Fetch the latest IO Mapper data
      const iostateValue = await ioMapperState();
      if (iostateValue !== undefined) {
        const iostate = iostateValue.controller1;
        const IMDOnline = await getIMDData(iostate);

        if (IMDOnline.type === 'bender') {
          console.log('IMD type is bender. Stopping IMD resistance monitor loop.');
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

      // Schedule next loop
      setTimeout(loop, 20);
    } catch (err) {
      console.error("Error in IMD resistance monitor loop", err);
      setTimeout(loop, 20); // Continue loop despite errors
    }
  };

  loop(); // Start the loop
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
    .catch((err) =>
      console.error("[errorReporting] error in getFromApi ", err)
    );

const ioMapperState = async () => {
  try {
    const controllers = [1, 2];
    const promises = controllers.map((controller) =>
      fetch(`${baseURL}controllers/${controller}/api/proxy/iomapper/`, {
        headers: { "Content-Type": "application/json" },
      }).then((response) => response.json())
    );

    const [controller1Data, controller2Data] = await Promise.all(promises);
    return {
      controller1: controller1Data,
      controller2: controller2Data,
    };
  } catch (err) {
    console.error("Error fetching iomapper data:", err);
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
      console.log("tripping outlet " + obj.outlet);
      await postRequest(
        `${baseURL}controllers/${obj.outlet}/api/outlets/ccs/coap/e-stop`,
        { msg, code, stopReason }
      );
    } catch (err) {
      console.error(`failed to trigger e-stop on outlet ${obj.outlet}`, err);
    }
  }
};

const untrip = async (states, code) => {
  for (const obj of states) {
    try {
      console.log("un-tripping outlet " + obj.outlet);
      await postRequest(
        `${baseURL}controllers/${obj.outlet}/api/outlets/ccs/coap/e-stop`,
        { reset: true }
      );
    } catch (err) {
      console.error(`failed to reset e-stop on outlet ${obj.outlet}`, err);
    }
  }
};

function checkIOTrip() {
  // Check for EStop
  if (errIOSource.includes("emergency")) {
    errorObj.eStopErr = errorObjCount.eStopErr >= errorObjThreshold.eStopErr;
    errorObjCount.eStopErr++;
    errorObjCount.powerModuleCommErr_1 = 0;
    errorObjCount.powerModuleCommErr_2 = 0;
    //  if its EStop, reset inputUnderVoltage counter
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
  } else {
    errorObjCount.eStopErr = 0; // Reset count if error is false
    errorObj.eStopErr = false; // Set errorObj to false
  }
  // Check for doorOpenErr
  if (errIOSource.includes("door_open")) {
    errorObj.doorOpenErr =
      errorObjCount.doorOpenErr >= errorObjThreshold.doorOpenErr;
    errorObjCount.doorOpenErr++;
  } else {
    errorObjCount.doorOpenErr = 0; // Reset count if error is false
    errorObj.doorOpenErr = false; // Set errorObj to false
  }
  // Check for outletTemperatureErr
  if (errIOSource.includes("outlet_temp")) {
    errorObj.outletTemperatureErr =
      errorObjCount.outletTemperatureErr >=
      errorObjThreshold.outletTemperatureErr;
    errorObjCount.outletTemperatureErr++;
  } else {
    errorObjCount.outletTemperatureErr = 0; // Reset count if error is false
    errorObj.outletTemperatureErr = false; // Set errorObj to false
  }
  // Check for Cabinet temperature
  if (errIOSource.includes("cab_temp")) {
    errorObj.cabinetTemperatureErr =
      errorObjCount.cabinetTemperatureErr >=
      errorObjThreshold.cabinetTemperatureErr;
    errorObjCount.cabinetTemperatureErr++;
  } else {
    errorObjCount.cabinetTemperatureErr = 0; // Reset count if error is false
    errorObj.cabinetTemperatureErr = false; // Set errorObj to false
  }
  // Check for Gun A Temperature
  if (
    errIOSource.includes("guna1_temp") ||
    errIOSource.includes("guna2_temp")
  ) {
    errorObj.gunTemperatureErr_1 =
      errorObjCount.gunTemperatureErr_1 >=
      errorObjThreshold.gunTemperatureErr_1;
    errorObjCount.gunTemperatureErr_1++;
  } else {
    errorObjCount.gunTemperatureErr_1 = 0; // Reset count if error is false
    errorObj.gunTemperatureErr_1 = false; // Set errorObj to false
  }
  // Check for Gun B Temperature
  if (
    errIOSource.includes("gunb1_temp") ||
    errIOSource.includes("gunb2_temp")
  ) {
    errorObj.gunTemperatureErr_2 =
      errorObjCount.gunTemperatureErr_2 >=
      errorObjThreshold.gunTemperatureErr_2;
    errorObjCount.gunTemperatureErr_2++;
  } else {
    errorObjCount.gunTemperatureErr_2 = 0; // Reset count if error is false
    errorObj.gunTemperatureErr_2 = false;
  }
  // Check for Ground Fault
  if (errIOSource.includes("ground_fault")) {
    errorObj.groundFault =
      errorObjCount.groundFault >= errorObjThreshold.groundFault;
    errorObjCount.groundFault++;
  } else {
    errorObjCount.groundFault = 0; // Reset count if error is false
    errorObj.groundFault = false; // Set errorObj to false
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

const powerrecoveracmeter = async (states, iostate) => {
  if (iostate["modbus.selec.online"] === true && errorObj.powerLossErr) {
    console.log("Power resumed, should untrip");
    errorObjCount.powerLossErr = 0; // Reset count if error is false
    errorObj.powerLossErr = false; // Set errorObj to false
    errorObjFlags.powerLossErr = false;
    await untrip(states, "70");
  }
};

// Check to recover on PowerLoss
const powerONRecoverCheck = async (states, volts) => {
  // if (errorObj.powerLossErr && errorObjFlags.powerLossErr && volts.length > 0) {
  if (errorObj.powerLossErr && errorObjFlags.powerLossErr) {
    // if (volts.every(checkVoltsAboveThres)) {
    console.log("Bender online, power resumed, should untrip");
    errorObjCount.powerLossErr = 0; // Reset count if error is false
    errorObj.powerLossErr = false; // Set errorObj to false
    errorObjFlags.powerLossErr = false;
    await untrip(states, "70");
    // } else {
    //   // errorObj.powerLossErr=true, bender is online, voltage < threshold
    //   // could be module take some time to recover
    //   // lets return for now
    //   console.log("Bender online, but no voltages from power module");
    // }
  }
};
const powerfailacmeter = async (states, iostate) => {
  errorObj.powerLossErr =
    errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
  errorObjCount.powerLossErr++;
  if (errorObjCount.underVoltageErr > 0) {
    errorObjCount.underVoltageErr = 0;
  }
  powerrecoveracmeter(states, iostate);
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
    console.log(
      "Direct power failure due to voltage of any phase is less than 200 :",
      volts
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    errorObjCount.powerLossErr++;
  }
  // Bender offline
  if (
    volts.length > 0 &&
    !errorObj.powerLossErr &&
    volts.every(checkVoltsBelowThres) //&&
    //!errorObj.eStopErr //////////////////////////////////Check for Power loss even when E stop is active
  ) {
    console.log(
      "bender/gongyuan offline and under voltage on all phases, its power loss"
    );
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    errorObjCount.powerLossErr++;
    // we are in power loss state, reset under voltage
    if (errorObjCount.underVoltageErr > 0) {
      errorObjCount.underVoltageErr = 0;
    }
  } else if (
    !errorObj.powerLossErr &&
    //!errorObj.eStopErr && //////////////////////////////////Check for E stop even when Power loss is active
    isModuleUnavilable
  ) {
    console.log("bender/gongyuan offline and no voltage, its power loss");
    errorObj.powerLossErr =
      errorObjCount.powerLossErr >= errorObjThreshold.powerLossErr;
    errorObjCount.powerLossErr++;
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
      "Bender/gongyuan offline, no eStopErr, power resumed, untrip power loss"
    );
    await powerONRecoverCheck(states, volts);
    return;
  }

  // Above Threshold, trip power loss
  if (errorObj.powerLossErr && !errorObjFlags.powerLossErr) {
    errorObjFlags.powerLossErr = true;
    console.log(
      "Bender/gongyuan offline, no communication to power module -> its power loss and we trip"
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
  if (voltages.every(checkVoltsBelowThres)) {
    !!onTestingMode &&
      console.log(
        "Condition UnderVoltage, for phase " +
          t_case +
          " count " +
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
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
      errorObjCount.underVoltageErr++;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`supply voltage is too low: ${voltages}`);
      errorObjFlags.underVoltageErr = true;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
  }
};

async function checkSuppyVoltageTripACmeter(states, volts) {
  const isOverThreshold = (currentValue) => currentValue > Constants.OVThresh;
  const isUnderThreshold = (currentValue) => currentValue < Constants.UVThresh;

  // Check Over Voltage
  if (volts.some(isOverThreshold)) {
    !!onTestingMode && console.log("It's OverVoltage");
    if (!errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      errorObjCount.overVoltageErr++;
      errorObj.overVoltageErr =
        errorObjCount.overVoltageErr >= errorObjThreshold.overVoltageErr;
    } else if (errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      console.log(`Supply voltage is too high: ${volts}`);
      errorObjFlags.overVoltageErr = true;
      await trip(states, {
        msg: "ERR_OVER_VOLTAGE",
        code: "999",
        stopReason: "OverVoltageError",
      });
    }
  }

  // Check Under Voltage
  if (volts.some(isUnderThreshold)) {
    !!onTestingMode && console.log("Condition UnderVoltage");
    if (!errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      errorObjCount.underVoltageErr++;
      errorObj.underVoltageErr =
        errorObjCount.underVoltageErr >= errorObjThreshold.underVoltageErr;
    } else if (errorObj.underVoltageErr && !errorObjFlags.underVoltageErr) {
      console.log(`Supply voltage is too low: ${volts}`);
      errorObjFlags.underVoltageErr = true;
      await trip(states, {
        msg: "ERR_UNDER_VOLTAGE",
        code: "997",
        stopReason: "UnderVoltageError",
      });
    }
  }
}

async function checkSuppyVoltageTrip(states, volts) {
  // Check Over Voltage
  const isOverThreshold = (currentValue) => currentValue > Constants.OVThresh;
  if (volts.some(isOverThreshold)) {
    !!onTestingMode && console.log("its OverVoltage ");
    if (!errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      errorObjCount.overVoltageErr++;
      errorObj.overVoltageErr =
        errorObjCount.overVoltageErr >= errorObjThreshold.overVoltageErr;
    } else if (errorObj.overVoltageErr && !errorObjFlags.overVoltageErr) {
      console.log(`supply voltage is too high: ${volts}`);
      errorObjFlags.overVoltageErr = true;
      await trip(states, {
        msg: "ERR_OVER_VOLTAGE",
        code: "999",
        stopReason: "OverVoltageError",
      });
    }
  }

  // From here on check Under Voltgae and Over Voltage
  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.All) {
    !!onTestingMode && console.log("check trip for All phases"); // all the voltage value is less than 353
    await checkUnderVoltageThroughPowerModule(states, volts, UVTripState.All);
  }

  if (tripCaseUV == UVTripState.Idle || tripCaseUV == UVTripState.AB) {
    // only _AB voltage values of all modules is less than 353
    let case2_inV_AB = states.reduce((a, o) => {
      a.push(getPhaseVoltages(o, "inputVoltage_AB"));
      return a;
    }, []);
    case2_inV_AB = [].concat.apply([], case2_inV_AB);
    !!onTestingMode && console.log("check trip for Phase _AB", case2_inV_AB);
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
    !!onTestingMode && console.log("check trip for Phase _BC", case2_inV_BC);
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
    !!onTestingMode && console.log("check trip for Phase _CA", case2_inV_CA);
    await checkUnderVoltageThroughPowerModule(
      states,
      case2_inV_CA,
      UVTripState.CA
    );
  }
}

// Check Recovery conditions for UV and OV
async function checkRecoveryConditions(volts, states) {
  // recover from UV
  const checkUVRecoveryVal = (currentValue) =>
    currentValue > Constants.UVThresh + Constants.UV_OV_Hysteresis;
  if (
    errorObj.underVoltageErr &&
    errorObjFlags.underVoltageErr &&
    volts.every(checkUVRecoveryVal)
  ) {
    console.log("supply voltage recovered from low voltage: " + volts);
    errorObjCount.underVoltageErr = 0; // Reset count if error is false
    errorObj.underVoltageErr = false; // Set errorObj to false
    errorObjFlags.underVoltageErr = false; // Set errorObjFlags to false
    tripCaseUV = UVTripState.Idle; // set tripCaseUV to Idle
    await untrip(states, "997");
    return;
  }

  // recover from UV
  const checkOVRecoveryVal = (currentValue) =>
    currentValue < Constants.OVThresh - Constants.UV_OV_Hysteresis;
  if (
    errorObj.overVoltageErr &&
    errorObjFlags.overVoltageErr &&
    volts.every(checkOVRecoveryVal)
  ) {
    console.log("supply voltage recovered from high voltage: " + volts);
    errorObjCount.overVoltageErr = 0; // Reset count if error is false
    errorObj.overVoltageErr = false; // Set errorObj to false
    errorObjFlags.overVoltageErr = false; // Set errorObjFlags to false
    await untrip(states, "997");
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
    errorObjCount.powerModuleFailureErr++;
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
let firstUnhealthyIMDData = {
  gun: null,
  timestamp: null,
  isTripped: false,
  gpioConfirmed: false, // Track if GPIO has confirmed the error
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
        gun1Data.negativeResistance === IMD_CONSTANTS.UNHEALTHY_RESISTANCE ||
        gun1Data.positiveResistance === IMD_CONSTANTS.UNHEALTHY_RESISTANCE;
    }
    if (gun2Data) {
      gun2Data.isUnhealthy =
        gun2Data.negativeResistance === IMD_CONSTANTS.UNHEALTHY_RESISTANCE ||
        gun2Data.positiveResistance === IMD_CONSTANTS.UNHEALTHY_RESISTANCE;
    }

    // Handle dual charging scenario
    if (isDualCharging) {
      // If no gun is marked as first unhealthy yet
      if (firstUnhealthyIMDData.gun === null) {
        // Check which gun showed unhealthy first
        if ((gun1Data && gun1Data.isUnhealthy) && (gun2Data && !gun2Data.isUnhealthy)) {
          firstUnhealthyIMDData.gun = 1;
          firstUnhealthyIMDData.timestamp = currentTime;
          console.log(
            "During dual charging - Gun 1 first showed unhealthy IMD at:",
            new Date(currentTime).toISOString()
          );
        } else if ((gun1Data && !gun1Data.isUnhealthy) && (gun2Data && gun2Data.isUnhealthy)) {
          firstUnhealthyIMDData.gun = 2;
          firstUnhealthyIMDData.timestamp = currentTime;
          console.log(
            "During dual charging - Gun 2 first showed unhealthy IMD at:",
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
            `During dual charging - Gun ${firstUnhealthyIMDData.gun} marked as first fault (both showed unhealthy) at:`,
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
          `GPIO confirmed IMD error for Gun ${firstUnhealthyIMDData.gun} at:`,
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
          errorObjCount.imdResistanceErr_1++;
          errorObj.imdResistanceErr_1 =
            errorObjCount.imdResistanceErr_1 >=
            errorObjThreshold.imdResistanceErr_1;

          if (errorObj.imdResistanceErr_1) {
            console.log(
              `IMD Resistance Error on Gun 1 (First unhealthy gun) - Negative: ${gun1Data.negativeResistance}, Positive: ${gun1Data.positiveResistance}`
            );
            const gun1States = states.filter((state) => state.outlet == 1);
            if (gun1States.length > 0) {
              // await trip(gun1States, {
              //   msg: "ERR_IMD_RESISTANCE",
              //   code: "995",
              //   stopReason: "IMDResistanceError",
              // });
              firstUnhealthyIMDData.isTripped = true;
            }
          }
        } else if (
          firstUnhealthyIMDData.gun === 2 &&
          !firstUnhealthyIMDData.isTripped && gun2Data &&
          gun2Data.isUnhealthy
        ) {
          errorObjCount.imdResistanceErr_2++;
          errorObj.imdResistanceErr_2 =
            errorObjCount.imdResistanceErr_2 >=
            errorObjThreshold.imdResistanceErr_2;

          if (errorObj.imdResistanceErr_2) {
            console.log(
              `IMD Resistance Error on Gun 2 (First unhealthy gun) - Negative: ${gun2Data.negativeResistance}, Positive: ${gun2Data.positiveResistance}`
            );
            const gun2States = states.filter((state) => state.outlet == 2);
            if (gun2States.length > 0) {
              // await trip(gun2States, {
              //   msg: "ERR_IMD_RESISTANCE",
              //   code: "995",
              //   stopReason: "IMDResistanceError",
              // });
              firstUnhealthyIMDData.isTripped = true;
            }
          }
        }
      }
    }
    // Handle single gun charging
    else {
      // Process Gun 1
      if (iostate.controller1 && isGunInValidState(outlet0)) {
        if (gun1Data.isUnhealthy) {
          if (firstUnhealthyIMDData.gun === null) {
            firstUnhealthyIMDData.gun = 1;
            firstUnhealthyIMDData.timestamp = currentTime;
            console.log(
              "Gun 1 first showed unhealthy IMD resistance at:",
              new Date(currentTime).toISOString()
            );
          }

          // Wait for GPIO confirmation
          if (!firstUnhealthyIMDData.gpioConfirmed && gpioValue === true) {
            firstUnhealthyIMDData.gpioConfirmed = true;
            console.log(
              `GPIO confirmed IMD error for Gun 1 at:`,
              new Date(currentTime).toISOString()
            );
          }

          // Only process error if GPIO has confirmed
          if (
            firstUnhealthyIMDData.gpioConfirmed &&
            firstUnhealthyIMDData.gun === 1 &&
            !firstUnhealthyIMDData.isTripped
          ) {
            errorObjCount.imdResistanceErr_1++;
            errorObj.imdResistanceErr_1 =
              errorObjCount.imdResistanceErr_1 >=
              errorObjThreshold.imdResistanceErr_1;

            if (errorObj.imdResistanceErr_1) {
              console.log(
                `IMD Resistance Error on Gun 1 - Negative: ${gun1Data.negativeResistance}, Positive: ${gun1Data.positiveResistance}`
              );
              const gun1States = states.filter((state) => state.outlet == 1);
              if (gun1States.length > 0) {
                await trip(gun1States, {
                  msg: "ERR_IMD_RESISTANCE",
                  code: "995",
                  stopReason: "IMDResistanceError",
                });
                firstUnhealthyIMDData.isTripped = true;
              }
            }
          }
        }
      }

      // Process Gun 2
      if (iostate.controller2 && isGunInValidState(outlet1)) {
        if (gun2Data.isUnhealthy) {
          if (firstUnhealthyIMDData.gun === null) {
            firstUnhealthyIMDData.gun = 2;
            firstUnhealthyIMDData.timestamp = currentTime;
            console.log(
              "Gun 2 first showed unhealthy IMD resistance at:",
              new Date(currentTime).toISOString()
            );
          }

          // Wait for GPIO confirmation
          if (!firstUnhealthyIMDData.gpioConfirmed && gpioValue === true) {
            firstUnhealthyIMDData.gpioConfirmed = true;
            console.log(
              `GPIO confirmed IMD error for Gun 2 at:`,
              new Date(currentTime).toISOString()
            );
          }

          // Only process error if GPIO has confirmed
          if (
            firstUnhealthyIMDData.gpioConfirmed &&
            firstUnhealthyIMDData.gun === 2 &&
            !firstUnhealthyIMDData.isTripped
          ) {
            errorObjCount.imdResistanceErr_2++;
            errorObj.imdResistanceErr_2 =
              errorObjCount.imdResistanceErr_2 >=
              errorObjThreshold.imdResistanceErr_2;

            if (errorObj.imdResistanceErr_2) {
              console.log(
                `IMD Resistance Error on Gun 2 - Negative: ${gun2Data.negativeResistance}, Positive: ${gun2Data.positiveResistance}`
              );
              const gun2States = states.filter((state) => state.outlet == 2);
              if (gun2States.length > 0) {
                await trip(gun2States, {
                  msg: "ERR_IMD_RESISTANCE",
                  code: "995",
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
      console.log("Gun 1 (First unhealthy gun) error reset - gun unplugged");
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
      console.log("Gun 2 (First unhealthy gun) error reset - gun unplugged");
    }
  } catch (err) {
    console.error("Error in checkIMDResistance:", err);
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
        console.error(`Failed to inject event for outlet ${obj.outlet}`, err);
      });
    }
  }
};

const checkPowerModuleCommErr = async (states, iostate) => {
  for (const obj of states) {
    if (obj.outlet == 1) {
      if (powerSaveInIdleMode == true || powerSaveInIdleMode == null) {
        if (obj.phs > 4 && obj.phs < 8) {
          if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
            errorObj.powerModuleCommErr_1 =
              errorObjCount.powerModuleCommErr_1 >=
              errorObjThreshold.powerModuleCommErr_1;
            errorObjCount.powerModuleCommErr_1++;
            if (errorObjCount.underVoltageErr > 0) {
              errorObjCount.underVoltageErr = 0;
            }
          } else {
            errorObj.powerModuleCommErr_1 = false;
            errorObjCount.powerModuleCommErr_1 = 0;
          }
        } else {
          console.log("error pmce skipped");
        }
      } else {
        if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
          errorObj.powerModuleCommErr_1 =
            errorObjCount.powerModuleCommErr_1 >=
            errorObjThreshold.powerModuleCommErr_1;
          errorObjCount.powerModuleCommErr_1++;
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
        if (obj.pilot >= 3 && obj.pilot <= 4 && obj.phs == 7) {
          if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
            errorObj.powerModuleCommErr_2 =
              errorObjCount.powerModuleCommErr_2 >=
              errorObjThreshold.powerModuleCommErr_2;
            errorObjCount.powerModuleCommErr_2++;
            if (errorObjCount.underVoltageErr > 0) {
              errorObjCount.underVoltageErr = 0;
            }
          } else {
            errorObj.powerModuleCommErr_2 = false;
            errorObjCount.powerModuleCommErr_2 = 0;
          }
        } else {
          console.log("error pmce skipped");
        }
      } else {
        if (obj.can1_RX_time && obj.can1_RX_time.conv_timeout) {
          errorObj.powerModuleCommErr_2 =
            errorObjCount.powerModuleCommErr_2 >=
            errorObjThreshold.powerModuleCommErr_2;
          errorObjCount.powerModuleCommErr_2++;
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
      
      if (iostateValue !== undefined) {
        // Process controller 1 data
        const iostate = iostateValue.controller1;
        const controller2State = iostateValue.controller2;

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
              console.log("bender/gongyuan is offline");
              await powerOffErrCheck(states, volts);
            } else if (IMDOnline.isOnline === true) {
              console.log("bender/gongyuan is online");
              await powerONRecoverCheck(states, volts);
            }
          } else if (iostate["modbus.selec.online"] === true) {
            await powerrecoveracmeter(states, iostate);
          }
        }
        // Handle error without AC meter
        else {
          volts = await getVoltageArr(states);
          if (IMDOnline.isOnline === false) {
            console.log("bender/gongyuan is offline");
            await powerOffErrCheck(states, volts);
          } else if (IMDOnline.isOnline === true) {
            console.log("bender/gongyuan is online");
            await powerONRecoverCheck(states, volts);
          }
        }
      }

      // Check IO errors
      await checkIOTrip();

      // BYPASS Errors: Uncomment to enable the following checks
      if (!errorObj.powerLossErr && !errorObj.eStopErr) {
        if (iostateValue !== undefined) {
          // Process controller 1 data
          const iostate = iostateValue.controller1;
          if (
            "modbus.selec.online" in iostate &&
            iostate["modbus.selec.online"] === true
          ) {
            const voltageKeys = [
              "modbus.selec.voltage_L1_L2",
              "modbus.selec.voltage_L1_L3",
              "modbus.selec.voltage_L3_L2",
            ];
            // Extract specific voltage values from iostate
            var voltsFiltered = voltageKeys.map((key) => iostate[key]);
            if (voltsFiltered.length > 0 && !errorObj.powerLossErr) {
              await checkSuppyVoltageTripACmeter(states, voltsFiltered);
              // Recover from Under Voltage, Over Voltage
              await checkRecoveryConditions(voltsFiltered, states);
            }
          } else {
            console.log("Ac meter is not available/connected");
            // Get voltage array
            const volts = await getVoltageArr(states);

            // Filter voltage array
            var voltsFiltered = await filterVolts(volts);
            // Check Under Voltage, Over Voltage
            await checkSuppyVoltageTrip(states, voltsFiltered);
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

      console.log("errorObj", errorObj);

      // post data to state obj
      if(iostateValue !== undefined){
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
              console.error("failed to post on outlet " + obj.outlet, err);
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
              console.error("failed to post on outlet " + obj.outlet, err);
            });
          }
        }
      } else {
        for (const obj of states) {
          await postRequest(`${baseURL}outlets/${obj.outlet}/state`, {
            temperatures: temperatures,
            errorObj: errorObj,
          }).catch((err) => {
            console.error(`failed to post on outlet ${obj.outlet}`, err);
          });
        }
      }
      }
      
    });
  } catch (err) {
    console.error("error in checkErrors", err);
  }
};

const getpowersaveinidlemode = async () => {
  try {
    if (powerSaveInIdleMode == null) {
      const response = await fetch(`${baseURL}ocpp-client/config`, {
        method: "GET",
      });
      const config = await response.json();
      powerSaveInIdleMode = config.powerSaveInIdleMode;
    }
  } catch (err) {
    console.error("Error fetching powerSaveInIdleMode, retrying...", err);
    setTimeout(getpowersaveinidlemode, 1000);
  }
};

const start = async () => {
  await getpowersaveinidlemode();
  // IIFE (Immediately Invoked Function Expression)
  const loop = async () => {
    try {
      await set_ov_uv();
      await checkErrors();

      setTimeout(loop, 1000); // Call the next loop
    } catch (err) {
      console.error("error on executing checkErrors", err);
      setTimeout(loop, 1000); // Call the next loop on error object
    }
  };
  loop();
};

start();

// Start the high-frequency IMD resistance monitor
startIMDResistanceMonitor();
