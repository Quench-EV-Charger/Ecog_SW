/***********************************/
/*  Company: QUENCH
    Author: QUENCH
    Purpose: Autocharge script to enable automatic charging of a car when plugged in. 
             Dynamically checks configuration keys to decide execution.
    Created: 08-06-2023
    Contact:  QUENCH
    Revision history: 15-04-2026
    Revision version - 3.1
    ChangeLogs: Added config key check 
/***********************************/

//Global declarations:
const url = "localhost";
const configEndpoint = `http://${url}:3001/ocpp-client/config`;
var executeOnce = [false, false];
let is30 = false;
let isDualVCCU = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch the configuration dynamically
async function fetchConfig() {
  try {
    console.log(`Fetching config from: ${configEndpoint}`);
    const response = await fetch(configEndpoint, { method: "GET" });
    console.log(`Response status: ${response.status}`);
    if (response.ok) {
      const config = await response.json();
      console.log("Configuration fetched successfully");
      console.log(`autoChargeMode: ${config.autoChargeMode}`);
      return config;
    } else {
      console.error(`Failed to fetch configuration - Status: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching configuration:", error.message);
    console.error("Check if endpoint is accessible and CORS is enabled");
    return null;
  }
}

async function checkOutofOrder(outlet, is30, chargeStatus) {
  if (is30) {
    return chargeStatus["out_of_order"];
  } else {
    return chargeStatus[outlet - 1]["out_of_order"];
  }
}

async function getEVCCID(outlet, is30, chargeStatus) {
  try {
    if (is30) {
      return "VID:" + chargeStatus["EVCCID"].toUpperCase();
    } else {
      return "VID:" + (outlet === 1 ? chargeStatus[0]["EVCCID"] : chargeStatus[1]["EVCCID"]).toUpperCase();
    }
  } catch (error) {
    console.error("Error fetching EVCC ID:", error);
    return null;
  }
}

async function Autocharge(outlet, is30, chargeStatus) {
  // Check for OutOfOrder
  if (await checkOutofOrder(outlet, is30, chargeStatus)) {
    console.log(`Outlet ${outlet} is out of order`);
    return;
  }

  console.log("Auth get called");
  const clearResponse = await fetch(`http://${url}:3001/services/rfid/clear`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  await wait(1000);

  const EVID = await getEVCCID(outlet, is30, chargeStatus);

  const idTagResponse = await fetch(
    `http://${url}:3001/services/rfid/v2/authDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idTAG: EVID,
        outletId: outlet,
      }),
    }
  );

  if (idTagResponse.ok) {
    console.log(`Autocharge request sent by EvID: ${EVID}, ${outlet}`);
  } else {
    console.log(`Couldn't send autocharge request for ${EVID}`);
  }
}

async function getStatus() {
  try {
    const response = await fetch(`http://${url}:3001/state`, {
      method: "GET",
      redirect: "follow",
    });
    return await response.json();
  } catch (error) {
    console.log("Exception while getting state:", error);
    return null;
  }
}

// Check if reset is ongoing
const checkResetInProgress = async () => {
  try {
    const response = await fetch(`http://${url}:3001/store/resetInProgress`, {
      method: "GET",
    });
    if (response.ok) {
      const data = await response.json();
      return data; // Returns true/false from server
    } else {
      console.warn(`Reset check returned status ${response.status}, assuming not in reset`);
      return false;
    }
  } catch (error) {
    console.warn("Could not check reset status - assuming not in reset");
    return false; // Assume not in reset if endpoint unavailable
  }
};

async function start() {
  try {
    // Fetch the configuration and decide whether to proceed
    const config = await fetchConfig();
    if (!config) {
      console.error("Cannot proceed: Configuration fetch failed. Check endpoint connectivity.");
      return;
    }
    if (config.autoChargeMode === false) {
      console.log("Autocharge disabled in configuration");
      return;
    }

    // Register event listener if available (HMI environment)
    if (typeof handleAppsEvent !== "undefined") {
      handleAppsEvent((eventData) => {
        try {
          let e = JSON.parse(eventData.message);
          if (e.type === "charging-mode" && e.payload.mode === "Dual_VCCU") {
            isDualVCCU = true;
          } else {
            isDualVCCU = false;
          }
          console.log(`Dual VCCU mode: ${isDualVCCU}`);
        } catch (err) {
          console.error("Error parsing event data:", err);
        }
      });
    } else {
      console.warn("handleAppsEvent not available - Dual VCCU mode monitoring disabled");
    }

    if (isDualVCCU) {
      console.log("Dual VCCU mode active, skipping Autocharge");
      return;
    }

    let chargeStatus = await getStatus();
    if (!chargeStatus) {
      console.log("Charge status unavailable");
      return;
    }

    is30 = typeof chargeStatus[1] === "undefined";

    const outlets = is30 ? [0] : [0, 1];
    for (let i of outlets) {
      const currentStatus = is30 ? chargeStatus : chargeStatus[i];
      if (currentStatus["phs"] === 2 && !executeOnce[i]) {
        const onReset = await checkResetInProgress();
        if (!onReset) {
          await Autocharge(i + 1, is30, chargeStatus);
          executeOnce[i] = true;
          console.log(`executeOnce[${i}] = true`);
        } else {
          console.log("Reset in progress, skipping Autocharge");
        }
      } else if (currentStatus["phs"] === 8 || currentStatus["curr_ses_active"] === false) {
        if (executeOnce[i]) {
          executeOnce[i] = false;
          console.log(`executeOnce[${i}] = false`);
        }
      }
    }
  } catch (error) {
    console.error("Error in start function:", error);
  }
}

(async () => {
  setInterval(() => {
    start();
  }, 5000);
})();
