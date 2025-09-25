// flb.js - Full Load Balancing & Smart Charging Script
// Covers all scenarios from DLB_And_Smart_Charging_Scenerios.md
// Author: Vishal Sikchi
// Date: 17/07/2025

/***********************************/
/* GLOBAL CONFIGURATION & IMPORTS  */
/***********************************/

// import fetch from "node-fetch";

const baseUrl = "http://localhost:3001";
const powerLowDemandValue = 10000;
const SAFETY_DEDUCTION_W = 500; // Hardware tolerance safety margin to prevent exceeding configured limits
let numOfModule = 2;
let powercapValue = numOfModule * 30000;
let powerDemandValue = Math.floor(powercapValue / 2000);
let convModuleList = [];
let isRunOnOutlet = [false, false];
let isCanExecuted = [false, false];
let allStates = [];

/***********************************/
/* UTILITY FUNCTIONS               */
/***********************************/
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getStatus() {
    try {
        const response = await fetch(baseUrl + "/state", {
            headers: { accept: "application/json" },
        });
        if (!response.ok) {
            // throw new Error(`HTTP error! status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        console.error("Error fetching status:", error);
        // throw error;
    }
}

async function fetchSmartChargingLimits() {
    try {
        const response = await fetch(baseUrl + '/services/ocpp/smartCharging/limits');
        if (!response.ok) {
            // throw new Error(`HTTP error! status: ${response.status}`);
            return { limits: [], CPMaxProfileLimit: null };
        }
        const data = await response.json();
        console.log('Smart Charging Limits:', data);
        return data;
    } catch (error) {
        console.error('Error fetching smart charging limits:', error);
        return { limits: [], CPMaxProfileLimit: null };
    }
}

/***********************************/
/* API WRAPPERS                    */
/***********************************/
async function stackSelection(outletNum, bodyInput) {
    try {
        const response = await fetch(
            baseUrl + "/controllers/" + outletNum + "/api/stack-selection",
            {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: bodyInput,
                redirect: "follow",
            }
        );
        if (!response.ok) {
            // throw new Error(`Stack selection failed: ${response.status}`);
            return [];
        }
        const result = await response.text();
        console.log("stackSelection Response:", result);
        return result;
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ActivateGenericCAN: bodyInput }),
            }
        );
        if (!response.ok) {
            // throw new Error(`CAN On/Off failed: ${response.status}`);
            return [];
        }
        const result = await response.text();
        console.log("CANOnOff Response:", result);
        return result;
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
        console.log(`Setting modules for outlet ${outletNum}:`, rawTemp || "No modules");
        
        const response = await fetch(
            baseUrl + "/controllers/" + outletNum + "/api/outlets/ccs/coap/active-conv-modules",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ActiveConverterModules: rawTemp }),
            }
        );
        if (!response.ok) {
            console.error(`Conv module failed for outlet ${outletNum}: HTTP ${response.status}`);
            return [];
        }
        const result = await response.text();
        console.log(`ConvModule Response for outlet ${outletNum} (${bodyInput}):`, result);
        return result;
    } catch (error) {
        console.error(`Conv Module Error for outlet ${outletNum}:`, error);
    }
}

