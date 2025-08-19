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
export const ButtonContainer = {
  width: "23.5vw",
  height: "5.5vw",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: "110",
  border: "0.156vw solid #35b880",
  borderRadius: "2.25vw",
  color: "#35b880",
  fontSize: "3vh",
  boxShadow: availableButtonShadow,
};

export const Overlay = {
  margin: "3.906vw",
  padding: "2.344vw",
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
  border: "0.156vw solid #E62518",
  color: "#E62518",
  fontSize: "3vh",
  width: "100%",
  height: "7vh",
  borderColor: "#E62518",
  boxShadow: availableButtonShadow,
};

export const RightCol = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-around",
  fontSize:"2vw",
};

export const SessionInfoText = {
  fontSize: "2vh",
  margin: "0.8vh",
};

export const SessionInfoTextsContainer = {
  border: "1px solid white",
  width: "54.375vh",
  color: "#FFFFFF",
  borderRadius: "2.5vw",
  padding: "0.85vh",
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


export const ActiveTab = { 
  border: "0.156vw solid #E62518",
  fontSize: "3vh",
  width: "100%",
  height: "7vh",
  boxShadow: availableButtonShadow,
  borderColor: "#E62518",
  color: "#FFFFFF",
  fontWeight: "bold",  
  backgroundColor: "#E62518",
};

export const ModeSelector = (isSelected, isDisabled) => ({
  //If active:
  border: "0.156vw solid #E62518",
  width: "100%",
  borderColor: "#E62518",
  fontWeight: "bold",  
  //if passive: homebutton
  fontSize: "2.5vh",
  height: "7vh",
  marginBottom:"5vh",
//General
  color: isSelected ? "#FFFFFF" : "#E62518",
  opacity: isDisabled ? "0.5" : "1",
  backgroundColor: isSelected ? "#E62518" : "#FFFFFF",
  boxShadow: availableButtonShadow,
});
