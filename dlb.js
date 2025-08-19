/***********************************/
/*  Company: Quench Chargers Pvt. Ltd. 
    Author: Keshav Asopa, Jay Patil, Harsh Tawade
    Purpose: This file contains the JavaScript code for a Dynamic Load Balancing (50% Switching) EV charger .
    Created: 7th Feb, 2023 
    Contact: sidev21@adorpower.com, sidev22@adorpower.com, quenchdev5@quenchchargers.com
    Revision history: 18-12-2024 
    Revision version - 4
    Changelogs: Merged with Smart Charging
                
/***********************************/

/***********************************/
/* ASSIGN GLOBAL VARIABLES
/***********************************/

const baseUrl = "http://localhost:3001";

// Dynamic Load Balancing variables
var isRunOnOutlet = [false, false];
var isCanExecuted = [false, false];
const powerLowDemandValue = 10000;
//FOR PRODUCTION USE 2 DEFAULT CASE.
var numOfModule = 2;
//Assuming each power module is 30kW.
var powercapValue = numOfModule * 30000;
//PowerDemandValue is 50% of total kW.
var powerDemandValue = Math.floor(powercapValue / 2000);
let isDualVCCU = false;
var convModuleList = [];

// Smart Charging variables
let allStates = [];

/***********************************/
/* UTILITY FUNCTIONS
/***********************************/
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getStatus() {
  const response = await fetch(baseUrl + "/state", {
    headers: {
      accept: "application/json",
    },
  });
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

/***********************************/
/* DYNAMIC LOAD BALANCING FUNCTIONS
/***********************************/
async function stackSelection(outletNum, bodyInput) {
  try {
    const response = await fetch(
      baseUrl + "/controllers/" + outletNum + "/api/stack-selection",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: bodyInput,
        redirect: "follow",
      }
    );
    console.log("stackSelection Response:", await response.text());
  } catch (error) {
    console.error("Stack Selection Error:", error);
  }
}

async function CANOnOff(outletNum, bodyInput) {
  try {
    const response = await fetch(
      baseUrl + "/controllers/" + outletNum + "/api/outlets/ccs/coap/activate-gen-can",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ActivateGenericCAN: bodyInput }),
      }
    );
    console.log("CANOnOff Response:", await response.text());
  } catch (error) {
    console.error("CAN On/Off Error:", error);
  }
}

async function ConvModule(outletNum, bodyInput) {
  try {
    let rawTemp = "1";
    if (bodyInput == "1") {
      rawTemp = convModuleList.slice(0, Math.ceil(convModuleList.length / 2)).join(",");
    } else if (bodyInput == "2") {
      rawTemp = convModuleList.join(",");
    }

    const response = await fetch(
      baseUrl + "/controllers/" + outletNum + "/api/outlets/ccs/coap/active-conv-modules",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ActiveConverterModules: rawTemp }),
      }
    );
    console.log("ConvModule Response for", rawTemp, ":", await response.text());
  } catch (error) {
    console.error("Conv Module Error:", error);
  }
}

/***********************************/
/* SMART CHARGING FUNCTIONS
/***********************************/
const fetchSmartChargingLimits = async () => {
  try {
    const response = await fetch(baseUrl + '/services/ocpp/smartCharging/limits');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Smart Charging Limits:', data);
    return data;
  } catch (error) {
    console.error('Error fetching smart charging limits:', error);
    return { limits: [], CPMaxProfileLimit: null };
  }
};

const getState = (outlet) => {
  console.log("Searching for outlet:", outlet);
  console.log("Available states:", allStates);
  return allStates.find((state) => state.outlet === String(outlet));
};

const isConsuming = (state) => {
  return state && state.phs === 7;
};

const extractPowerCap = (state) => {
  return state ? state.PowerCapW : -1;
};

/***********************************/
/* POWER MANAGEMENT FUNCTIONS 
/* Priority Rules:
/* 1. Smart charging has ultimate priority for power limits
/* 2. DLB handles module and stack allocation
/* 3. DLB's module allocation serves as a fallback if smart charging fails
/***********************************/

