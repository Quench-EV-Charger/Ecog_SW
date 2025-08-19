import { availableButtonShadow } from "../../constants/constants";

export const ChargingPage = (background) => {
  return {
    backgroundSize: "cover",
    background: `url(/backgrounds/${background}) no-repeat center center fixed`,
    position: "absolute",
    height: "100vh",
    width: "100vw",
  };
};

export const Overlay = {
  margin: "3.5vw",
  padding: "2vw",
  background: "rgba(0,0,0,.8)",
  height: "70vh",
};

export const LeftCol = {
  height: "100%",
};

export const GunLetterContainer = {
  height: "15vh",
  display: "flex",
};

export const ChargingInSFText = {
  fontWeight: "600",
  fontSize: "2.25vw",
  lineHeight: "3.2vw",
  color: "white",
  display: "flex",
  alignItems: "center",
  margin: "0",
};

export const ProgressColContainer = {
  height: "35vh",
};

export const ProgressCol = {
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const ChargingText = {
  color: "#FFFFFF",
  textAlign: "center",
  zIndex: "99",
  transform: "translateY(-3vw)",
  fontSize: "2.344vw",
};

export const ButtonsContainer = {
  display: "flex",
  height: "10vh",
  justifyContent: "space-evenly",
  alignItems: "center",
};

export const StopButton = (cantStop) => {
  return {
    border: "0.156vw solid #E62518",
    borderRadius: "2.25vw",
    color: "#E62518",
    fontSize: "3vh",
    width: "31.25vh",
    height: "7vh",
    opacity: cantStop && 0.35,
    boxShadow: cantStop
      ? "0px 0.156vw 0.703vw rgba(0, 0, 0, 0.3)"
      : availableButtonShadow,
  };
};

export const HomeButton = {
  border: "0.156vw solid #35b880",
  borderRadius: "2.25vw",
  color: "#35b880",
  fontSize: "3vh",
  width: "31.25vh",
  height: "7vh",
  boxShadow: availableButtonShadow,
};

export const RightCol = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-around",
};

export const SessionInfoText = {
  fontSize: "2.5vh",
  margin: "0.5vh",
  paddingLeft: "1.25vh",
};

export const SessionInfoTextsContainer = {
  border: "1px solid white",
  width: "60vh",
  color: "#FFFFFF",
  borderRadius: "2.5vw",
  padding: "0.85vh",
  margin:"1vh"
};

export const FullHeight = {
  height: "100%",
};

export const ToStopText = {
  color: "#FFFFFF",
  textAlign: "center",
  zIndex: "99",
  fontSize: "2.15vw",
  transform: "translateY(2vw)",
};
