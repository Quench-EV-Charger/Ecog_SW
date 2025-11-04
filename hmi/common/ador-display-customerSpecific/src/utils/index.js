/* eslint eqeqeq: "off"*/
import { OutletType } from "../constants/constants";
import { httpGet } from "../apis/Queries";
import { Errors } from "../constants/Errors";
import moment from 'moment-timezone';

export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const timeout = (ms, promise) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

export const msToReadableTime = (time) => {
  if (!time) return "0 min";

  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;

  let hours = Math.floor((time / hour) % 24);
  let minutes = Math.floor((time / minute) % 60);
  // let seconds = Math.floor(time / second % 60);

  return `${hours ? hours + "hrs" : ""} ${minutes} min`;
};

export const secondsToHms = (s) => {
  s = +s;

  let hours = Math.floor(s / 3600);
  let minutes = Math.floor((s % 3600) / 60);
  let seconds = Math.floor((s % 3600) % 60);

  if (hours && hours < 10) hours = `0${hours}`;
  if (minutes && minutes < 10) minutes = `0${minutes}`;
  if (hours && minutes === 0) minutes = `00`;
  if (seconds && seconds < 10) seconds = `0${seconds}`;
  if (minutes && seconds === 0) seconds = `00`;

  let result;
  if (hours) result = `${hours}:${minutes} h`;
  else if (minutes) result = `${minutes}:${seconds} min`;
  else result = `${seconds} sec`;

  return result;
};

export const timestampToTime = (timestamp, toTimezone) => {
  // console.log("Input:", timestamp, toTimezone);
  // Create the Moment.js object with the timestamp (assumed to be in UTC) and convert to the target timezone
  const date = moment(timestamp).tz(toTimezone);
  // Log the date object to check its validity
  if (!moment.isMoment(date) || !date.isValid()){
    return 'Invalid Date';
  }
  const hours = date.format('HH');
  const minutes = date.format('mm');
  const seconds = date.format('ss');
  const formattedTime = `${hours}:${minutes}:${seconds}`;
  return formattedTime;
};

export const elapsedTime = (startTimestamp, endTimeStamp) => {
  // elapsed time between 2 timestamps, or between start and now
  const startDate = new Date(startTimestamp);
  const endDate = endTimeStamp ? new Date(endTimeStamp) : new Date();
  const diff = endDate.getTime() - startDate.getTime(); // ms
  const diffSeconds = diff / 1000;
  let hours = String(Math.floor(diffSeconds / 3600));
  let minutes = String(Math.floor((diffSeconds % 3600) / 60));
  let seconds = String(Math.floor((diffSeconds % 3600) % 60));
  if (hours.length < 2) hours = `0${hours}`;
  if (minutes.length < 2) minutes = `0${minutes}`;
  if (seconds.length < 2) seconds = `0${seconds}`;
  return `${hours}:${minutes}:${seconds}`;
};

export const currentDate = () => {
  let today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = today.getFullYear();

  today = dd + "/" + mm + "/" + yyyy;
  return today;
};

export const currentTime = () => {
  const currentDate = new Date();
  let hours = currentDate.getHours();
  let minutes = currentDate.getMinutes();

  if (hours < 10) hours = `0${hours}`;
  if (minutes < 10) minutes = `0${minutes}`;

  return hours + ":" + minutes;
};

export const isTimestampValid = (timestamp) => {
  return new Date(timestamp).getTime() > 0;
};

export const secondsDifference = (timestamp1, timestamp2) => {
  if (!isTimestampValid(timestamp1) || !isTimestampValid(timestamp2)) {
    console.log("secondsDifference - timestamp is not valid");
    return 0;
  }
  const difference = timestamp2 - timestamp1;
  const secondsDifference = Math.floor(difference / 1000);
  return secondsDifference;
};

export const isNeedUnplug = (outletState) => {
  if (!outletState) return false;

  return (
    (outletState.needsUnplug && !outletState.sessionPending) ||
    (outletState.pilot === 2 && outletState.phs === 7 && outletState.auth && !outletState.sessionPending)
  );
};

export const getCorrectOutletType = (outletType) => {
  if (!outletType) return "";

  if (outletType.toLowerCase() === "chademo") {
    return OutletType.CHAdeMO;
  }
  return outletType;
};

