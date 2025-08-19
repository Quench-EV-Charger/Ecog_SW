/* eslint eqeqeq: "off"*/
import { isActive, isFaulted, secondsDifference } from "../utils";

/************************* GET BLOCKED OUTLETS FROM CHARGER STATE *************************/
export const getBlockedOutlets = (chargerState, chargingMode) => {
  let blockedOutlets = [];
  if (chargingMode > 1) {
    blockedOutlets = chargerState.filter(state => state?.outlet != chargingMode); // prettier-ignore
    blockedOutlets = blockedOutlets.map((state) => state.outlet);
  }
  return blockedOutlets;
};

/************************* GET FAULTED OUTLETS FROM CHARGER STATE *************************/
export const getFaultedOutlets = (
  chargerState,
  blockedOutlets,
  errTogglingTimeout
) => {
  let faultedOutlets = chargerState.filter((state) => {
    let isConvTimeout = false;
    if(state?.modbus_selec_online){
      if (state?.phs > 2){
          isConvTimeout = state?.can1_RX_time?.conv_timeout;
        }
        else{
          isConvTimeout = false;
        }
      }
      else{
        isConvTimeout = state?.can1_RX_time?.conv_timeout;
      }
      
    return (
      (isFaulted(state) && !blockedOutlets?.includes(state?.outlet)) ||
      (isConvTimeout && !errTogglingTimeout)
    );
  });
  faultedOutlets = faultedOutlets.map((state) => state.outlet);
  return faultedOutlets;
};

export const getFaultedOutletsTime = (faultedOutlets, faultedOutletsTime) => {
  const updatedFaultedOutletsTime = { ...faultedOutletsTime };
  faultedOutlets &&
    Array.isArray(faultedOutlets) &&
    faultedOutlets.forEach((faultedOutlet) => {
      if (
        !faultedOutletsTime[faultedOutlet] &&
        !faultedOutletsTime?.hasOwnProperty(faultedOutlet)
      ) {
        updatedFaultedOutletsTime[faultedOutlet] = Date.now();
      }
    });
  Array.isArray(Object.keys(updatedFaultedOutletsTime)) &&
    Object.keys(updatedFaultedOutletsTime).forEach(
      (updatedFaultedOutletTime) => {
        if (!faultedOutlets?.includes(updatedFaultedOutletTime)) {
          delete updatedFaultedOutletsTime[updatedFaultedOutletTime];
        }
      }
    );
  return updatedFaultedOutletsTime;
};

export const getHackedFaultedOutlets = (faultedOutlets, faultedOutletsTime) => {
  const hackedFaultedOutlets = [];
  Array.isArray(faultedOutlets) &&
    faultedOutlets.forEach((faultedOutlet) => {
      if (
        faultedOutletsTime[faultedOutlet] &&
        secondsDifference(faultedOutletsTime[faultedOutlet], Date.now()) >= 3
      ) {
        hackedFaultedOutlets.push(faultedOutlet);
      }
    });
  return hackedFaultedOutlets;
};

/************************* GET ACTIVE OUTLETS FROM CHARGER STATE *************************/
export const getActiveOutlets = (chargerState) => {
  let activeOutlets = chargerState.filter((outletState) => {
    return isActive(outletState);
  });
  activeOutlets = activeOutlets.map((outletState) => outletState.outlet);
  return activeOutlets;
};

/************************* GET AVAILABLE OUTLETS FROM CHARGER STATE *************************/
export const getAvailableOutlets = (
  chargerState,
  faultedOutlets,
  blockedOutlets
) => {
  let availableOutlets = chargerState.filter((eachOutlet) => {
    return (
      faultedOutlets.indexOf(eachOutlet?.outlet) === -1 &&
      blockedOutlets.indexOf(eachOutlet?.outlet) === -1 &&
      !isActive(eachOutlet)
    );
  });
  availableOutlets = availableOutlets.map((outletState) => outletState?.outlet);
  return availableOutlets;
};

/************************* GET INOPERATIVE OUTLETS FROM CHARGER STATE *************************/
export const getInoperativeOutlets = (chargerState) => {
  let inoperativeOutlets = [];
  if (chargerState) {
    inoperativeOutlets = chargerState.filter(state => state?.out_of_order == true); 
    inoperativeOutlets = inoperativeOutlets.map((state) => state.outlet);
  }
  return inoperativeOutlets;
};
