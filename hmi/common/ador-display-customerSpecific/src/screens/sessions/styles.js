import { availableButtonShadow } from "../../constants/constants";

import { isHandshaking } from "../../utils";

export const SessionsPage = {
  minHeight: "85vh",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-evenly",
};

export const HeaderInfo = {
  display:"flex",
  justifyContent:"center",
  marginBottom:"5vh"
};

export const TariffsContainer = (errorCode) => ({
  display: "flex",
  alignItems: "center",
  paddingLeft: "6.25vw",
  paddingRight: "6.25vw",
  filter: errorCode && "blur(4px)",
  zIndex: "100",
});

export const BtnContainer2 = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

export const TariffsAligner = {
  height: "36.35vw",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "stretch",
  width:"100%"
};

export const SideSpace = {
  height: "36.35vw",
  alignItems: "stretch",
  display: "flex",
  textAlign: "center",
  marginLeft:"5vw",
  marginTop: "-2vw"  
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
export const StatusText = {
  fontWeight: "600",
  fontSize: "2vw",
  textAlign: "center",
  paddingRight:"4vw"
};

export const BtnClicked = {
  display: "block",
  width: "19.5vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: "1.85vw",
  height: "4.05vw",
  backgroundColor: "green",
  boxShadow: "rgba(0,0,0,85) 0.313vw 0.313vw 0 0",
};

export const ButtonContainer = {
  width: "23.5vw",
  height: "5.5vw",
  display: "block",
  alignItems: "center",
  zIndex: "110",
  paddingLeft:"3vh",
  marginBottom:"3vh"
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