/***********************************/
/* ENHANCED LOGGING FUNCTIONS
/***********************************/
function logPowerTransition(outlet, fromPower, toPower, reason) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Power Transition - Outlet ${outlet}`);
  console.log(`├── From: ${fromPower}W`);
  console.log(`├── To: ${toPower}W`);
  console.log(`└── Reason: ${reason}\n`);
}

function logModuleAllocation(outlet, modules, operation) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Module Allocation - Outlet ${outlet}`);
  console.log(`├── Operation: ${operation}`);
  console.log(`├── Modules: ${modules.join(', ')}`);
  console.log(`└── Total Modules: ${modules.length}\n`);
}

function logChargingStatus(outletNum, dlbLimit, smartLimit, finalPower) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Charging Status for Outlet ${outletNum}:`);
  console.log(`├── DLB Limit: ${dlbLimit}W`);
  console.log(`├── Smart Charging Limit: ${smartLimit !== null ? smartLimit + 'W' : 'Not Set'}`);
  console.log(`├── Final Power: ${finalPower}W`);
  console.log(`└── Control Mode: ${smartLimit !== null ? 'Smart Charging' : 'DLB'}\n`);
}

/***********************************/
/* UPDATED MODULE VALIDATION AND POWER MANAGEMENT
/***********************************/

function validateModuleAllocation(modules, powerRequest) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Module Allocation Check:`);
  console.log(`├── Requested Modules: ${modules}`);
  console.log(`├── Power Request: ${powerRequest}W`);
  
  // In idle mode, we should allow full power even without active module allocation
  const isIdleMode = modules.length === 0;
  if (isIdleMode) {
    console.log(`└── VALID: System in idle mode, allowing full power capacity\n`);
    return true;
  }
  
  // Regular validation for active charging mode
  if (!Array.isArray(modules)) {
    console.error('└── ERROR: Invalid module array');
    return false;
  }
  
  if (powerRequest <= 0) {
    console.error('└── ERROR: Invalid power request');
    return false;
  }
  
  const maxPowerPerModule = 30000; // 30kW per module
  const totalPossiblePower = modules.length * maxPowerPerModule;
  
  if (powerRequest > totalPossiblePower) {
    console.error(`└── ERROR: Power request (${powerRequest}W) exceeds module capacity (${totalPossiblePower}W)`);
    return false;
  }
  
  console.log(`└── VALID: Module allocation check passed\n`);
  return true;
}

// Modified PowerCap function to use full power cap in idle state
// Modified PowerCap function to consistently respect smart charging limits
// Modify handleOutletOne and handleOutletTwo to respect smart charging limits
async function PowerCap(outletNum, bodyInput, smartChargingLimit = null) {
  try {
      const states = await getStatus();
      const currentState = states.find(state => state.outlet === outletNum.toString());
      const currentPower = currentState ? currentState.PowerCapW : 0;
      const isIdle = currentState ? currentState.phs === 1 : false;

      // Get smart charging limits
      const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
      const effectiveTotalPower = CPMaxProfileLimit || powercapValue;
      
      // Determine base DLB limit
      let dlbLimit;
      if (bodyInput == "0") dlbLimit = powerLowDemandValue;
      else if (bodyInput == "1") dlbLimit = Math.floor(effectiveTotalPower / 2);
      else if (bodyInput == "2") dlbLimit = effectiveTotalPower;
      else dlbLimit = effectiveTotalPower;

      // Calculate final power cap
      let finalPowerCap;
      if (typeof smartChargingLimit === 'number' && smartChargingLimit > 0) {
          finalPowerCap = Math.min(smartChargingLimit, dlbLimit);
      } else if (isIdle) {
          finalPowerCap = effectiveTotalPower;
      } else {
          finalPowerCap = dlbLimit;
      }

      // Ensure we never set a zero limit
      if (finalPowerCap === 0) {
          finalPowerCap = isIdle ? effectiveTotalPower : powerLowDemandValue;
      }

      // Final check against CPMaxProfileLimit
      if (CPMaxProfileLimit) {
        finalPowerCap = Math.min(finalPowerCap, CPMaxProfileLimit);
      }
      // Check if power value has actually changed
      if (finalPowerCap === currentPower) {
        console.log(`Power cap unchanged for outlet ${outletNum}: ${currentPower}W`);
        return "Power cap unchanged";
      }

      const reason = smartChargingLimit ? "Smart Charging Limit" :
                    bodyInput === "0" ? "Module Switching" :
                    "Normal DLB Operation";
      
      logPowerTransition(outletNum, currentPower, finalPowerCap, reason);

      const response = await fetch(baseUrl + "/outlets/" + outletNum + "/powercap", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ PowerCapW: finalPowerCap }),
      });
      return await response.text();
  } catch (error) {
      console.error("Power Cap Error:", error);
  }
}


