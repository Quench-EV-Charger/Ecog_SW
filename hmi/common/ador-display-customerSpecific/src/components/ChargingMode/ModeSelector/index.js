import React from "react";
import { Button } from "antd";

import * as S from "./styles";
import * as C from "../../../screens/info/styles";


export default function ({
  text,
  style,
  onClick,
  buttonmode,
  isSelected,
  isDisabled,
}) {
  const getStyle = () => {
    // const defaultStyle = S.ModeSelector(isSelected, isDisabled);
    const defaultStyle = C.ModeSelector(isSelected, isDisabled);

    return { ...defaultStyle, ...style, position: "relative" };
  };

  return (
    <Button
      onClick={onClick}
      style={getStyle()}
      buttonmode={buttonmode}
      disabled={isDisabled}
      data-testid="mode-selector"
    >
      {text}
    </Button>
  );
}
