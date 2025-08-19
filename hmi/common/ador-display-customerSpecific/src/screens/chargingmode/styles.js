import { availableButtonShadow } from "../../constants/constants";

/* Whole Page Styles */
export const ChargingModePage = {
  minHeight: "85vh",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
};

/* Mode Selector Row Styles */
export const ModeSelectorContainer = {

  // display: "block",
  // marginBottom:"2vh",
  // justifyContent: "right",
  // alignItems: "center",
};
export const TextContainer = {
  display: "flex",
  width:"50%",
textAlign:"right",
justifyContent: "right",
alignItems: "right",
};


/* Confirmation ContainerS Row Styles */
export const ConfirmationContainer = {
  height: "20vh",
  display: "flex",
  alignItems: "center",
};

/* Next Button Styles */
export const NextButton = (isDisabled) => ({
  display: "block",
  width: "19.5vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "rgba(0, 0, 0, 0.65)",
  fontWeight: "bold",
  fontSize: "1.85vw",
  height: "4.05vw",
  opacity: isDisabled ? "0.5" : "1",
  backgroundColor: "#FFFFFF",
  boxShadow: availableButtonShadow,
  margin: "0 3vw",
});

/* Cancel Button Styles */
export const CancelButton = {
  display: "block",
  width: "19.5vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: "rgba(0, 0, 0, 0.65)",
  fontWeight: "bold",
  fontSize: "1.85vw",
  height: "4.05vw",
  opacity: "1",
  backgroundColor: "#FFFFFF",
  boxShadow: availableButtonShadow,
  margin: "0 3vw",
};