export const inStoppingProccess = (chargerState) => {
  if (!chargerState || !chargerState.pilot) return false;

  const { pilot, phs, stopCharging, phsStop, stop, auth, outletType } =
    chargerState;
  let inStoppingProccess = false;
  if (outletType === "AC") {
    inStoppingProccess = phs < 7 && !auth && pilot > 1;
  } else {
    inStoppingProccess =
      pilot !== 1 &&
      phs !== 1 &&
      (stopCharging || phsStop === 2 || stop || phs === 8);
  }
  return inStoppingProccess && !isFaulted(chargerState);
};

export const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const isActive = (state) => {
  return state?.pilot >= 3 && state?.pilot <= 4 && state?.phs >= 3;
};

export const isCharging = (state) => {
  if (!state || !state.pilot) return false;

  const { pilot, phs } = state;
  return pilot >= 3 && pilot <= 4 && phs > 6;
};

export const isEveryCharging = (chargerState) => {
  return chargerState.every((outletState) => {
    return (
      outletState?.pilot >= 3 &&
      outletState?.pilot <= 4 &&
      outletState?.phs >= 3
    );
  });
};

export const isSomeActive = (chargerState) => {
  return chargerState.some((outletState) => {
    return (
      outletState.pilot >= 3 && outletState.pilot <= 4 && outletState.phs >= 3
    );
  });
};

export const isHandshaking = (state) => {
  if (!state || !state.pilot) return false;

  const { pilot, phs, needsUnplug ,sessionPending} = state;
  return pilot > 0 && pilot !== 7 && phs >= 3 && phs < 7 && !needsUnplug && !sessionPending;
};

export const isFaulted = (state) => {
  const { SLAC, out_of_order, evsestat, online, pilot } = state || {};
  if (
    SLAC?.init &&
    pilot === 7 &&
    !out_of_order &&
    evsestat !== 6 &&
    evsestat !== 5 &&
    online
  ) {
    return false;
  } else if (
    out_of_order ||
    evsestat === 6 ||
    evsestat === 5 ||
    !online ||
    (pilot === 7 && !SLAC?.init)
  ) {
    return true;
  } else {
    return false;
  }
};

export const getAllOutletsAsOutOfOrder = (chargerState) => {
  return chargerState.map((outletState) => ({
    ...outletState,
    out_of_order: true,
  }));
};

export const getState = async (API) => {
  const endpoint = `${API}/state`;
  return fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log("Getting /state failed!!");
    });
};

export const stopCharging = async (API, user, outlet) => {
  try {
    const endpoint = `${API}/outlets/${outlet}/stop`;
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ user, adminCommand: true , stopReason:"App"}),
    };
    const response = await fetch(endpoint, requestOptions);
    await unplug(API, outlet);
    return await response.json();
  } catch (error) {
    console.log(`Stop charging failed for outlet ${outlet}!!`);
  }
};

export const buildConfig = async () => {
  let config = await httpGet("/config.json", "getting config failed");
  const API = `http://${window.location.host}`;
  const socketUrl = `ws://${window.location.host}`;
  if (!config.API) config = { ...config, API };
  if (!config.socketUrl) config = { ...config, socketUrl };
  return config;
};

export const getControllers = async (API) => {
  if (!API) {
    console.log("API does not exist for getControllers function!");
    return;
  }

  try {
    const controllersEndpoint = `${API}/controllers`;
    return await (await fetch(controllersEndpoint)).json();
  } catch (error) {
    console.log("Getting /controllers failed!!");
  }
};

/************************* GET THE OUTLET WHICH IS JUST AUTHENTICATED *************************/
export const getTheOneAuthenticated = (prevChargerState, chargerState) => {
  prevChargerState = prevChargerState || [];
  chargerState = chargerState || [];
  const prevAuths = prevChargerState.map((state) => state?.auth);
  const auths = chargerState.map((state) => state?.auth);
  const isSame = prevAuths.every((auth, idx) => auth === auths[idx]);
  if (isSame) return;
  let authenticatedIdx = null;
  prevAuths.forEach((prevAuth, idx) => {
    if (prevAuth !== auths[idx] && !prevAuth && auths[idx]) {
      authenticatedIdx = idx;
    }
  });
  if (authenticatedIdx || authenticatedIdx === 0)
    return chargerState[authenticatedIdx];
};