async function handleOutletOneWithLimit(effectiveLimit) {
  await PowerCap("1", "0", effectiveLimit);
  await wait(5000);
  
  await stackSelection("2", "0");
  await wait(1000);
  
  await stackSelection("1", "1");
  await wait(1000);
  await ConvModule("1", "2");
  await wait(1000);
  
  await PowerCap("1", "2", effectiveLimit);
}

async function handleOutletTwoWithLimit(effectiveLimit) {
  await PowerCap("2", "0", effectiveLimit);
  await wait(5000);
  
  await stackSelection("1", "0");
  await wait(1000);
  
  await stackSelection("2", "2");
  await wait(1000);
  await ConvModule("2", "2");
  await wait(1000);
  
  await PowerCap("2", "2", effectiveLimit);
}

// Modified handleSmartCharging function to use full power cap in idle state
async function handleSmartCharging() {
  try {
      allStates = await getStatus();
      const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();

      console.log('Smart Charging Status:', {
          CPMaxProfileLimit,
          limits: limits.map(l => ({
              outlet: l.outlet,
              limit: l.limit,
              state: getState(l.outlet) ? getState(l.outlet).phs : undefined
          }))
      });

      // Process each outlet's smart charging limit
      for (const _obj of limits) {
          const state = getState(_obj.outlet);
          
          // Skip if no state found
          if (!state) continue;
          
          // Calculate effective limit
          let effectiveLimit = _obj.limit;
          
          // If we have a CPMaxProfileLimit, ensure we don't exceed it but also don't go to zero
          if (CPMaxProfileLimit && CPMaxProfileLimit > 0) {
              effectiveLimit = Math.min(effectiveLimit || powercapValue, CPMaxProfileLimit);
          } else {
              // If no CPMaxProfileLimit, use the outlet limit or default to full power cap
              effectiveLimit = effectiveLimit || powercapValue;
          }
          
          // Ensure minimum power in all states
          if (effectiveLimit === 0) {
              effectiveLimit = Math.min(powercapValue,powerLowDemandValue);
              console.log(`Adjusted zero limit to ${effectiveLimit}`);
          }
          
          // Get current module allocation
          const activeModules = getActiveModulesForOutlet(_obj.outlet);
          const maxPowerForModules = activeModules.length * 30000;
          
          console.log(`Smart Charging calculation for outlet ${_obj.outlet}:`, {
              originalLimit: _obj.limit,
              CPMaxProfileLimit,
              effectiveLimit,
              maxPowerForModules,
              activeModules: activeModules.length,
              state: state.phs,
          });
          
          // Apply the calculated limit
          await PowerCap(_obj.outlet, null, effectiveLimit);
      }
  } catch (error) {
      console.error('Smart Charging Error:', error);
  }
}

