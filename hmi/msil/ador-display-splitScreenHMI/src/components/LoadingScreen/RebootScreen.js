import React, { useEffect, useState, useContext } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { LoadingOutlined } from "@ant-design/icons";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const EvChargerIcon = () => (
    <svg
      width="80"
      height="80"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 2px #add8e6)" }}
    >
      <path
        d="M20 2H44C45.1046 2 46 2.89543 46 4V60C46 61.1046 45.1046 62 44 62H20C18.8954 62 18 61.1046 18 60V4C18 2.89543 18.8954 2 20 2Z"
        fill="#add8e6"
      />
      <path
        d="M32 16L26 30H34L28 44"
        stroke="#0d1117"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
const DEFAULT_REBOOT_TIME_SEC = 30;
const max32BitInt = 2147483647;

const Reboot = () => {
  const { config } = useSelector((state) => state.charging);
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(null);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const { rebootTimeSec } = config || {};
    let rebootTime = rebootTimeSec;

    if (!rebootTime || rebootTime < 0 || rebootTime > max32BitInt) {
      rebootTime = DEFAULT_REBOOT_TIME_SEC;
    }

    setSeconds(rebootTime);

    const timeout = setTimeout(() => window.location.reload(), rebootTime * 1000);
    const interval = setInterval(() => {
      setSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [config]);

  const isDark = theme === "dark";

  return (
    <div
      data-testid="reboot-page"
      style={{
        minHeight: "100vh",
        background: isDark
          ? "radial-gradient(circle at center, #0f2027, #000000, #000000)"
          : "linear-gradient(to bottom, #ffffff, #e6f7ff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        color: isDark ? "#ffffff" : "#000000",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          backgroundColor: isDark ? "#0d1117" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "25px",
          boxShadow: isDark
            ? "0 0 2px #add8e6, 0 0 4px #add8e6"
            : "0 0 4px #66ccff, 0 0 8px #66ccff",
          animation: "glowPulse 2s infinite alternate",
        }}
      >
        <EvChargerIcon />
      </div>

      <h1
        style={{
          color: isDark ? "#add8e6" : "#005577",
          fontSize: "32px",
          marginBottom: "10px",
          textShadow: isDark ? "0 0 1px #add8e6" : "none",
        }}
      >
        {t("SYSTEM_IS_REBOOTING")}
      </h1>

      <h2
        style={{
          color: isDark ? "#bfefff" : "#004466",
          fontSize: "20px",
          marginBottom: "15px",
        }}
      >
        {t("REBOOT_ESTIMATION")}
      </h2>

      {seconds !== null && (
        <div
          style={{
            fontSize: "26px",
            color: isDark ? "#ffffff" : "#222222",
            fontWeight: "bold",
          }}
        >
          {`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
            seconds % 60
          ).padStart(2, "0")}`}
        </div>
      )}

      <LoadingOutlined
        spin
        style={{
          fontSize: "36px",
          color: isDark ? "#add8e6" : "#3399cc",
          marginTop: "30px",
          textShadow: isDark ? "0 0 10px #add8e6" : "0 0 4px #66ccff",
          animation: "spin 1.5s linear infinite",
        }}
      />

      {/* Inline keyframes for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes glowPulse {
            from {
              box-shadow: 0 0 15px #add8e6, 0 0 30px #add8e6;
            }
            to {
              box-shadow: 0 0 30px #add8e6, 0 0 60px #add8e6;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Reboot;
