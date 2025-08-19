import { availableButtonShadow } from "../../constants/constants";

import { isHandshaking } from "../../utils";

export const ButtonContainer = {
  width: "23.5vw",
  height: "5.5vw",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: "110",
};

export const Button = (eachItem, isDisabled) => ({
  display: "block",
  width: "19.5vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: "1.85vw",
  height: "4.05vw",
  opacity: isHandshaking(eachItem) ? "0.5" : "1",
  backgroundColor: "#E62518",
  boxShadow: !isDisabled(eachItem) && availableButtonShadow,
});

export const Button2 = (eachItem, isDisabled) => ({
  display: "block",
  width: "19.5vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: "1.85vw",
  height: "4.05vw",
  opacity: isDisabled(eachItem) ? "0.5" : "1",
  backgroundColor: "rgb(230, 37, 24)",
  boxShadow: !isDisabled(eachItem) && availableButtonShadow,
  marginLeft:"26vw"
});

export const TariffContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginRight:"3vw"
};

export const TariffBox = {
  border: "0.3vw solid rgba(137, 141, 141, 0.7)",
  borderRadius: "3.65vw",
  width: "16.5vw",
  textAlign: "center",
  height: "25vw",
};

export const TariffBoxContent = {
  marginTop: "1.85vw",
  height: "14vw",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
};

export const OutletTypeText = {
  fontWeight: "600",
  fontSize: "2.65vw",
  lineHeight: "3.2vw",
};

export const GunIdContainer = {
  border: "0.3125vw solid  #E62518",
  boxShadow: "0.0785vw 0.313vw 0.939vw rgba(0, 0, 0, 0.08)",
  borderRadius: "50%",
  height: "6.85vw",
  marginLeft: "auto",
  marginRight: "auto",
  width: "6.85vw",
  marginTop: "-2.6vw",
  color: "#E62518",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "2.5vw",
  fontWeight: "bold",
};

export const StatusText = {
  fontWeight: "600",
  fontSize: "2.65vw",
  lineHeight: "3.2vw",
  textAlign: "center",
  padding: "1.55vw 0",
};
export const PowerCap = {
  fontWeight: "600",
  fontSize: "2.65vw",
  lineHeight: "3.2vw",
  textAlign: "center",
};

export const SessionsFooterContainer = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

export const RetrieveSessionButton = (retrieveDisabled) => ({
  opacity: retrieveDisabled ? "0.5" : "1",
  display: "block",
  width: "19.5vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: "1.85vw",
  height: "4.05vw",
  backgroundColor: "#E62518",
  boxShadow: "rgba(0,0,0,85) 0.313vw 0.313vw 0 0",
});

export const ToStopText = {
  fontWeight: "600",
  fontSize: "2.25vw",
  lineHeight: "3.2vw",
  textAlign: "center",
  margin: "0",
  color: "rgba(0, 0, 0, 0.65)",
};

export const SFSelectedOnText = {
  fontWeight: "600",
  fontSize: "2.25vw",
  lineHeight: "3.2vw",
  textAlign: "center",
  margin: "0",
  color: "rgba(0, 0, 0, 0.65)",
};

export const RfidDisconnectedText = {
  fontWeight: "600",
  fontSize: "2.25vw",
  lineHeight: "3.2vw",
  textAlign: "center",
  margin: "0",
  color: "rgb(230, 37, 24)",
};

export const FooterTextsContainer = {
  height: "6.25vw",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};
