export const CheckPointRow = {
  display: "flex",
};

export const CheckPointIcon = (iconColor) => {
  return {
    color: iconColor,
    fontSize: "4.219vw",
  };
};

export const CheckPointText = (isCHADEMO) => {
  return {
    width: isCHADEMO ? "54.688vw" : "46.875vw",
    fontSize: "4.75vh",
    background: "#c9deff",
    color: "#0070C0",
    borderRadius: "1.563vw",
    padding: "0.586vw",
    marginLeft: "0.781vw",
  };
};
