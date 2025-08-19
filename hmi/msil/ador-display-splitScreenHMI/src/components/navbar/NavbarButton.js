import React from "react";
import { Button } from "antd";
import * as Icons from "@ant-design/icons"; // Import all icons

export default function NavbarButton({
  onClick,
  additionalStyles,
  iconType,
  children,
  theme,
  iconSize = "2vw",
  strikethrough,
  disabled = false,
  showStrikethroughWhenDisabled = true, // NEW PROP
}) {
  const DynamicIcon = iconType && Icons[iconType];

  return (
    <Button
      disabled={disabled}
      type="default"
      shape="circle"
      onClick={onClick}
      style={{
        width: "4vw",
        height: "4vw",
        boxShadow: "0px 2px 9px rgba(0, 0, 0, 0.3)",
        backgroundColor: theme === "dark" ? "#373744" : "white",
        color: theme === "dark" ? "white" : "black",
        position: "relative",
        pointerEvents: !showStrikethroughWhenDisabled ? "none" : "auto", // 👈 disable interaction
        opacity: !showStrikethroughWhenDisabled ? 0.5 : 1, // 👈 faded look
        cursor: !showStrikethroughWhenDisabled ? "not-allowed" : "pointer",
        ...additionalStyles,
      }}
      data-testid="navbar-button"
    >
      {disabled && showStrikethroughWhenDisabled && <Strikethrough theme={theme} />}
      {DynamicIcon && <DynamicIcon style={{ fontSize: iconSize }} />}
      {children}
    </Button>
  );
}

const Strikethrough = ({ theme }) => (
  <>
    <div
      style={{
        position: "absolute",
        width: "80%",
        height: "0.234vw",
        background: theme === "light" ? "black" : "white",
        transform: "rotate(45deg)",
        margin: "0.977vw 0.391vw",
      }}
    />
    <div
      style={{
        position: "absolute",
        width: "80%",
        height: "0.234vw",
        background: theme === "light" ? "black" : "white",
        transform: "rotate(-45deg)",
        margin: "0.977vw 0.391vw",
      }}
    />
  </>
);
