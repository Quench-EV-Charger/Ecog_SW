import { availableButtonShadow } from "../../constants/constants";

export const ScreensaverPage = {
  minHeight: "85vh",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#373744",
};

export const ImageRow = {
  height: "60vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const Image = {
  height: "100%",
};

export const TextRow = {
  height: "10vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const Text = {
  color: "#FFFFFF",
  fontSize: "2.344vw",
};

export const ButtonRow = {
  height: "15vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const Button = {
  height: "6.25vw",
  width: "12.5vw",
  fontSize: "2.188vw",
  boxShadow: availableButtonShadow,
};
