import React, { useContext } from "react";
import WarningICon from "../../../assets/icons/warning.png";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";

function PlugEV({ errMsg }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const alertStyles = {
    background: isDark
      ? "linear-gradient(1deg, rgb(107, 43, 43), rgb(39, 28, 29))"
      : "#ffe5e5", // transparent for light theme
    border: "1px solid rgb(252, 0, 0)",
    borderRadius: "12px",
    padding: "20px 25px",
    color: "#ff4d4d",
    fontFamily: `'Orbitron', sans-serif`,
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    animation: "slideInGlow 0.5s ease-out",
    maxWidth: "600px",
    margin: "20px auto",
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInGlow {
            0% {
              opacity: 0;
              transform: translateY(-20px);
              box-shadow: 0 0 0 rgba(255, 77, 77, 0);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
              box-shadow: 0 0 20px rgba(255, 77, 77, 0.4);
            }
          }
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            100% {
              transform: scale(1.1);
            }
          }
        `}
      </style>

      <div style={alertStyles}>
        <img src={WarningICon} alt="Warning" style={styles.alertIcon} />
        <div style={styles.alertMessage}>{errMsg}</div>
      </div>
    </>
  );
}

const styles = {
  alertIcon: {
    fontSize: "2rem",
    animation: "pulse 1.2s infinite alternate",
    height: "50px",
  },
  alertMessage: {
    flex: 1,
  },
};

export default PlugEV;
