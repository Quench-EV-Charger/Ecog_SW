/* eslint eqeqeq: "off"*/
import { isCharging, clearRfid, stopCharging } from "../utils";

export const handleOutletSelect = (outletState, setSelectedState) => {
  localStorage.setItem("user", outletState?.user);
  localStorage.setItem("selectedOutlet", outletState?.outlet);
  setSelectedState(outletState);
};

export const handleRfidFlow = async (event, state, path) => {
  if (!event || !event.data || typeof event.data !== "string") return; // skip for null rfid

  if (
    (!state?.preparingOutletsIds || state?.preparingOutletsIds.length === 0) &&
    path === "/"
  ) {
    clearRfid(state?.config?.API);
  }

  if (
    path === "/" ||
    path === "/stopcharging" ||
    path === "/unplugev" ||
    path === "/charging" ||
    path === "/screensaver" ||
    path === "/session-result" ||
    path === "/stopping"
  ) {
    const rfidUserStates = state.chargerState.filter(
      (outletState) => outletState.user === event?.data
    );
    for await (const rfidUserState of rfidUserStates) {
      if (isCharging(rfidUserState)) {
        await stopCharging(
          state.config?.API,
          rfidUserState.user,
          rfidUserState.outlet
        );
      }
    }
  }
};
