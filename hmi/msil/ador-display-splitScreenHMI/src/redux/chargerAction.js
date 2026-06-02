// chargerActions.js (or same file if you prefer)
import { setChargerState } from "./chargingSlice"; // adjust import path
import {
  getFaultedOutlets,
  getBlockedOutlets,
  getActiveOutlets,
  getAvailableOutlets,
  getHackedFaultedOutlets,
  getFaultedOutletsTime,
  getInoperativeOutlets,
} from "../Utilis/ChargerStateHelper";

import {
  getState,
  getAllOutletsAsOutOfOrder,
  getReservedOutlets,
  getStoppingOutlets,
  getPreparingOutletsIds,
  getCleanedPreventAutoRouteOutlets,
  getFirstOutletIdToAllowAutoRoute,
} from "../Utilis/UtilityFunction";
import { timeout, checkErrors, deAuthorize } from "../Utilis/UtilityFunction";

const authTimestamps = {}; // track when auth became true per outlet for deauth timeout
const sessionInProcess = {}; // track if a session was in process (phs > 2) per outlet

export const fetchChargerState = () => async (dispatch, getStateFn) => {
  const { charging } = getStateFn();
  const {
    config,
    setShouldGoHomeOnSessionStart,
    ocppOnline,
    chargingMode,
    errTogglingTimeout,
    eStopRoutingHandled,
    powerFailureRoutingHandled,
    preventAutoRouteOutlets,
  } = charging;

  const isComboMode = config?.comboMode;
  const API = config?.API;
  // const pathname = window.location.pathname;

  // if (pathname === "/reboot") return;

  const parsedState = await timeout(5000, getState(API));
  let chargerState = parsedState || [];

  if (!Array.isArray(chargerState)) {
    chargerState = [chargerState];
  }

  chargerState = chargerState.map((outletState, index) => ({
    ...outletState,
    index,
  }));

  // const errorObj = {}
  const errorObj = checkErrors(chargerState, chargingMode, isComboMode);
  const { showAlert, showEStop, errorCode } = errorObj || {};

  let updatedEStopRoutingHandled = eStopRoutingHandled;
  let updatedPowerFailureRoutingHandled = powerFailureRoutingHandled;

  if (showEStop && !updatedEStopRoutingHandled) {
    // window.history.pushState({}, "", "/");
    updatedEStopRoutingHandled = true;
  }

  if (!showEStop && updatedEStopRoutingHandled) {
    updatedEStopRoutingHandled = false;
  }

  if (errorCode === "powerloss" && !updatedPowerFailureRoutingHandled) {
    // window.history.pushState({}, "", "/");
    updatedPowerFailureRoutingHandled = true;
  }

  if (errorCode !== "powerloss" && updatedPowerFailureRoutingHandled) {
    updatedPowerFailureRoutingHandled = false;
  }

  if (["powerloss", "emergency"].includes(errorCode)) {
    chargerState = getAllOutletsAsOutOfOrder(chargerState);
  }

  const selectedState = chargerState.find(
    (eachState) => eachState?.outlet === localStorage.getItem("selectedOutlet")
  );

  const chargingModeValue = isComboMode ? chargingMode : 0;

  const blockedOutlets = getBlockedOutlets(chargerState, chargingModeValue);
  const realFaultedOutlets = getFaultedOutlets(
    chargerState,
    blockedOutlets,
    errTogglingTimeout
  );
  const faultedOutletsTime = getFaultedOutletsTime(
    realFaultedOutlets,
    charging.faultedOutletsTime
  );
  const faultedOutlets = getHackedFaultedOutlets(
    realFaultedOutlets,
    faultedOutletsTime
  );
  const availableOutlets = getAvailableOutlets(
    chargerState,
    faultedOutlets,
    blockedOutlets
  );
  const activeOutlets = getActiveOutlets(chargerState);
  const reservedOutlets = await getReservedOutlets(API);
  const stoppingOutlets = getStoppingOutlets(chargerState);
  const cleanedPreventAutoRouteOutlets = getCleanedPreventAutoRouteOutlets(
    stoppingOutlets,
    preventAutoRouteOutlets
  );
  const firstOutletIdToAllowAutoRoute = getFirstOutletIdToAllowAutoRoute(
    chargerState,
    cleanedPreventAutoRouteOutlets,
    stoppingOutlets
  );
  const preparingOutletsIds = getPreparingOutletsIds(chargerState);
  const inoperativeOutlets = getInoperativeOutlets(chargerState);

  const isSupplyVoltage =
    chargerState[0]?.errorObj?.overVoltageErr ||
    chargerState[0]?.errorObj?.underVoltageErr;
  const isPowerModuleFailure = chargerState[0]?.errorObj?.powerModuleFailureErr;

  dispatch(
    setChargerState({
      chargerState,
      selectedState,
      chargingMode: chargingModeValue,
      blockedOutlets,
      faultedOutlets,
      faultedOutletsTime,
      availableOutlets,
      activeOutlets,
      reservedOutlets,
      stoppingOutlets,
      preventAutoRouteOutlets: cleanedPreventAutoRouteOutlets,
      firstOutletIdToAllowAutoRoute,
      preparingOutletsIds,
      inoperativeOutlets,
      showAlert,
      showEStop,
      errorCode,
      errorObj,
      eStopRoutingHandled: updatedEStopRoutingHandled,
      powerFailureRoutingHandled: updatedPowerFailureRoutingHandled,
      errorEventObj:
        isSupplyVoltage || isPowerModuleFailure ? charging.errorEventObj : {},
      outletToShowOnEStopRelease: showEStop ? activeOutlets[0] : null,
      isChargeCableConnected: !!chargerState.length,
      shouldDisplay: 1,
    })
  );

  const connectionTimeOut = charging.config?.standard?.ConnectionTimeOut || 60;
  const timeoutMs = connectionTimeOut * 1000;

  chargerState.forEach((outlet) => {
    const outletId = outlet?.outlet;

    // Mark session as in-process once phs goes above 2 (active charging started)
    if (outlet?.phs > 2) {
      sessionInProcess[outletId] = true;
    }

    // If a session was in process and gun is now disconnected, deauth immediately
    if (sessionInProcess[outletId] && outlet?.pilot === 0) {
      if (outlet?.auth) {
        console.log(`[DeAuth] Outlet ${outletId} - session ended, pilot=0, sending deauth`);
        deAuthorize(API, outlet);
      }
      sessionInProcess[outletId] = false;
      delete authTimestamps[outletId];
      return;
    }

    // Connection timeout deauth: authorized but no session started within timeout
    const isAvailableWithAuth = outlet?.auth && !outlet?.sessionPending && outlet?.pilot === 0;

    if (isAvailableWithAuth) {
      if (!authTimestamps[outletId]) {
        authTimestamps[outletId] = Date.now();
      } else if (Date.now() - authTimestamps[outletId] >= timeoutMs) {
        if (outlet?.auth) {
          console.log(`[DeAuth] Outlet ${outletId} - auth timeout reached, sending deauth`);
          deAuthorize(API, outlet);
        }
        delete authTimestamps[outletId];
      }
    } else {
      delete authTimestamps[outletId];
    }
  });
};