/***********************************/
/* ENHANCED MODULE TRACKING
/***********************************/
function getActiveModulesForOutlet(outletNum) {
  // Convert outletNum to string for consistency
  outletNum = outletNum.toString();
  
  // Calculate module ranges
  const totalModules = convModuleList.length;
  const halfModules = Math.ceil(totalModules / 2);
  
  let activeModules = [];
  
  // Determine module allocation
  if (isRunOnOutlet[outletNum - 1]) {
    activeModules = convModuleList;
    logModuleAllocation(outletNum, activeModules, "Full Power Mode");
  } else if (isCanExecuted[outletNum - 1]) {
    activeModules = outletNum === "1" 
      ? convModuleList.slice(0, halfModules)
      : convModuleList.slice(halfModules);
    logModuleAllocation(outletNum, activeModules, "Split Power Mode");
  } else {
    logModuleAllocation(outletNum, [], "No Modules Allocated");
  }
  
  return activeModules;
}

function getOutletLimit(limits, outletNumber) {
  if (!limits || !Array.isArray(limits)) {
      return null;
  }
  const outletConfig = limits.find(l => l && l.outlet === outletNumber);
  return outletConfig ? outletConfig.limit : null;
}

async function Equalise() {
  console.log("Equalising power distribution with smart charging limits");
  
  // Get smart charging limits
  const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
  
  // Calculate effective total and per-outlet power
  const effectiveTotalPower = CPMaxProfileLimit || powercapValue;
  const perOutletPower = Math.floor(effectiveTotalPower / 2);
  
  // Calculate individual outlet limits
  const outlet1Limit = Math.min(
      perOutletPower,
      getOutletLimit(limits, "1") || powercapValue
  );
  const outlet2Limit = Math.min(
      perOutletPower,
      getOutletLimit(limits, "2") || powercapValue
  );

  console.log("Smart charging equalisation:", {
      CPMaxProfileLimit,
      effectiveTotalPower,
      outlet1Limit,
      outlet2Limit
  });

  if(effectiveTotalPower > 10000) {
      await PowerCap("1", "0", outlet1Limit);
      await wait(250);
      await PowerCap("2", "0", outlet2Limit);
      await wait(250);
  }

  await stackSelection("1", "0");
  await wait(250);
  await stackSelection("2", "0");
  await wait(250);

  await ConvModule("1", "1");
  await wait(250);
  await ConvModule("2", "1");
  await wait(5000);

  await PowerCap("1", "1", outlet1Limit);
  await wait(5000);
  await PowerCap("2", "1", outlet2Limit);
}

/***********************************/
/* MAIN CONTROL LOGIC
/***********************************/

async function MainFlow() {
  console.log("Initializing system...");
  await wait(10000);

  // Initial setup
  let getStateList = await getStatus();
  let tempNumOfModule = getStateList[0] && getStateList[0].numberOfModulesAvailable;

  while (!tempNumOfModule || tempNumOfModule < 2 || tempNumOfModule > 20) {
      await wait(1000);
      getStateList = await getStatus();
      tempNumOfModule = getStateList[0] && getStateList[0].numberOfModulesAvailable;
  }

  await CANOnOff("1", true);
  await CANOnOff("2", true);
  
  // Initialize system parameters
  numOfModule = tempNumOfModule;
  powercapValue = getStateList[0] && getStateList[0].pLimit;
  powerDemandValue = Math.floor(powercapValue / 2000);
  convModuleList = Array.from({length: numOfModule}, (_, i) => i + 1);

  console.log("System initialized with:", {
      modules: numOfModule,
      powerCap: powercapValue,
      powerDemand: powerDemandValue,
      convModules: convModuleList
  });

  // Main control loop
  while (true) {
      try {
          // Handle Dynamic Load Balancing
          let getStatusList = await getStatus();
          await handleDynamicLoadBalancing(getStatusList);
          
          // Handle Smart Charging
          await handleSmartCharging();
          
          await wait(1000);
      } catch (error) {
          console.error("Main control loop error:", error);
          await wait(5000);
      }
  }
}