export const getallCapsIdTag = async (API) => {
  if (!API) return false; 
  
  const endpoint = `${API}/ocpp-client/config`;
  const errorLog = "getting /ocpp-client/config failed";

  try {
    let config = await httpGet(endpoint, errorLog);
    if (config?.allCapsIdTag)
      return true
    else
      return false;
  }catch (error) {
    console.error("Error fetching allCapsIdTags:", error);
    return false;
  }
}


// Helper function to extract reservations from API response
const extractReservations = (apiResponse) => {
  if (!apiResponse) return [];

  // Case 1: Array of proper reservation objects → return as-is
  if (Array.isArray(apiResponse)) {
    const looksLikeReservationObj = (o) =>
      o && typeof o === "object" && (("connectorId" in o) || ("expiryDate" in o) || ("reservationId" in o));

    if (apiResponse.every(looksLikeReservationObj)) {
      return apiResponse;
    }

    // Case 2: Array containing a single object map → use its values
    if (apiResponse.length === 1 && typeof apiResponse[0] === "object") {
      return Object.values(apiResponse[0]);
    }

    // Fallback: keep only objects
    return apiResponse.filter((o) => o && typeof o === "object");
  }

  // Case 3: Single object map → use its values
  if (typeof apiResponse === "object") {
    return Object.values(apiResponse);
  }

  return [];
};


// Helper function to check if a reservation is valid
const isReservationValid = (reservation, currentTimestamp) => {
  if (!reservation) return false;

  let { startDate, expiryDate } = reservation;

  // 🧠 If startDate missing → assume now
  if (!startDate) {
    startDate = new Date(currentTimestamp).toISOString();
  }

  // ❗ If expiryDate missing → skip (not valid)
  if (!expiryDate) {
    console.warn("Reservation missing expiryDate:", reservation);
    return false;
  }

  try {
    const startTime = new Date(startDate).getTime();
    const expiryTime = new Date(expiryDate).getTime();

    // Handle invalid dates
    if (isNaN(startTime) || isNaN(expiryTime)) {
      console.warn("Invalid date format in reservation:", reservation);
      return false;
    }

    // ✅ Valid if current time is before expiry
    return currentTimestamp < expiryTime;
  } catch (error) {
    console.error("Error processing reservation dates:", reservation, error);
    return false;
  }
};

// Helper function to map reservations to connector IDs
const mapToConnectorIds = (reservations) => {
  return reservations
    .map((reservation) => {
      if (!reservation) return "";

      const { connectorId } = reservation;
      if (connectorId === undefined || connectorId === null) {
        console.warn("Missing connectorId in reservation:", reservation);
        return "";
      }

      return String(connectorId);
    })
    .filter(Boolean); // Filter out empty strings
};

// Main function to get reserved outlets
export const getReservedOutlets = async (API) => {
  if (!API) {
    console.error("API endpoint not provided");
    return [];
  }

  const endpoint = `${API}/services/ocpp/reservations`;
  const errorLog = "getting /services/ocpp/reservations failed";

  try {
    // Fetch the API response
    const apiResponse = await httpGet(endpoint, errorLog);

    // Step 1: Extract reservations
    const reservations = extractReservations(apiResponse);

    // Step 2: Filter valid reservations
    const currentTimestamp = Date.now();
    const validReservations = reservations.filter((reservation) =>
      isReservationValid(reservation, currentTimestamp)
    );

    // Step 3: Map to connector IDs
    const connectorIds = mapToConnectorIds(validReservations);

    return connectorIds;
  } catch (error) {
    console.error("Error fetching reserved outlets:", error);
    return [];
  }
};

