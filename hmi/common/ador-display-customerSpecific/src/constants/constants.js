const OutletType = {
  CCS: "CCS",
  CHAdeMO: "CHAdeMO",
  AC: "AC",
};

const GunLetters = {
  0: "A",
  1: "B",
  2: "C",
  3: "D",
  4: "E",
  5: "F",
};

const ChargingModes = { SVCCU: "Single_VCCU", DVCCU: "Dual_VCCU", R: "Regular" };

const RfidSuffix = {
  0: ChargingModes.R,
  1: ChargingModes.DVCCU,
  2: ChargingModes.SVCCU,
};

const COLOR_PALETTE = ["#FF3E54", "#45E8A3", "#1CACE4", "#FDB523", "#CD866F"];
const availableButtonShadow = "rgba(0,0,0,85) 0.313vw 0.313vw 0 0";
const max32BitInt = 2147483647; // If the value of setInterval is greater than this value, js treats it as 0. I would like to prevent this condition

export {
  COLOR_PALETTE,
  availableButtonShadow,
  OutletType,
  GunLetters,
  ChargingModes,
  RfidSuffix,
  max32BitInt,
};
