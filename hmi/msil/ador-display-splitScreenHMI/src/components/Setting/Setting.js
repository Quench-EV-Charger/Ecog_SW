import React, { useContext, useState } from "react";
import { FaShieldAlt, FaBolt, FaCog, FaQrcode } from "react-icons/fa";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const ToggleSetting = ({ icon, label, color, enabled, onToggle, disabled = false }) => (
  <div style={styles.settingRow}>
    <div style={styles.labelContainer}>
      <span style={styles.label}>
        {React.cloneElement(icon, { style: { marginRight: "8px", color } })}
        {label}
      </span>
      <span style={styles.badge}>Coming Soon</span>
    </div>
    <div
      style={{
        ...styles.toggle,
        background: enabled
          ? `linear-gradient(90deg, ${color}, #0ff, #00f)`
          : "#333",
        boxShadow: enabled ? `0 0 10px ${color}` : "none",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={!disabled ? onToggle : undefined}
    >
      <div
        style={{
          ...styles.toggleCircle,
          transform: enabled ? "translateX(24px)" : "translateX(0)",
          background: enabled
            ? `radial-gradient(circle, #000 40%, ${color})`
            : "#888",
          boxShadow: enabled ? `0 0 8px ${color}` : "none",
        }}
      />
    </div>
  </div>
);

function Setting() {
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [comboMode, setComboMode] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const isDark = theme === "dark";
  const backgroundColor = isDark ? "transparent" : "#ffffff";
  const textColor = isDark ? "#f5f5f5" : "#000000";

  return (
    <div style={{ ...styles.container, backgroundColor, color: textColor }}>
      <h2 style={{ ...styles.heading, color: textColor }}>
        <FaCog style={{ marginRight: "10px", color: "rgb(136 171 226)" }} />
        Settings
      </h2>

      <ToggleSetting
        icon={<FaShieldAlt />}
        label="OTP Enable"
        color="lime"
        enabled={otpEnabled}
        disabled={true}
        onToggle={() => setOtpEnabled(!otpEnabled)}
      />

      <ToggleSetting
        icon={<FaBolt />}
        label="Combo Mode"
        color="#00ffff"
        enabled={comboMode}
        disabled={true}
        onToggle={() => setComboMode(!comboMode)}
      />

      <ToggleSetting
        icon={<FaQrcode />}
        label="Display QR Code"
        color="#ff00ff"
        enabled={comboMode}
        disabled={true}
        onToggle={() => setComboMode(!comboMode)}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "Orbitron, sans-serif",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "2rem",
    borderBottom: "2px solid rgb(136 171 226)",
    paddingBottom: "0.5rem",
    marginTop: "-5px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1rem",
    boxShadow: "0 0 6px rgb(136 171 226)",
  },
  labelContainer: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "1.2rem",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
  },
  badge: {
    marginTop: "4px",
    fontSize: "0.75rem",
    backgroundColor: "#ff0055",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "6px",
    width: "fit-content",
    boxShadow: "0 0 6px #ff005555",
  },
  toggle: {
    width: "50px",
    height: "24px",
    borderRadius: "20px",
    position: "relative",
    transition: "background 0.3s ease, box-shadow 0.3s ease",
  },
  toggleCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    position: "absolute",
    top: "2px",
    left: "2px",
    transition: "transform 0.3s ease, background 0.3s ease",
  },
};

export default Setting;
