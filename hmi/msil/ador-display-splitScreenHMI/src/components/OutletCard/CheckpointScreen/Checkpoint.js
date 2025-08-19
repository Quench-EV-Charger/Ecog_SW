import React, { useContext } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import * as S from "./Styles";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";

export const CheckPoint = ({ iconType, iconColor, text }) => {
  let IconComponent;
  let isSpinning = false;
  let resolvedColor
  const { theme } = useContext(ThemeContext);

  switch (iconType) {
    case "check":
      IconComponent = FaCheckCircle;
      resolvedColor = "#00B051"
      break;
    case "close":
      IconComponent = FaTimesCircle;
      resolvedColor =  "red";
      break;
    case "loading":
      IconComponent = FaSpinner;
      isSpinning = true;
      resolvedColor = theme === "dark" ? "#e0e0e0" : "black";
      break;
    default:
      IconComponent = FaCheckCircle;
  }

  // Determine default icon color based on theme if no iconColor is passed

  return (
    <S.CheckPointContainer theme={theme}>
      <span className={isSpinning ? "icon spin" : "icon"}>
        <IconComponent style={{ color: resolvedColor }} />
      </span>
      <span className="text">{text}</span>
    </S.CheckPointContainer>
  );
};
