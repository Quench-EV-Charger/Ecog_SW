import { availableButtonShadow } from "../../constants/constants";

export const SessionResultPage = {
  minHeight: "85vh",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
};

export const InternalFaultTextContainer = {
  height: "10vh",
};

export const InternalFaultText = {
  fontWeight: "bold",
  color: "red",
  fontSize: "2.969vw",
  textAlign: "center",
};

export const ThankYouTextContainer = {
  height: "10vh",
};

export const ThankYouText = {
  fontWeight: "bold",
  color: "#373744",
  fontSize: "2.969vw",
  textAlign: "center",
};

export const IconContainer = {
  height: "20vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
};

export const Icon = {
  fontSize: "18vh",
  color: "#92D050",
};

export const ContentCol = {
  height: "100%",
  display: "flex",
  alignItems: "center",
};

export const ButtonContainer = {
  height: "20vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const Button = {
  width: "19.063vw",
  fontFamily: "Inter",
  fontSize: "1.875vw",
  fontWeight: "bold",
  height: "4.375vw",
  borderRadius: "2.188vw",
  background: "rgb(230, 37, 24)",
  color: "#ffffff",
  boxShadow: availableButtonShadow,
  transform: "translateY(-5vw)",
};
