/***********************************/
/*  Company: ADOR Digatron Ltd.
    Author: Jay Patil, Harsh Tawade
    Purpose: Stop time for errors/alerts
    Created: 18-06-2024
    Contact: quenchdev4@adordigatron.com / quenchdev5@adordigatron.com 
    Revision version - 1.1
    Revision Date: 23-10-24
    ChangeLogs: Restructured to use mapped values for DB search.
/***********************************/

// Globals:
const url = "localhost:3001";
//const url = "10.20.27.50:3001";
const errorStartTimes = {}; // Track start times for multiple errors

const vendorErrorMapping = {
  "powerLossErr": "19", // PowerFailure
  "eStopErr": "17", // EmergencyPressed
  "doorOpenErr": "18", // DoorOpen
  "outletTemperatureErr": "6", // ModuleOutletTempHigh
  "cabinetTemperatureErr": "5", // CabinetTempHigh
  "overVoltageErr": "21", // InputOverVoltage
  "underVoltageErr": "26", // InputUnderVoltage
  "powerModuleFailureErr": "14", // PowerModuleFailure
  "gunTemperatureErr_1": "27", // CableHighTemperature
  "gunTemperatureErr_2": "27", // CableHighTemperature
  "powerModuleCommErr_1": "15", // PowerModuleCommError
  "powerModuleCommErr_2": "15", // PowerModuleCommError
  "groundFault": "30" // GroundFault
};


// Fetch charger status
async function getStatus() {
  try {
    const response = await fetch(`http://${url}/state`, {
      method: "GET",
      redirect: "follow",
    });
    return await response.json();
  } catch (e) {
    console.log("Exception while getting state:", e);
  }
}

// Fetch the custom DB for the last error entry
async function getCustomDB(errorKey) {
  try {
    const requestOptions = {
      method: "GET",
      headers: { "db-identifer": "alerts" },
      redirect: "follow"
    };

    const response = await fetch(`http://${url}/db/items`, requestOptions);
    const data = await response.json();

    // Reverse the data to start from the latest entries
    let reversedData = data.reverse();

    // Map errorKey to the specific vendorErrorCode
    const vendorErrorCode = vendorErrorMapping[errorKey];

    // Find the most recent entry for connector ID 1 without faultDuration
    let specificErrorEntry = reversedData.find(entry => 
      entry.vendorErrorCode === vendorErrorCode && 
      entry.connectorId === 1 &&
      !entry.hasOwnProperty('faultDuration') // Check if faultDuration is not present
    );

    // If no entry was found for connector ID 1, check for specific cases with connector ID 2 without faultDuration
    if (!specificErrorEntry) {
      specificErrorEntry = reversedData.find(entry => 
        entry.vendorErrorCode === vendorErrorCode &&
        entry.connectorId === 2 &&
        !entry.hasOwnProperty('faultDuration')
      );
    }

    // If a specific error entry is found, return it
    if (specificErrorEntry) {
      return specificErrorEntry;
    } else {
      console.log(`No previous entry found for vendorErrorCode ${vendorErrorCode} without faultDuration`);
      return null;
    }
  } catch (e) {
    console.log("Exception while getting custom DB for vendorErrorCode:", e);
    return null;
  }
}

// Post the recovered error and its duration to the API
async function postCustomDB(originalData, duration) {
  try {
    const dataWithFaultDuration = JSON.stringify({
      ...originalData,
      faultDuration: duration
    });
    console.log(dataWithFaultDuration);
    const requestOptions = {
      method: "POST",
      headers: { "db-identifer": "alerts", "Content-Type": "application/json" },
      redirect: "follow",
      body: dataWithFaultDuration
    };

    const response = await fetch(`http://${url}/db/items`, requestOptions);
    const data = await response.json();
    console.log(`Posted to DB:`, data);
    return data;
  } catch (e) {
    console.log("Exception while posting error duration:", e);
  }
}

// Main logic to track errors and recoveries
async function main() {
  try {
    let chargerStatus = await getStatus();

    if (chargerStatus) {
      if (!Array.isArray(chargerStatus)) chargerStatus = [chargerStatus];

      const errorObj = chargerStatus[0]["errorObj"];

      if (errorObj) {
        for (let errorKey in errorObj) {
          if (errorObj[errorKey] && !errorStartTimes[errorKey]) {
            // Start tracking a new error
            errorStartTimes[errorKey] = Date.now();
            console.log(`Monitoring ${errorKey} at ${new Date(errorStartTimes[errorKey]).toISOString()}`);
          } else if (!errorObj[errorKey] && errorStartTimes[errorKey]) {
            // Error resolved, calculate duration
            const duration = (Date.now() - errorStartTimes[errorKey]) / 1000;
            console.log(`Fault duration for ${errorKey}: ${duration} seconds`);

            // Get the original data for this error using vendorErrorCode
            const originalData = await getCustomDB(errorKey);
            if (originalData) {
              await postCustomDB(originalData, duration);
            }

            // Clear the start time
            delete errorStartTimes[errorKey];
          }
        }
        console.log(`Active error start times:`, errorStartTimes);
      }
    }
  } catch (e) {
    console.log("Exception in main:", e);
  }
}


// Initialize and start the script
const start = async () => {
  try {
    console.log("ErrorStopTime script started");
    setInterval(async () => {
      await main();
    }, 1000);
  } catch (err) {
    console.error('Error initializing ErrorStopTime main()', err);
  }
};

start();
