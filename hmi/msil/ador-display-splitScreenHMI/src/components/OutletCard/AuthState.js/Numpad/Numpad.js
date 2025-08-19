import React, { useState, useEffect, useRef, useContext } from "react";
import * as styles from "./style";
import { ThemeContext } from "../../../ThemeContext/ThemeProvider";

function Numpad(props) {
  const { outlet, handleClick } = props;
  const [otp, setOtp] = useState("");
  const inputRef = useRef(null);
  const { theme, toggleTheme } = useContext(ThemeContext);


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleNumpadClick = (val) => {
    if (val === "Delete") {
      setOtp((prev) => prev.slice(0, -1));
    } else if (val === "Enter") {
      // You can replace this with your submit logic
      handleClick('charging')
      console.log("OTP Submitted:", otp);
    } else if (otp.length < 4) {
      setOtp((prev) => prev + val);
    }
    console.log(otp);
  };

  return (
    <div style={styles.container}>
      <textarea
        ref={inputRef}
        placeholder="Enter OTP"
        value={otp}
        readOnly // ✅ prevent manual typing
        style={styles.textarea(theme)}
        maxLength={4}
      />

      <div style={styles.numpadContainer}>
        {[
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "Delete",
          "0",
          "Enter",
        ].map((val, i) => {
          const isSpecial = val === "Delete" || val === "Enter";
          return (
            <button
              key={i}
              onClick={() => handleNumpadClick(val)} // ✅ handle button click
              style={{
                ...styles.numpadButton(theme),
                border: `1px solid ${isSpecial ? "black" : "rgba(63, 104, 164, 0.5)"}`,
                boxShadow: isSpecial
                  ? "0px 4px 10px rgba(3, 90, 221, 0.42)"
                  : "none",
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
      <div style={{position: "relative", top: "50px", right: "170px"}}>
      <button
          onClick={() => handleClick("initial")}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #FFA500",
            padding: "0 18px",
            borderRadius: 40,
            height: 48,
            fontSize: 16,
            boxShadow: "0 0 5px #FFA500",
            color: theme === "dark" ? "#FFA500" : "black",
            cursor: "pointer",
            letterSpacing: 1,
            textTransform: "uppercase",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 0 1px #FFA500";
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 204, 0.05)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 0 12px #FFA500";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "rotate(135deg)",
              border: "solid #FFA500",
              borderWidth: "0 3px 3px 0",
              padding: 4,
              marginRight: 8,
            }}
          />Back
          
        </button>

      </div>
    </div>
  );
}

export default Numpad;