export const reservationHour = async (API, outletId) => {
  if (!API || !outletId) {
    console.error("Invalid API or outletId");
    return null;
  }

  const endpoint = `${API}/services/ocpp/reservations`;
  const errorLog = "getting /services/ocpp/reservations failed";

  try {
    const apiResponse = await httpGet(endpoint, errorLog);
    let reservations;

    if (Array.isArray(apiResponse)) {
      // New correct format
      reservations = apiResponse;
    } else if (apiResponse && typeof apiResponse === "object") {
      // Some backends send an object of reservations
      reservations = Object.values(apiResponse);
    } else {
      console.error("Unexpected API response format:", apiResponse);
      return null;
    }


    // Find the reservation for the given outletId
    const reservation = reservations.find(
      (res) => res.connectorId === parseInt(outletId, 10)
    );

    if (!reservation) {
      return null;
    }

    const { startDate } = reservation;
    const currentTime = Date.now();
    const response = await fetch(`${API}/db/config`);
    const data = await response.json();

    // Set timeLimit based on reservationAlertLeadTime
    const timeLimit = data?.reservationAlertLeadTime ?? 60;
    const oneHourLater = currentTime + timeLimit * 60 * 1000; // 1 hour in milliseconds
    const startTime = new Date(startDate).getTime();

    if (startTime > currentTime && startTime <= oneHourLater) {
      const duration = Math.max(0, Math.floor((startTime - currentTime) / (60 * 1000))); // Duration in minutes

      return {
        message: `Due to upcoming reservation, you have only ${duration} minutes for charging. Your charging will be auto stopped at ${new Date(startTime).toLocaleTimeString()}.`,
        duration,
        stopTime: new Date(startTime).toISOString(),
      };
    } else {
      console.log(`No upcoming reservations within the next hour for outletId: ${outletId}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching reserved outlets:", error);
    return null;
  }
};

export const reservedDetails = async (API, outletId) => {
  if (!API || !outletId) {
    console.error("Invalid API or outletId");
    return null;
  }

  const endpoint = `${API}/services/ocpp/reservations`;

  try {
    const apiResponse = await httpGet(endpoint, "fetch reservations failed");
    let reservations = [];

    // ✅ Handle your exact format: array of reservation objects
    if (Array.isArray(apiResponse)) {
      reservations = apiResponse;
    }
    // handle rare case where backend sends object instead of array
    else if (apiResponse && typeof apiResponse === "object") {
      reservations = Object.values(apiResponse);
    } else {
      console.error("Unexpected API response format:", apiResponse);
      return null;
    }

    // Find reservation matching the outletId
    const reservation = reservations.find(
      (res) => res.connectorId === parseInt(outletId, 10)
    );
    if (!reservation) {
      console.log(`No reservation found for outletId ${outletId}`);
      return null;
    }

    // Extract fields from the response
    const { expiryDate, idTag } = reservation;
    const formattedTime = new Date(expiryDate).toLocaleTimeString();

    // Build result for the HMI
    return {
      message: `Reserved For: ${idTag} Ends at: ${formattedTime}`,
      vehicleId: idTag,
      expiryDate: formattedTime,
    };
  } catch (error) {
    console.error("Error fetching reserved outlets:", error);
    return null;
  }
};



export const deAuthorize = async (API, selectedState) => {
  try {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        auth: false,
        adminCommand: true,
        user: selectedState?.user,
      }),
    };

    let res = await fetch(
      `${API}/outlets/${selectedState?.outlet}/auth`,
      requestOptions
    );
    if (res.status === 200) {
      const resJSON = await res.json();
      console.log("DeAuth received", resJSON);
      return res;
    }
  } catch (error) {
    console.log("DeAuth Error", error);
  }
};

export const postRFID = async (API, rfid) => {
  if (!API) return;
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const options = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ idTag: rfid }),
  };
  try {
    const res = await fetch(`${API}/services/rfid/idtag`, options);
    console.log("RFID post: ", rfid);
    return res;
  } catch (error) {
    console.log("RFID post failed!!", error);
  }
};

export const clearRfid = async (API) => {
  if (!API) return;
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const options = { method: "POST", headers: myHeaders };
  try {
    const res = await fetch(`${API}/services/rfid/clear`, options);
    console.log("RFID clear");
    return res;
  } catch (error) {
    console.log("RFID clear failed!!", error);
  }
};

export const getStoppingOutlets = (chargerState) => {
  if (!chargerState || !Array.isArray(chargerState)) return [];

  return chargerState.filter((outletState) => inStoppingProccess(outletState));
};

export const getCleanedPreventAutoRouteOutlets = (
  stoppingOutlets,
  preventAutoRouteOutlets
) => {
  const stoppingOutletsIds = stoppingOutlets.map(
    (outletState) => outletState.outlet
  );
  const preventAutoRouteOutletsIds = preventAutoRouteOutlets.map(
    (outletState) => outletState.outlet
  );
  const dontPreventAnymore = preventAutoRouteOutletsIds.filter(
    (outlet) => !stoppingOutletsIds.includes(outlet)
  );
  return preventAutoRouteOutlets.filter(
    (outletState) => !dontPreventAnymore.includes(outletState.outlet)
  );
};

export const getFirstOutletIdToAllowAutoRoute = (
  chargerState,
  preventAutoRouteOutlets,
  stoppingOutlets
) => {
  const chargerStateIds = chargerState.map((outletState) => outletState.outlet);
  const preventAutoRouteOutletsIds = preventAutoRouteOutlets.map(
    (outletState) => outletState.outlet
  );
  const stoppingOutletsIds = stoppingOutlets.map(
    (outletState) => outletState.outlet
  );
  return chargerStateIds.find(
    (outletId) =>
      !preventAutoRouteOutletsIds.includes(outletId) &&
      stoppingOutletsIds.includes(outletId)
  );
};

export const isOutletPreparing = (outletState) => {
  return (
    outletState?.pilot >= 1 &&
    outletState?.pilot <= 2 &&
    !inStoppingProccess(outletState) &&
    !isNeedUnplug(outletState)
  );
};

export const getPreparingOutletsIds = (chargerState) => {
  if (!chargerState || !Array.isArray(chargerState)) return [];

  return chargerState
    .filter((outletState) => isOutletPreparing(outletState))
    .map((outletState) => outletState?.outlet);
};

export const unplug = async (API, outlet) => {
  const unplugEndpoint = `${API}/outlets/${outlet}/unplug`;
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const requestOptions = { method: "POST", headers: myHeaders };
  await fetch(unplugEndpoint, requestOptions);
};

export const isArrayOfStringsSame = (arr1, arr2) => {
  return (
    arr1.every((element) => arr2.includes(element)) &&
    arr2.every((element) => arr1.includes(element))
  );
};

export const findDifferentElementInArray = (arr1, arr2) => {
  const a = arr1.find((element) => !arr2.includes(element));
  if (a) return a;
  return arr2.find((element) => !arr1.includes(element));
};

// ErrorObj: Remapped safety_tripped_io and safety_tripped_io_src
export const isErrorStillValid = (
  chargerState,
  errorCode,
  errorEventObj,
  config
) => {
  const isErrorCodeFromSafetyTrippedIO =
    errorCode &&
    Object.keys(Errors) &&
    Array.isArray(Object.keys(Errors)) &&
    Object.keys(Errors).includes(errorCode);
  const outletState =
    chargerState && Array.isArray(chargerState) && chargerState[0];
  // errorCode is power_module_comm and still valid (different than io_src and events)
  if (errorCode === "power_module_comm") {
    if(outletState?.modbus_selec_online){
      if (outletState?.phs > 2){
        return outletState?.can1_RX_time?.conv_timeout;
      }
      else{
        return false;
      }
    }
    else{
      return outletState?.can1_RX_time?.conv_timeout;
    }   
  } else if (isErrorCodeFromSafetyTrippedIO) {
    return (
      outletState &&
      (
        outletState?.errorObj?.powerLossErr ||
        outletState?.errorObj?.doorOpenErr ||  
        outletState?.errorObj?.outletTemperatureErr ||
        outletState?.errorObj?.cabinetTemperatureErr ||
        outletState?.errorObj?.powerModuleCommErr_1 ||
        outletState?.errorObj?.powerModuleCommErr_2
      )
    );
  } else {
    // error is from the events
    const errorObjCode =
      errorEventObj && JSON.parse(errorEventObj?.data)?.payload?.code;

    const isSupplyVoltageErr= outletState?.errorObj?.overVoltageErr ||
      outletState?.errorObj?.underVoltageErr ||
      outletState?.errorObj?.powerLossErr; 
    return (
      isSupplyVoltageErr &&
      config?.errorCodes &&
      config?.errorCodes[errorObjCode] &&
      errorCode === config?.errorCodes[errorObjCode].localizationCode
    );
  }
};
