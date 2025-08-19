import React from "react";
import { Button, Icon } from "antd";

export default function NavbarButton({
  onClick,
  additionalStyles,
  iconType,
  children,
  theme,
  iconSize = "2vw",
  strikethrough,
  disabled = false,
}) {
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
        ...additionalStyles,
      }}
      data-testid="navbar-button"
    >
      {strikethrough && <Strikethrough theme={theme} />}
      {iconType && <Icon style={{ fontSize: iconSize }} type={iconType} />}
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
