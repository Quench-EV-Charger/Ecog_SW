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
import { timeout, checkErrors } from "../Utilis/UtilityFunction";

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
};
