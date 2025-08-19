// These errors can come from safety_tripped_io_src field of the state OR
// it can also be handled locally in UI, for example communication_error
export const Errors = {
  powerloss: "POWER_FAILURE", // from safety_tripped_io_src
  door_open: "CHARGER_DOOR_OPEN", // from safety_tripped_io_src
  outlet_temp: "OUTLET_TEMP", // from safety_tripped_io_src // TODO: Do we still need this?
  cab_temp: "CAB_TEMP", // from safety_tripped_io_src
  communication_error: "COMMUNICATION_ERROR", // handled internally
  gun1_imd_fault: "IMD Resistance Fault",
  gun2_imd_fault: "IMD Resistance Fault",
};

export const OneShotErrors = {
  73: {
    code: "73",
    localizationCode: "ERR_DC_FUSE",
  },
  74: {
    code: "74",
    localizationCode: "BMS_COMMUNICATION_TIMEOUT",
  },
  12: {
    code: "12",
    localizationCode: "DC_CONTACTOR_FAIL",
  },
};

// If safety_tripped_io: true, we are going to alert screen normally
// However there are some errors that we shouldnt go to that screen
export const ExcludedErrors = [
  "dcbrk_not_open",
  "dcbrk_not_closed",
];