async function handleDynamicLoadBalancing(getStatusList) {
  // Safely check for required arrays and objects
  if (!getStatusList || !Array.isArray(getStatusList) || getStatusList.length < 2) {
      console.error("Invalid status list provided to handleDynamicLoadBalancing");
      return;
  }

  // Get smart charging limits
  const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
  
  // Calculate effective power cap
  const effectivePowerCap = CPMaxProfileLimit || powercapValue;
  powerDemandValue = Math.floor(effectivePowerCap / 2000);
  
  const outlet0 = getStatusList[0] || {};
  const outlet1 = getStatusList[1] || {};

  // Check initial conditions using safe property access
  if (outlet0.phs == 1 && outlet0.pilot != 2 && 
      outlet0.pilot != 7 && outlet1.phs == 1 && 
      outlet1.pilot != 2 && outlet1.pilot != 7) {
      isRunOnOutlet = [false, false];
      isCanExecuted = [false, false];
      return;
  }

  const outlet1Active = outlet0.phs != 1 && outlet0.pilot != 0 && outlet0.pilot != 1;
  const outlet2Active = outlet1.phs != 1 && outlet1.pilot != 0 && outlet1.pilot != 1;
  
  if (isCanExecuted[0] && isCanExecuted[1] && (outlet1Active !== outlet2Active)) {
      isRunOnOutlet = [false, false];
      isCanExecuted = [false, false];
  }

  for (let i = 0; i < getStatusList.length; i++) {
      const currentOutlet = getStatusList[i] || {};
      const otherOutletIndex = i === 0 ? 1 : 0;
      const otherOutlet = getStatusList[otherOutletIndex] || {};
      
      if (currentOutlet.pilot != 0 && currentOutlet.pilot != 1 && !isDualVCCU) {
          if (!isRunOnOutlet[i] && currentOutlet.externalStop === false) {
              const otherOutletInactive = otherOutlet.phs == 1 && 
                                        otherOutlet.pilot != 2 && 
                                        otherOutlet.pilot != 7;

              if (otherOutletInactive) {
                  const outletNumber = currentOutlet.outlet;
                  const outletLimit = getOutletLimit(limits, outletNumber);
                  const effectiveLimit = Math.min(
                      outletLimit || effectivePowerCap,
                      CPMaxProfileLimit || effectivePowerCap
                  );
                  
                  if (currentOutlet.outlet == "1") {
                      await handleOutletOneWithLimit(effectiveLimit);
                  } else {
                      await handleOutletTwoWithLimit(effectiveLimit);
                  }
                  isRunOnOutlet[i] = true;
                  isCanExecuted[i] = true;
              } else if (!isCanExecuted[i]) {
                  await Equalise();
                  isCanExecuted[0] = true;
                  isCanExecuted[1] = true;
              }
              
              if (currentOutlet.auth) {
                  await handlePowerDemand(i, currentOutlet, getStatusList, effectivePowerCap);
              }
          }
      }
  }
}

async function handlePowerDemand(i, currentOutlet, getStatusList, effectivePowerCap) {
  // Safely access nested properties
  const pv = currentOutlet["pv"] || 0;
  const tc = currentOutlet["tc"] || 0;
  const powerDemand = Math.floor((pv * tc) / 1000);
  
  const otherOutletIdle = (i == 0 && getStatusList[1] && getStatusList[1]["phs"] == 1) || 
                         (i == 1 && getStatusList[0] && getStatusList[0]["phs"] == 1);

  if (powerDemand != 0 && otherOutletIdle && powerDemand >= powerDemandValue - 2) {
      const { limits } = await fetchSmartChargingLimits();
      
      // Use the previously defined helper function for safe limit access
      const outletNumber = parseInt(currentOutlet["outlet"]);
      const outletLimit = getOutletLimit(limits, outletNumber.toString());
      const effectiveLimit = Math.min(outletLimit || effectivePowerCap, effectivePowerCap);
      
      if (currentOutlet["outlet"] == "1") {
          await handleOutletOneWithLimit(effectiveLimit);
      } else {
          await handleOutletTwoWithLimit(effectiveLimit);
      }
      isRunOnOutlet[i] = true;
  }
}

/***********************************/
/* START THE SYSTEM
/***********************************/
async function start() {
  await MainFlow();
}

start();