import React, { useEffect, useState } from "react";
import WarningICon from "../../../assets/icons/warning.png"; // Make sure it's a modern-looking icon (SVG preferred)

const RfidDisconnectedPopup = ({ isDisconnected }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isDisconnected);
  }, [isDisconnected]);

  return (
    <div
      style={{
        ...styles.popupContainer,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={styles.popup}>
        <img src={WarningICon} alt="Warning" style={styles.alertIcon} />
        <div style={styles.text}>RFID reader disconnected</div>
      </div>
    </div>
  );
};

const styles = {
  popupContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    transition: "transform 0.5s ease, opacity 0.5s ease",
    display: "flex",
    justifyContent: "center",
    zIndex: 1000,
    pointerEvents: "none",
  },
  popup: {
    background: "rgba(226, 71, 43, 0.2)",
    backdropFilter: "blur(1px)",
    color: "#fff",
    padding: "1px 20px",
    borderRadius: "10px 10px 0 0",
    fontSize: "17px",
    border: "1px solid rgb(199, 59, 16)",
    boxShadow: "0 0 10px rgb(197, 93, 77)",
    maxWidth: "360px",
    width: "90%",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    gap: "1px",
    pointerEvents: "auto",
    justifyContent: "center"
  },
  text: {
    // flex: 1,
    fontFamily: "'Orbitron', sans-serif", // Add Orbitron or other tech-style font via Google Fonts
    letterSpacing: "0.5px",
  },
  alertIcon: {
    height: "42px",
    animation: "pulseGlow 1.5s infinite alternate",
    filter: "drop-shadow(0 0 4px rgba(255,0,70,0.8))",
  },
};

// Add this to your global CSS
/*
@keyframes pulseGlow {
  from {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(255,0,70,0.6));
  }
  to {
    transform: scale(1.1);
    filter: drop-shadow(0 0 10px rgba(255,0,70,1));
  }
}
*/

export default RfidDisconnectedPopup;