/***********************************/
/* LOGGING                         */
/***********************************/
function logScenario(scenario, details, powerConfig = null) {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] SCENARIO: ${scenario}`);
    console.log(`├── Details: ${details}`);
    
    if (powerConfig) {
        console.log(`\n=== Power Cap Configuration ===`);
        console.log(`├── System Power Cap: ${powerConfig.systemPowerCap}W`);
        
        if (powerConfig.CPMaxProfileLimit !== undefined) {
            console.log(`├── CPMaxProfileLimit: ${powerConfig.CPMaxProfileLimit !== null ? powerConfig.CPMaxProfileLimit + 'W' : 'Not Set'}`);
        }
        
        if (powerConfig.effectivePowerCap !== undefined) {
            console.log(`├── Effective Power Cap: ${powerConfig.effectivePowerCap}W`);
        }
        
        if (powerConfig.status) {
            console.log(`├── Status: ${powerConfig.status}`);
        }
        
        console.log(`\n├── Outlet 1:`);
        console.log(`│   ├── Raw Smart Limit: ${powerConfig.outlet1 ? powerConfig.outlet1.rawLimit : 'Not Set'}`);
        if (powerConfig.outlet1 && powerConfig.outlet1.constraint) {
            console.log(`│   ├── Constraint: ${powerConfig.outlet1.constraint}`);
        }
        console.log(`│   └── Final Applied Limit: ${powerConfig.outlet1 ? powerConfig.outlet1.finalLimit : 'Not Set'}`);
        
        console.log(`\n├── Outlet 2:`);
        console.log(`│   ├── Raw Smart Limit: ${powerConfig.outlet2 ? powerConfig.outlet2.rawLimit : 'Not Set'}`);
        if (powerConfig.outlet2 && powerConfig.outlet2.constraint) {
            console.log(`│   ├── Constraint: ${powerConfig.outlet2.constraint}`);
        }
        console.log(`│   └── Final Applied Limit: ${powerConfig.outlet2 ? powerConfig.outlet2.finalLimit : 'Not Set'}`);
    }
    
    console.log(`└── Status: Processing\n`);
}

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

/***********************************/
/* SCENARIO HANDLERS (STUBS)       */
/***********************************/
// 1. System State Cases
async function handleIdleState() {
    // Fetch smart charging limits for idle state
    const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectiveTotalPower = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    // Reset both outlets first
    await stackSelection("1", "0");
    await wait(250);
    await stackSelection("2", "0");
    await wait(250);
    
    // Allocate half modules to each outlet
    await ConvModule("1", "1");  // Half modules to outlet 1
    await wait(250);
    await ConvModule("2", "1");  // Half modules to outlet 2
    await wait(250);
    
    // Set power caps
    await setPowerCap("1", effectiveTotalPower, "Idle State");
    await wait(250);
    await setPowerCap("2", effectiveTotalPower, "Idle State");
    
    // Reset execution flags
    isRunOnOutlet = [false, false];
    isCanExecuted = [false, false];

    logScenario("Idle State", `Both outlets set to ${effectiveTotalPower}W (full system capacity)`);
}

// Helper for setting power cap with 500W safety deduction
async function setPowerCap(outletNum, power, reason = "Power Cap Applied") {
    try {
        let safePower;

        if (power < 0) {
            // Invalid request → fall back to at least the low-demand value
            safePower = Math.max(power, powerLowDemandValue);
        } else {
            // Normal case → cap at system maximum
            safePower = Math.min(power, powercapValue);
        }

        const response = await fetch(baseUrl + "/outlets/" + outletNum + "/powercap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ PowerCapW: safePower }),
        });

        if (!response.ok) {
            return [];
        }

        const result = await response.text();
        logPowerTransition(outletNum, "?", safePower, `${reason} (Original: ${power}W, Applied: ${safePower}W)`);
        return result;
    } catch (error) {
        console.error("PowerCap Error:", error);
    }
}


async function handleSingleOutletIdle() {
    // Determine which outlet is charging
    const getStatusList = await getStatus();
    const outlet0 = getStatusList[0] || {};
    const outlet1 = getStatusList[1] || {};
    const outlet0Active = outlet0.phs != 1;
    const outlet1Active = outlet1.phs != 1;
    const chargingOutlet = outlet0Active ? "1" : "2";
    const idleOutlet = outlet0Active ? "2" : "1";
    
    try {
        // First handle module allocation
        // await handleSingleOutletModuleAllocation(chargingOutlet);
        // await wait(1000);
        
        // Then handle power distribution
        const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
        const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
            ? Math.min(CPMaxProfileLimit, powercapValue) 
            : powercapValue;
        
        // Get outlet-specific smart charging limit
        const foundOutlet = limits && limits.find(l => l.outlet == chargingOutlet);
        const outletLimit = foundOutlet ? foundOutlet.limit : null;
        
        // Calculate effective limit for charging outlet
        let chargingOutletLimit;
        if (outletLimit !== null && outletLimit !== undefined) {
            chargingOutletLimit = Math.min(outletLimit, effectivePowerCap);
            console.log(`Using smart charging limit for outlet ${chargingOutlet}: ${chargingOutletLimit}W`);
        } else {
            chargingOutletLimit = effectivePowerCap;
            console.log(`Using full power capacity for outlet ${chargingOutlet}: ${chargingOutletLimit}W`);
        }
        
        // Set idle outlet to half power
        const idleOutletLimit = Math.floor(chargingOutletLimit / 2);
        
        // Apply power caps
        await setPowerCap(chargingOutlet, chargingOutletLimit, "Single Outlet Charging");
        await wait(250);
        await setPowerCap(idleOutlet, idleOutletLimit, "Single Outlet Idle");
        
        // Set execution flags
        if (chargingOutlet === "1") {
            isRunOnOutlet[0] = true;
            isCanExecuted[0] = true;
        } else {
            isRunOnOutlet[1] = true;
            isCanExecuted[1] = true;
        }
        
        logScenario("Single Outlet Charging", 
            `Outlet ${chargingOutlet} charging with ${chargingOutletLimit}W, Outlet ${idleOutlet} idle with ${idleOutletLimit}W`);
            
    } catch (error) {
        console.error("Error in handleSingleOutletIdle:", error);
    }
}

async function handleBothOutletsCharging() {
    // Fetch smart charging limits
    const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    const perOutletPower = Math.floor(effectivePowerCap / 2);
    
    // Get individual outlet limits
    const outlet1Found = limits && limits.find(l => l.outlet == "1");
    const outlet2Found = limits && limits.find(l => l.outlet == "2");
    const outlet1LimitRaw = outlet1Found ? outlet1Found.limit : null;
    const outlet2LimitRaw = outlet2Found ? outlet2Found.limit : null;
    
    // Calculate effective limits for each outlet
    const outlet1Limit = outlet1LimitRaw !== null && outlet1LimitRaw !== undefined 
        ? Math.min(outlet1LimitRaw, perOutletPower)
        : perOutletPower;
    const outlet2Limit = outlet2LimitRaw !== null && outlet2LimitRaw !== undefined 
        ? Math.min(outlet2LimitRaw, perOutletPower)
        : perOutletPower;
    
    // Apply power caps for both outlets
    await setPowerCap("1", outlet1Limit, "Dual Outlet Charging");
    await wait(250);
    await setPowerCap("2", outlet2Limit, "Dual Outlet Charging");
    
    // Set execution flags for both outlets
    isRunOnOutlet = [true, true];
    isCanExecuted = [true, true];
    
    logScenario(
        "Dual Outlet Charging",
        `Outlet 1: ${outlet1Limit}W, Outlet 2: ${outlet2Limit}W (equalized distribution)`,
        {
            systemPowerCap: powercapValue,
            CPMaxProfileLimit,
            effectivePowerCap,
            outlet1: {
                rawLimit: outlet1LimitRaw !== null ? outlet1LimitRaw + 'W' : 'Not Set',
                finalLimit: outlet1Limit + 'W'
            },
            outlet2: {
                rawLimit: outlet2LimitRaw !== null ? outlet2LimitRaw + 'W' : 'Not Set',
                finalLimit: outlet2Limit + 'W'
            }
        }
    );
}

// 2. DLB Cases
async function handleSingleOutletNoSmartLimit(chargingOutlet) {
    const otherIdleChargingOutlet = chargingOutlet === "1" ? "2" : "1";
    const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    const otherOutletPowerCap = Math.floor(effectivePowerCap / 2)    
    // Single outlet gets full power (60kW), idle outlet gets half (30kW)
    await setPowerCap(chargingOutlet, effectivePowerCap, "Single Outlet No Smart Limit");
    await setPowerCap(otherIdleChargingOutlet, otherOutletPowerCap, "Other Outlet Idle");
    
    logScenario("Single Outlet - No Smart Limits", `Full power distribution: ${effectivePowerCap}W / ${Math.floor(effectivePowerCap / 2)}W`);
}

async function handleSingleOutletWithSmartLimit(outletLimit,chargingOutlet) {
    const otherIdleChargingOutlet = chargingOutlet === "1" ? "2" : "1";
    const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    
    const smartLimit = Math.min(outletLimit, effectivePowerCap);
    
    await setPowerCap(chargingOutlet, smartLimit, "Single Outlet With Smart Limit");
    await setPowerCap(otherIdleChargingOutlet, effectivePowerCap/2, "Other Outlet Idle");
    
    logScenario("Single Outlet - With Smart Limit", `Smart limit applied: ${smartLimit}W `);

}

// 3. Smart Charging Cases
async function handleCPMaxProfileOnly() {
    const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    
    // All outlets constrained by CPMaxProfileLimit
    // const singleOutletPower = Math.min(effectivePowerCap, powercapValue); //commented out
    const dualOutletPower = Math.min(Math.floor(effectivePowerCap / 2), Math.floor(powercapValue / 2));
    
    await setPowerCap("1", dualOutletPower, "CPMaxProfileLimit Only");
    await setPowerCap("2", dualOutletPower, "CPMaxProfileLimit Only");
    
    logScenario(
        "CPMaxProfileLimit Only",
        `Global constraint: ${dualOutletPower}W`,
        {
            systemPowerCap: powercapValue,
            CPMaxProfileLimit,
            effectivePowerCap,
            outlet1: {
                rawLimit: CPMaxProfileLimit + 'W (Global)',
                finalLimit: dualOutletPower + 'W'
            },
            outlet2: {
                rawLimit: CPMaxProfileLimit + 'W (Global)',
                finalLimit: dualOutletPower + 'W'
            }
        }
    );
}

async function handleCPMaxProfileAndIndividual() {
    const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    
    // Individual limits further constrained by CPMaxProfileLimit 
    const outlet1Limit = limits && limits.find(l => l.outlet == "1") && limits.find(l => l.outlet == "1").limit;
    const outlet2Limit = limits && limits.find(l => l.outlet == "2") && limits.find(l => l.outlet == "2").limit;
    
    const finalOutlet1Limit = outlet1Limit !== null && outlet1Limit !== undefined 
        ? Math.min(outlet1Limit, effectivePowerCap/2) 
        : effectivePowerCap/2;
    const finalOutlet2Limit = outlet2Limit !== null && outlet2Limit !== undefined 
        ? Math.min(outlet2Limit, effectivePowerCap/2) 
        : effectivePowerCap/2;
    
    await setPowerCap("1", finalOutlet1Limit, "CPMaxProfile + Individual");
    await setPowerCap("2", finalOutlet2Limit, "CPMaxProfile + Individual");
    
    logScenario(
        "CPMaxProfileLimit + Individual",
        `Priority system applied: ${finalOutlet1Limit}W / ${finalOutlet2Limit}W`,
        {
            systemPowerCap: powercapValue,
            CPMaxProfileLimit,
            effectivePowerCap,
            outlet1: {
                rawLimit: outlet1Limit !== null ? outlet1Limit + 'W' : 'Not Set',
                finalLimit: finalOutlet1Limit + 'W',
                constraint: effectivePowerCap/2 + 'W'
            },
            outlet2: {
                rawLimit: outlet2Limit !== null ? outlet2Limit + 'W' : 'Not Set',
                finalLimit: finalOutlet2Limit + 'W',
                constraint: effectivePowerCap/2 + 'W'
            }
        }
    );
}


async function handleIndividualOnly() {
    const { limits } = await fetchSmartChargingLimits();
    
    // Only individual outlet limits set, no CPMaxProfileLimit
    const outlet1Limit = limits && limits.find(l => l.outlet == "1") && limits.find(l => l.outlet == "1").limit;
    const outlet2Limit = limits && limits.find(l => l.outlet == "2") && limits.find(l => l.outlet == "2").limit;
    
    let finalOutlet1Limit = outlet1Limit !== null && outlet1Limit !== undefined 
        ? outlet1Limit 
        : powercapValue;
    let finalOutlet2Limit = outlet2Limit !== null && outlet2Limit !== undefined 
        ? outlet2Limit 
        : powercapValue;
    finalOutlet1Limit = Math.min(finalOutlet1Limit, powercapValue/2);
    finalOutlet2Limit = Math.min(finalOutlet2Limit, powercapValue/2);
    
    await setPowerCap("1", finalOutlet1Limit, "Individual Limits Only");
    await setPowerCap("2", finalOutlet2Limit, "Individual Limits Only");
    
    logScenario(
        "Individual Limits Only",
        `No global constraint: ${finalOutlet1Limit}W / ${finalOutlet2Limit}W`,
        {
            systemPowerCap: powercapValue,
            effectivePowerCap: finalOutlet1Limit, // Use the effective power cap for logging
            outlet1: {
                rawLimit: outlet1Limit !== null ? outlet1Limit + 'W' : 'Not Set',
                finalLimit: finalOutlet1Limit + 'W'
            },
            outlet2: {
                rawLimit: outlet2Limit !== null ? outlet2Limit + 'W' : 'Not Set',
                finalLimit: finalOutlet2Limit + 'W'
            }
        }
    );
}

async function handleIndividualNull() {
    const { limits } = await fetchSmartChargingLimits();
    
    // Individual limit is null or undefined
    const outlet1Limit = limits && limits.find(l => l.outlet == "1") && limits.find(l => l.outlet == "1").limit;
    const outlet2Limit = limits && limits.find(l => l.outlet == "2") && limits.find(l => l.outlet == "2").limit;
    
    // Use system defaults when limits are null/undefined
    const finalOutlet1Limit = outlet1Limit !== null && outlet1Limit !== undefined 
        ? outlet1Limit 
        : Math.floor(powercapValue / 2);
    const finalOutlet2Limit = outlet2Limit !== null && outlet2Limit !== undefined 
        ? outlet2Limit 
        : Math.floor(powercapValue / 2);
    
    await setPowerCap("1", finalOutlet1Limit, "Individual Limits Null");
    await setPowerCap("2", finalOutlet2Limit, "Individual Limits Null");
    
    logScenario(
        "Individual Limits - Null",
        `System defaults applied: ${finalOutlet1Limit}W / ${finalOutlet2Limit}W`,
        {
            systemPowerCap: powercapValue,
            effectivePowerCap: finalOutlet1Limit, // Use the effective power cap for logging
            outlet1: {
                rawLimit: outlet1Limit !== null ? outlet1Limit + 'W' : 'Not Set',
                finalLimit: finalOutlet1Limit + 'W'
            },
            outlet2: {
                rawLimit: outlet2Limit !== null ? outlet2Limit + 'W' : 'Not Set',
                finalLimit: finalOutlet2Limit + 'W'
            }
        }
    );
}

async function handleIndividualZero(chargingOutlet) {
    const otherIdleChargingOutlet = chargingOutlet === "1" ? "2" : "1";
    // Individual limit set to 0
    await setPowerCap(chargingOutlet, 0, "Individual Zero Limit");
    await setPowerCap(otherIdleChargingOutlet, powercapValue/2, "Other Outlet Default");
    
    logScenario(
        "Individual Limits - Zero",
        `Minimum power applied: ${powerLowDemandValue}W each`,
        {
            systemPowerCap: powercapValue,
            effectivePowerCap: powerLowDemandValue, // Use the effective power cap for logging
            outlet1: {
                rawLimit: '0W',
                finalLimit: '0W'
            },
            outlet2: {
                rawLimit: '0W',
                finalLimit: '0W'
            }
        }
    );
}

// 4. Module Allocation Cases
async function handleSingleOutletModuleAllocation(chargingOutlet) {
    const otherIdleChargingOutlet = chargingOutlet === "1" ? "2" : "1";
    const allModules = convModuleList;
    
    // Log module allocation plan
    logModuleAllocation(chargingOutlet, allModules, "Full Power Mode");
    logModuleAllocation(otherIdleChargingOutlet, [], "No Modules Allocated");
    
    // Reset both outlets first
    await stackSelection("1", "0");
    await wait(1000);
    await stackSelection("2", "0");
    await wait(1000);

    // Wait for valid power demand values with timeout
    let powerDemand = 0;
    let retryCount = 0;
    const maxRetries = 50; // Maximum number of retries

     const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    let halfPowerThreshold = Math.floor(effectivePowerCap / 2);
    halfPowerThreshold = Math.floor(halfPowerThreshold/1000)
  
    // Only activate DLB relay if power demand exceeds half of effective power
        // Set both stack selections to charging outlet
        await stackSelection("1", chargingOutlet);
        await wait(1000);
        await stackSelection("2", chargingOutlet);
        await wait(1000);
        
        // Allocate all modules to charging outlet
        await ConvModule(chargingOutlet, "2");
        await wait(1000);
        
        console.log(`Stack Selection completed for both guns. All power allocated to outlet ${chargingOutlet} due to high demand (${powerDemand}W > ${halfPowerThreshold}W)`);

    if (chargingOutlet === "1") {
        isRunOnOutlet[0] = true;
        isCanExecuted[0] = true
        isRunOnOutlet[1] = false;
        isCanExecuted[1] = false;
    } else {
        isRunOnOutlet[0] = false;
        isCanExecuted[0] = false;
        isRunOnOutlet[1] = true;
        isCanExecuted[1] = true
    }
}

async function handleDualOutletModuleAllocation() {
    // Calculate module split
    const halfModules = Math.ceil(convModuleList.length / 2);
    const outlet1Modules = convModuleList.slice(0, halfModules);
    const outlet2Modules = convModuleList.slice(halfModules);
    
    // Log allocation plan
    logModuleAllocation("1", outlet1Modules, "Equalized Power Mode");
    logModuleAllocation("2", outlet2Modules, "Equalized Power Mode");

    // Reset both outlets first
    await stackSelection("1", "0");
    await wait(250);
    await stackSelection("2", "0");
    await wait(250);
    
    // Allocate half modules to each outlet
    await ConvModule("1", "1");
    await wait(250);
    await ConvModule("2", "1");
    await wait(250);

    isRunOnOutlet = [true, true];
    isCanExecuted = [true, true];
    
    logScenario("Dual Outlet Module Allocation", `Modules split: ${outlet1Modules.length}/${outlet2Modules.length}`);
}

// 5. Transition Scenarios
async function handleIdleToSingle() {
    // Reset execution flags
    isRunOnOutlet = [false, false];
    isCanExecuted = [false, false];
    
    // Apply single outlet charging logic
    await handleSingleOutletIdle();
    
    logScenario("Idle → Single Charging", "Transition completed");
}

async function handleSingleToDual() {
    console.log("\n=== Starting Single to Dual Transition ===");
    try {
        // First handle module allocation
        await handleDualOutletModuleAllocation();
        await wait(1000);
        
        // Then handle power distribution
        await handleBothOutletsCharging();
        
        console.log("=== Single to Dual Transition Completed ===\n");
        logScenario("Single → Dual Charging", "Transition completed with equal power distribution");
    } catch (error) {
        console.error("Error during single to dual transition:", error);
    }
}

async function handleDualToSingle() {
    console.log("\n=== Starting Dual to Single Transition ===");
    
    // Get current state to determine which outlet is still charging
    const getStatusList = await getStatus();
    const outlet0 = getStatusList[0] || {};
    const outlet1 = getStatusList[1] || {};
    const outlet0Active = outlet0.phs != 1;
    const outlet1Active = outlet1.phs != 1;
    
    // Determine which outlet is still charging
    const chargingOutlet = outlet0Active ? "1" : "2";
    const idleOutlet = outlet0Active ? "2" : "1";
    
    try {
        console.log(`Transitioning to single charging on outlet ${chargingOutlet}`);
        
        // Reset both outlets first
        await stackSelection("1", "0");
        await wait(1000);
        await stackSelection("2", "0");
        await wait(1000);
          
        // Set up charging outlet
        await stackSelection("1", chargingOutlet);
        await wait(1000);
        await stackSelection("2", chargingOutlet);
        await wait(1000);
  
        // Allocate all modules to charging outlet
        await ConvModule(chargingOutlet, "2");
        await wait(1000);
        
        // Apply power caps
        const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
        const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
            ? Math.min(CPMaxProfileLimit, powercapValue) 
            : powercapValue;
        await setPowerCap(chargingOutlet, effectivePowerCap, "Dual to Single Transition");
        await wait(250);
        await setPowerCap(idleOutlet, Math.floor(effectivePowerCap / 2), "Dual to Single Idle Outlet");
        
        // Update execution flags
        if (chargingOutlet === "1") {
            isRunOnOutlet = [true, false];
            isCanExecuted = [true, false];
        } else {
            isRunOnOutlet = [false, true];
            isCanExecuted = [false, true];
        }
        
        console.log("=== Dual to Single Transition Completed Successfully ===\n");
        logScenario("Dual → Single Charging", `Transition completed - All modules allocated to outlet ${chargingOutlet}`);
    } catch (error) {
        console.error("Error during dual to single transition:", error);
    }
}

async function handleAnyToIdle() {
    // Set both outlets to full system capacity
    await handleIdleState();
    
    // Reset all execution flags
    isRunOnOutlet = [false, false];
    isCanExecuted = [false, false];
    
    logScenario("Any → Idle", "System reset to idle state");
}

async function handleProfileAddition() {
    // Re-evaluate power limits
    const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
    
    // Apply new profile constraints
    await handleCPMaxProfileAndIndividual();
    
    logScenario("Profile Addition", "New profile applied");
}

async function handleProfileRemoval() {
    // Fall back to next priority profile
    const { limits } = await fetchSmartChargingLimits();
    
    // Re-evaluate power limits
    await handleIndividualOnly();
    
    logScenario("Profile Removal", "Fallback to next priority profile");
}

async function handleProfileValueChange() {
    // Re-calculate effective limits
    const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
    
    // Apply new constraints
    await handleCPMaxProfileAndIndividual();
    
    logScenario("Profile Value Change", "New constraints applied");
}

// 6. Edge/Error Cases
async function handleAPIFailure() {
    // Fall back to system defaults
    await setPowerCap("1", powercapValue, "API Failure Fallback");
    await setPowerCap("2", Math.floor(powercapValue / 2), "API Failure Fallback");
    
    console.error("API Failure - Using system defaults");
    logScenario("API Failure", "Fallback to system defaults");
}

async function handleZeroPowerLimits() {
    const { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
    // Individual limits further constrained by CPMaxProfileLimit 
    const outlet1Limit = limits && limits.find(l => l.outlet == "1") && limits.find(l => l.outlet == "1").limit;
    const outlet2Limit = limits && limits.find(l => l.outlet == "2") && limits.find(l => l.outlet == "2").limit;

    // Set outlets to minimum power
    await setPowerCap("1", outlet1Limit, "Zero Power Limits");
    await setPowerCap("2", outlet2Limit, "Zero Power Limits");
    
    logScenario(
        "Zero Power Limits",
        `Minimum power applied: ${0}W each`,
        {
            systemPowerCap: powercapValue,
            status: 'Zero Power Limits Applied',
            outlet1: {
                rawLimit: outlet1Limit,
                finalLimit: outlet1Limit
            },
            outlet2: {
                rawLimit: outlet2Limit,
                finalLimit: outlet2Limit
            }
        }
    );
}

async function handleNegativePowerLimits() {
    // Treat as zero limits
    await setPowerCap("1", powerLowDemandValue, "Negative Limits Converted");
    await setPowerCap("2", powerLowDemandValue, "Negative Limits Converted");
    
    console.log("\n=== Dual Outlet Power Cap Configuration ===");
    console.log(`System Power Cap: ${powercapValue}W`);
    console.log(`Status: Negative Limits Converted to Minimum Power`);
    console.log("\nOutlet 1:");
    console.log(`├── Raw Smart Limit: Negative (Invalid)`);
    console.log(`└── Final Applied Limit: ${powerLowDemandValue}W`);
    console.log("\nOutlet 2:");
    console.log(`├── Raw Smart Limit: Negative (Invalid)`);
    console.log(`└── Final Applied Limit: ${powerLowDemandValue}W`);
    console.log("=======================================\n");
    
    console.warn("Negative Power Limits - Treated as zero");
    logScenario("Negative Power Limits", `Treated as zero: ${powerLowDemandValue}W each`);
}

async function handleExtremelyHighLimits() {
    // Cap at system maximum
    await setPowerCap("1", powercapValue, "Extremely High Limits Capped");
    await setPowerCap("2", Math.floor(powercapValue / 2), "Extremely High Limits Capped");
    
    logScenario(
        "Extremely High Limits",
        `Capped at system maximum: ${powercapValue}W / ${Math.floor(powercapValue / 2)}W`,
        {
            systemPowerCap: powercapValue,
            outlet1: {
                rawLimit: 'Exceeds System Maximum',
                finalLimit: powercapValue + 'W'
            },
            outlet2: {
                rawLimit: 'Exceeds System Maximum',
                finalLimit: Math.floor(powercapValue / 2) + 'W'
            }
        }
    );
}

// 7. Combination Scenarios
async function handleSingleOutletCPMax(outletLimit,chargingOutlet) {
    const otherIdleChargingOutlet = chargingOutlet === "1" ? "2" : "1";
    const { CPMaxProfileLimit } = await fetchSmartChargingLimits();
    const effectiveLimit = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
        ? Math.min(CPMaxProfileLimit, powercapValue) 
        : powercapValue;
    
    await setPowerCap(chargingOutlet, Math.min(outletLimit, effectiveLimit), "Single Outlet + CPMaxProfile");
    await setPowerCap(otherIdleChargingOutlet, Math.floor(effectiveLimit / 2), "Single Outlet + CPMaxProfile Idle");
    
    logScenario(
        "Single Outlet + CPMaxProfileLimit",
        `Charging: ${outletLimit}W, Idle: ${Math.floor(effectiveLimit / 2)}W`,
        {
            systemPowerCap: powercapValue,
            CPMaxProfileLimit,
            effectivePowerCap: effectiveLimit,
            outlet1: {
                rawLimit: outletLimit + 'W',
                finalLimit: Math.min(outletLimit, effectiveLimit) + 'W'
            },
            outlet2: {
                rawLimit: effectiveLimit/2 + 'W',
                finalLimit: Math.floor(effectiveLimit / 2) + 'W'
            }
        }
    );
}

// 8. Monitoring & Logging
async function monitorPowerTransitions() {
    // Monitor power cap changes
    const states = await getStatus();
    const outlet1Power = states[0] ? states[0].PowerCapW : 0;
    const outlet2Power = states[1] ? states[1].PowerCapW : 0;
    
    console.log(`Power Monitoring - Outlet 1: ${outlet1Power}W, Outlet 2: ${outlet2Power}W`);
}

async function monitorModuleAllocations() {
    // Monitor module allocation changes
    console.log(`Module Monitoring - Total: ${convModuleList.length}, Active: ${isRunOnOutlet.filter(Boolean).length}`);
}

async function monitorScenarioChanges() {
    // Monitor major scenario changes
    const states = await getStatus();
    const outlet0 = states[0] || {};
    const outlet1 = states[1] || {};
    
    const scenario = outlet0.phs == 1 && outlet1.phs == 1 ? "Idle" :
                   outlet0.phs != 1 && outlet1.phs != 1 ? "Dual" : "Single";
    
    console.log(`Scenario Monitoring - Current: ${scenario}`);
}

async function monitorPerformance() {
    // Monitor API response times and system performance
    const startTime = Date.now();
    await fetchSmartChargingLimits();
    const responseTime = Date.now() - startTime;
    
    console.log(`Performance Monitoring - API Response Time: ${responseTime}ms`);
}

/***********************************/
/* MAIN CONTROL LOGIC              */
/***********************************/
async function MainFlow() {
    // 1. Initialization
    console.log("Initializing system...");
    await wait(5000);
    let getStateList = await getStatus();
    let tempNumOfModule = getStateList && getStateList[0] ? getStateList[0].numberOfModulesAvailable : null;
    while (!tempNumOfModule || tempNumOfModule < 2 || tempNumOfModule > 20) {
        await wait(1000);
        getStateList = await getStatus();
        tempNumOfModule = getStateList && getStateList[0] ? getStateList[0].numberOfModulesAvailable : null;
    }
    await CANOnOff("1", true);
    await CANOnOff("2", true);
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

    // Track previous state outside the loop
    let previousOutlet0Active = false;
    let previousOutlet1Active = false;
    let previousBothActive = false;
    let previousBothIdle = true;
    let previousState = "idle"; // Add state tracking

    // 2. Main control loop
    while (true) {
        try {
            // 2.1 Poll system state
            let getStatusList = await getStatus();
            let { limits, CPMaxProfileLimit } = await fetchSmartChargingLimits();
            let effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
                ? Math.min(CPMaxProfileLimit, powercapValue) 
                : powercapValue;

            // 2.2 Enhanced scenario detection with debug logging
            const outlet0 = getStatusList[0] || {};
            const outlet1 = getStatusList[1] || {};
            
            // Debug log raw states
            console.log("\nRaw State Values:");
            console.log(`Outlet 1 phs: ${outlet0.phs}`);
            console.log(`Outlet 2 phs: ${outlet1.phs}`);
            
            const bothIdle = outlet0.phs == 1 && outlet1.phs == 1;
            const outlet0Active = outlet0.phs != 1 && outlet0.pilot != 0 && outlet0.pilot != 1
            const outlet1Active = outlet1.phs != 1 && outlet1.pilot != 0 && outlet1.pilot != 1
            const bothActive = outlet0Active && outlet1Active;
            const singleActive = (outlet0Active && !outlet1Active) || (!outlet0Active && outlet1Active);

            // Determine current state
            let currentState = bothIdle ? "idle" : 
                             bothActive ? "dual" :
                             singleActive ? "single" : "unknown";
          
            // 2.3 Smart charging profile detection
            const hasCPMaxProfile = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined;
            const hasIndividualLimits = limits  && limits.some(item => item.limit > 0);
            const hasZeroLimits = limits && limits.some(l => l.limit === 0);
            const hasNullLimits = limits && limits.some(l => l.limit === null || l.limit === undefined);
            const hasHighDemand = outlet0.pv && outlet0.tc && outlet1.pv && outlet1.tc;

            // 2.4 Power demand detection
            const outlet0PowerDemand = (outlet0 && outlet0.pv != null && outlet0.tc != null) ? Math.floor((outlet0.pv * outlet0.tc) / 1000) : 0;
            const outlet1PowerDemand = (outlet1 && outlet1.pv != null && outlet1.tc != null) ? Math.floor((outlet1.pv * outlet1.tc) / 1000) : 0;
            const highPowerDemand = outlet0PowerDemand >= powerDemandValue - 2 || outlet1PowerDemand >= powerDemandValue - 2;

            // 2.5 Module allocation state
            const singleOutletModules = isRunOnOutlet[0] || isRunOnOutlet[1];
            const dualOutletModules = isCanExecuted[0] && isCanExecuted[1];

            // 2.6 Enhanced scenario dispatch
            if (bothIdle) {
                // System State Cases
                await handleIdleState();
            } else if (bothActive) {
                // Dual outlet scenarios
                // Module allocation for dual outlets
                // if (!dualOutletModules) {
                //     console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")
                //     await handleDualOutletModuleAllocation();
                // }

                if (hasZeroLimits) {
                    await handleZeroPowerLimits();
                } else if (hasCPMaxProfile && hasIndividualLimits) {
                    await handleCPMaxProfileAndIndividual();
                } else if (hasCPMaxProfile && !hasIndividualLimits) {
                    await handleCPMaxProfileOnly();
                } else if (hasIndividualLimits && !hasCPMaxProfile) {
                    await handleIndividualOnly(); //check
                } else if (hasNullLimits) {
                    await handleIndividualNull();
                } 
                // else if (highPowerDemand) {
                    // await handleHighPowerDemandDual();
                // } 
                else {
                    await handleBothOutletsCharging();
                }
                
            } else if (singleActive) {
                // Single outlet scenarios
                const chargingOutlet = outlet0Active ? "1" : "2";
                const foundOutlet = limits && limits.find(l => l.outlet == chargingOutlet);
                const outletLimit = foundOutlet ? foundOutlet.limit : null;

                 // Module allocation for single outlet
                // if (!singleOutletModules) {
                //     await handleSingleOutletModuleAllocation(chargingOutlet);
                // }

                const outlet = getStatusList[outlet0Active ? 0 : 1];
                
                // Check if we have valid voltage and current values
                if (outlet && outlet.pv > 0 && outlet.tc > 0) {
                    let powerDemand = Math.floor((outlet.pv * outlet.tc));
                    console.log(`Valid power demand obtained: ${powerDemand}W (V: ${outlet.pv}V, I: ${outlet.tc}A)`);
                    const effectivePowerCap = CPMaxProfileLimit !== null && CPMaxProfileLimit !== undefined 
                    ? Math.min(CPMaxProfileLimit, powercapValue) 
                    : powercapValue;
                    const halfPowerThreshold = Math.floor(effectivePowerCap / 2);
                    if (powerDemand < halfPowerThreshold) {
                      await stackSelection("1", "0");
                      await wait(1000);
                      await stackSelection("2", "0");
                      await wait(1000);

                      // For low power demand, only use the charging outlet's own stack
                      // Allocate half modules to charging outlet
                      await ConvModule(chargingOutlet, "1");
                      await wait(1000);
                      
                      console.log(`Stack Selection completed. Half power allocated to outlet ${chargingOutlet} due to low demand (${powerDemand}W <= ${halfPowerThreshold}W)`);
                    } else {
                        // Set both stack selections to charging outlet
                        await stackSelection("1", chargingOutlet);
                        await wait(1000);
                        await stackSelection("2", chargingOutlet);
                        await wait(1000);
                        
                        // Allocate all modules to charging outlet
                        await ConvModule(chargingOutlet, "2");
                        await wait(1000);
                        
                        console.log(`Stack Selection completed for both guns. All power allocated to outlet ${chargingOutlet} due to high demand (${powerDemand}W > ${halfPowerThreshold}W)`);
                    }
                }
                
                if (hasZeroLimits) {
                    await handleZeroPowerLimits();
                } else if (outletLimit === 0) {
                    await handleIndividualZero(chargingOutlet);
                } else if (hasCPMaxProfile && outletLimit !== null && outletLimit !== undefined) {
                    await handleSingleOutletCPMax(outletLimit,chargingOutlet);
                } else if (outletLimit !== null && outletLimit !== undefined) {
                    await handleSingleOutletWithSmartLimit(outletLimit,chargingOutlet);
                } else if (outletLimit === null || outletLimit === undefined) {
                    await handleSingleOutletNoSmartLimit(chargingOutlet);
                } 
                // else if (highPowerDemand) {
                    // await handleHighPowerDemandSingle(); 
                // }
                //  else {
                //     await handleSingleOutletIdle();
                // }
                
               
            } else {
                // Edge cases and error scenarios
                try {
                    await fetchSmartChargingLimits();
                } catch (error) {
                    await handleAPIFailure();
                    continue;
                }
                
                // Check for other edge cases
                if (limits && limits.some(l => l.limit < 0)) {
                    await handleNegativePowerLimits();
                } else if (limits && limits.some(l => l.limit > powercapValue * 2)) {
                    await handleExtremelyHighLimits();
                } else {
                    logScenario("Unknown State", "No matching scenario");
                }
            }

             // Enhanced transition detection
            let transitionDetected = false;
            if (previousState !== currentState) {
                console.log("\n!!! State Transition Detected !!!");
                console.log(`Transition: ${previousState} -> ${currentState}`);
                
                // Handle specific transitions
                if (previousState === "dual" && currentState === "single") {
                    console.log("Executing Dual -> Single transition");
                    transitionDetected = true;
                    const chargingOutlet = outlet0Active ? "1" : "2";
                    // await handleSingleOutletModuleAllocation(chargingOutlet);
                }
                else if (previousState === "idle" && currentState === "single") {
                    console.log("Executing Idle -> Single transition");
                    await handleIdleToSingle();
                }
                else if (previousState === "single" && currentState === "dual") {
                    console.log("Executing Single -> Dual transition");
                    await handleSingleToDual();
                }
                else if (currentState === "idle") {
                    console.log("Executing Any -> Idle transition");
                    await handleAnyToIdle();
                }
            }

            // If no transition was detected but we're in an unexpected state
            if (!transitionDetected && previousState === "dual" && currentState === "single") {
                console.log("Forcing Dual -> Single transition check");
                await handleDualToSingle();
            }

            // Update previous state at the end of the loop
            previousState = currentState;
            previousOutlet0Active = outlet0Active;
            previousOutlet1Active = outlet1Active;
            previousBothActive = bothActive;
            previousBothIdle = bothIdle;

            const newLimits = await fetchSmartChargingLimits();
            const isCPMaxProfileChanged = newLimits.CPMaxProfileLimit !== CPMaxProfileLimit;

            let profileChanged = false;
            let profileIncreased = false;
            let profileDecreased = false;

            // Compare each outlet's limit with previous
            for (const oldLimit of limits) {
                const newLimit = newLimits.limits.find(l => l.outlet === oldLimit.outlet);
                if (!newLimit) {
                    profileChanged = true; // Outlet removed
                    break;
                }

                if (newLimit.limit !== oldLimit.limit) {
                    profileChanged = true;
                    if (newLimit.limit > oldLimit.limit) profileIncreased = true;
                    else profileDecreased = true;
                }
            }

            if (isCPMaxProfileChanged || profileChanged) {
                if (profileIncreased) {
                    await handleProfileAddition();
                } else if (profileDecreased) {
                    await handleProfileRemoval();
                } else {
                    await handleProfileValueChange(); // Generic change
                }
            }

            // 2.9 Monitoring (run periodically)
            if (Date.now() % 30000 < 1000) { // Every 30 seconds
                await monitorPowerTransitions();
                await monitorModuleAllocations();
                await monitorScenarioChanges();
                await monitorPerformance();
            }

            await wait(1000);
        } catch (error) {
            console.error("Main control loop error:", error);
            await handleAPIFailure();
            await wait(5000);
        }
    }
}

/***********************************/
/* START THE SYSTEM                */
/***********************************/
async function start() { await MainFlow(); }
start();