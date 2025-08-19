import React, { useContext, useState } from "react";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";

function AuthMode(props) {
  const { outlet, handleClick } = props;
  const [selectedMode, setSelectedMode] = useState(null);
  const { theme, toggleTheme } = useContext(ThemeContext);
  

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    console.log("Selected Authentication Mode:", mode);
    handleClick(mode.toLowerCase());
    // You can trigger navigation or display another component here
  };

  return (
    <div style={{ marginTop: "100px", textAlign: "center" }}>
      <span style={{ fontSize: "25px", color: theme === "dark" ? "white" : "black", fontWeight: "bold" }}>
        Select mode of Authentication
      </span>

      <div
        style={{
          display: "flex",
          gap: "60px",
          justifyContent: "center",
          marginTop: "50px",
        }}
      >
        {["RFID", "OTP"].map((label) => (
          <button
            key={label}
            onClick={() => handleModeSelect(label)}
            style={{
              width: "120px",
              height: "45px",
              fontSize: "20px",
              borderRadius: "10px",
              backgroundColor: "transparent", // highlight selected
              color: theme === "dark" ? "white" : "black",
              border: "2px solid rgba(63, 104, 164, 0.5)",
              cursor: "pointer",
              boxShadow: "10px rgba(53, 123, 163, 0.5)",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AuthMode;
