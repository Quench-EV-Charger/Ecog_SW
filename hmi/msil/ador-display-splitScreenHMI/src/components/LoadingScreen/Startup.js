import React from "react";
import { FaChargingStation } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

function Startup({ message }) {
  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <img
          style={styles.brand}
          src={"/brandings/Maruti_logo.png"}
          alt="Brand logo"
        />
        {/* <h1 style={styles.brand}>Quench</h1> */}
        <FaChargingStation style={styles.icon} />
        <ImSpinner8 style={styles.spinner} />
        <p style={styles.subtitle}>Initializing system, please wait...</p>
        <div>
          <span
            style={{
              position: "relative",
              top: "30px",
              color: "red",
              fontWeight: "800",
            }}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    background: "linear-gradient(135deg, #0f2027,rgb(0, 0, 0),rgb(0, 0, 0))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
  },
  overlay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#ffffff",
    padding: "20px",
    animation: "fadeIn 1.5s ease-in-out",
    height: "100%",
  },
  brand: {
    width: "300px",
    marginBottom: "20px",
    color: "#5e769c", // light blue
    textShadow: "0 0 15pxrgb(122, 197, 212)",
    // animation: "glow 4s infinite ease-in-out",
  },
  icon: {
    fontSize: "80px",
    color: "#ffffff",
    marginBottom: "20px",
    marginLeft: "30px",
    animation: "pulse 2s infinite",
  },
  spinner: {
    fontSize: "36px",
    marginTop: "10px",
    animation: "spin 1s linear infinite",
    color: "#5e769c",
  },
  subtitle: {
    fontSize: "18px",
    opacity: 0.8,
    marginTop: "25px",
  },
};

// Inject CSS animations
const styleSheet = document.styleSheets[0];
const animations = [
  `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }`,
  `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }`,
  `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }`,
];

animations.forEach((anim) =>
  styleSheet.insertRule(anim, styleSheet.cssRules.length)
);

export default Startup;
