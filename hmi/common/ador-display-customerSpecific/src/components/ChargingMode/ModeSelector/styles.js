/* Mode Selector Styles */
import { availableButtonShadow } from "../../../constants/constants";

export const ModeSelector = (isSelected, isDisabled) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "50vw",
  borderRadius: "1.2vw",
  borderWidth: "0.3vw",
  borderColor: "#E62518",
  color: isSelected ? "#FFFFFF" : "rgba(0, 0, 0, 0.65)",
  fontWeight: "bold",
  fontSize: "2.25vw",
  height: "8vw",
  opacity: isDisabled ? "0.5" : "1",
  backgroundColor: isSelected ? "#E62518" : "#FFFFFF",
  boxShadow: availableButtonShadow,
});
