import React, { useContext, useEffect, useRef, useState } from 'react';
import { Spin, Typography } from 'antd';
import { CheckCircleTwoTone, WarningTwoTone } from '@ant-design/icons';
import { elapsedTime, timestampToTime } from '../../../Utilis/UtilityFunction';
import { useSelector } from 'react-redux';
import { useTranslation } from "react-i18next";
import { ThemeContext } from '../../ThemeContext/ThemeProvider';

const { Title } = Typography;

// ─── Error mappings (same as common HMI) ─────────────────────────────────────

const ERROR_MAP = {
  eStopErr: "EMERGENCY_PRESSED",
  powerLossErr: "POWER_FAILURE",
  doorOpenErr: "CHARGER_DOOR_OPEN",
  groundFault: "GROUND_FAULT",
  underVoltageErr: "ERR_UNDER_VOLTAGE",
  overVoltageErr: "ERR_OVER_VOLTAGE",
  powerModuleFailureErr: "ERR_POWER_MODULE_FAILURE",
  outletTemperatureErr: "OUTLET_TEMP",
  cabinetTemperatureErr: "CAB_TEMP",
  powerModuleCommErr_1: "POWER_MODULE_COMM_GUN_A",
  powerModuleCommErr_2: "POWER_MODULE_COMM_GUN_B",
  gunTemperatureErr_1: "GUN_A_TEMP_ERR",
  gunTemperatureErr_2: "GUN_B_TEMP_ERR",
  imdFaultyErr: "IMD_DEVICE_FAULT",
  dcEnergyStuckErr_1: "DC_ENERGY_STUCK_ERR",
  dcEnergyStuckErr_2: "DC_ENERGY_STUCK_ERR",
  imdResistanceErr_1: "IMD_RESISTANCE_ERR",
  imdResistanceErr_2: "IMD_RESISTANCE_ERR",
  ac_em_fail: "AC_ENERGY_METER_FAILURE",
};

const SESSION_ERROR_CODES = {
  4: "SESSION_ERR_4",   5: "SESSION_ERR_5",   6: "SESSION_ERR_6",
  9: "SESSION_ERR_9",   21: "SESSION_ERR_21",  22: "SESSION_ERR_22",
  24: "SESSION_ERR_24", 28: "SESSION_ERR_28",  29: "SESSION_ERR_29",
  30: "SESSION_ERR_30", 31: "SESSION_ERR_31",  34: "SESSION_ERR_34",
  35: "SESSION_ERR_35", 36: "SESSION_ERR_36",  37: "SESSION_ERR_37",
  38: "SESSION_ERR_38", 39: "SESSION_ERR_39",  40: "SESSION_ERR_40",
  41: "SESSION_ERR_41", 54: "SESSION_ERR_54",  67: "SESSION_ERR_67",
  68: "SESSION_ERR_68", 69: "SESSION_ERR_69",
};

const getErrorMessages = (errorObj) => {
  if (!errorObj) return [];
  return Object.entries(ERROR_MAP)
    .filter(([key]) => errorObj[key] === true)
    .map(([, msgKey]) => msgKey);
};

const getSessionErrorKey = (code) => {
  if (!code || code === 0) return null;
  return SESSION_ERROR_CODES[parseInt(code)] || "SESSION_ERR_UNKNOWN";
};

// ─── Component ────────────────────────────────────────────────────────────────

const SessionResult = ({ handleClick, outlet, outletId }) => {
  const store = useSelector(state => state.charging);
  const [transaction, setTransaction] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(45);
  // Wait 8 seconds before reading errorObj — same as common HMI's explicit delay
  // so errorObj has time to propagate before we decide which screen to show
  const [waitDone, setWaitDone] = useState(false);
  const startTimeRef = useRef(Date.now());
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  // Use live Redux outlet state for errorObj/curr_ses_error — snapshot is captured
  // before errors propagate; live state gives the correct up-to-date values
  const liveOutlet = store.chargerState?.find(
    o => String(o.outlet) === String(outletId || outlet?.outlet)
  ) || outlet;

  // ── split-screen theme colors ──
  const cardBg      = theme === "dark" ? "#1e1e1e" : "#FFFFFF";
  const cardBorder  = theme === "dark" ? "2px solid rgba(24,144,255,0.3)" : "2px solid rgb(33,196,93)";
  const textColor   = theme === "dark" ? "#eee" : "#333333";
  const labelColor  = theme === "dark" ? "rgba(24,144,255,0.9)" : "#E62518";
  const rowDivider  = theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e8e8e8";
  const btnBorder   = theme === "dark" ? "1px solid rgba(24,144,255,0.3)" : "1px solid rgb(33,196,93)";
  const btnShadow   = theme === "dark" ? "0 1px 6px rgba(24,144,255,0.3)" : "0 1px 6px rgb(33,196,93)";
  const btnColor    = theme === "dark" ? "#fff" : "black";

  // ── fetch last session from DB ──
  useEffect(() => {
    const API = store?.config?.API;
    let cancelled = false;

    const fetchTransaction = async () => {
      try {
        const res = await fetch(`${API}/db/items`, {
          method: 'GET',
          headers: { 'db-identifer': 'sessions' },
        });
        const data = await res.json();
        const last = data[data.length - 1];
        if (!cancelled && last) { setTransaction(last); return true; }
      } catch (err) { console.error('SessionResult fetch error:', err); }
      return false;
    };

    const poll = async () => {
      const found = await fetchTransaction();
      if (!found && !cancelled) setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [store?.config?.API]);

  // ── 8-second wait before reading errorObj (same as common HMI) ──
  useEffect(() => {
    const timer = setTimeout(() => setWaitDone(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  // ── 45-second countdown (same as common HMI) ──
  useEffect(() => {
    const start = Date.now();
    startTimeRef.current = start;
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, 45 - elapsed);
      setCountdownSeconds(remaining);
      if (remaining <= 0) { clearInterval(iv); handleClick('initial'); }
    }, 100);
    return () => clearInterval(iv);
  }, []);

  // ── countdown circle (identical to common HMI) ──
  const renderCountdownCircle = () => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (countdownSeconds / 45) * circumference;
    return (
      <div style={{ position: "relative", width: "45px", height: "45px" }}>
        <svg style={{ transform: "rotate(-90deg)", width: "45px", height: "45px" }}>
          <circle cx="22.5" cy="22.5" r={radius} fill="none" stroke="#E0E0E0" strokeWidth="3" />
          <circle
            cx="22.5" cy="22.5" r={radius} fill="none"
            stroke="#99B7E6" strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear", strokeLinecap: "round" }}
          />
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)", pointerEvents: "none", textAlign: "center",
        }}>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#99B7E6" }}>
            {countdownSeconds}
          </div>
        </div>
      </div>
    );
  };

  // ── close button (identical position/shape to common HMI, themed color) ──
  const renderCloseButton = () => (
    <button
      onClick={() => handleClick('initial')}
      style={{
        position: "absolute", top: "15px", right: "15px",
        backgroundColor: "#E62518", color: "#FFFFFF",
        border: "none", borderRadius: "50%",
        width: "40px", height: "40px",
        fontSize: "20px", fontWeight: "bold", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(230,37,24,0.3)", zIndex: 10,
      }}
    >
      ×
    </button>
  );

  // ── data row (same layout as common HMI renderDataTable, themed colors) ──
  const renderDataRow = (label, value) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingBottom: "15px", borderBottom: rowDivider,
    }}>
      <span style={{ fontWeight: "600", color: labelColor, fontSize: "16px" }}>{label}</span>
      <span style={{ color: textColor, fontSize: "16px", fontWeight: "500", textAlign: "right" }}>{value}</span>
    </div>
  );

  // ── loading screen (same structure as common HMI) ──
  const renderLoading = () => (
    <div style={{
      backgroundColor: cardBg, borderRadius: "16px",
      padding: "60px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      border: cardBorder, width: "100%", maxWidth: "700px",
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "30px",
    }}>
      <div style={{
        width: "60px", height: "60px",
        border: "6px solid #E8E8E8", borderTop: `6px solid #99B7E6`,
        borderRadius: "50%", animation: "spin 1s linear infinite",
      }} />
      <div style={{ textAlign: "center", color: "#99B7E6", fontSize: "18px", fontWeight: "600" }}>
        Loading session summary
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── error-only screen for curr_ses_error (same as common HMI, themed) ──
  const renderErrorOnly = (errorKey) => (
    <div style={{
      backgroundColor: cardBg, borderRadius: "16px",
      padding: "50px 60px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      border: "2px solid #E62518", width: "100%", maxWidth: "700px",
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "25px",
    }}>
      {renderCloseButton()}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
        {renderCountdownCircle()}
        <div style={{ color: "#E62518", fontSize: "23px", fontWeight: "bold" }}>
          {t("CHARGING_ERROR")}
        </div>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
        padding: "20px", backgroundColor: theme === "dark" ? "#2a1010" : "#FFF5F5",
        borderRadius: "12px", border: "1px solid #FFCCCC", width: "100%",
      }}>
        <WarningTwoTone twoToneColor="#E62518" style={{ fontSize: "60px" }} />
        <div style={{ color: "#E62518", fontSize: "20px", fontWeight: "bold", textAlign: "center", lineHeight: "1.4" }}>
          {t(errorKey)}
        </div>
      </div>
      <div style={{ color: textColor, fontSize: "16px", textAlign: "center", marginTop: "10px" }}>
        {t("PLEASE_UNPLUG")}
      </div>
    </div>
  );

  // ── loading state: wait for both 8s delay AND DB fetch (same as common HMI) ──
  if (!waitDone || !transaction) return renderLoading();

  const { sessionStart, sessionStop, meterStart, meterStop, startSoC, stopSoC } = transaction;
  const energyConsumed = ((meterStop - meterStart) / 1000).toFixed(3);
  // Read from live Redux outlet — errorObj arrives slightly after session ends,
  // so snapshot would be empty. Live state has the correct current errors.
  const errorMessages = getErrorMessages(liveOutlet?.errorObj);
  const currSesError = liveOutlet?.curr_ses_error;

  // ── curr_ses_error: show error-only if no errorObj errors (same priority logic as common HMI) ──
  if (currSesError && currSesError !== 0 && errorMessages.length === 0) {
    const errorKey = getSessionErrorKey(currSesError);
    return renderErrorOnly(errorKey);
  }

  // ── normal session summary (same layout as common HMI renderSingleGunSummary) ──
  return (
    <div style={{
      backgroundColor: cardBg, borderRadius: "16px",
      padding: "50px 40px 40px 40px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      border: cardBorder, width: "100%", maxWidth: "1400px",
      position: "relative",
    }}>
      {renderCloseButton()}

      {/* Header — countdown + title + check icon (same as common HMI) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px", marginTop: "10px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
          {renderCountdownCircle()}
          <div style={{ color: "#99B7E6", fontSize: "23px", fontWeight: "bold" }}>
            {t("THANKS_FOR_CHARGING")}
          </div>
          <CheckCircleTwoTone twoToneColor="#92D050" style={{ fontSize: "45px" }} />
        </div>
      </div>

      {/* 2-column data grid (same as common HMI) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left: time information */}
        <div style={{ paddingRight: "10px", display: "flex", flexDirection: "column", gap: "15px" }}>
          {renderDataRow(t("START_TIME"), timestampToTime(sessionStart, store?.config?.timezone))}
          {renderDataRow(t("STOP_TIME"),  timestampToTime(sessionStop,  store?.config?.timezone))}
          {renderDataRow(t("TIME_TAKEN"), elapsedTime(sessionStart, sessionStop))}
        </div>

        {/* Right: energy and SoC */}
        <div style={{ paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "15px" }}>
          {renderDataRow(t("START_SOC"),        `${startSoC}%`)}
          {renderDataRow(t("STOP_SOC"),         `${stopSoC}%`)}
          {renderDataRow(t("ENERGY_DELIVERED"), `${energyConsumed} kWh`)}
        </div>
      </div>

      {/* Error messages at bottom (same as common HMI) */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginTop: "25px", minHeight: "40px", gap: "10px" }}>
        {errorMessages.map((msgKey, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", color: "#E62518", gap: "10px" }}>
            <WarningTwoTone twoToneColor="#E62518" style={{ fontSize: "24px" }} />
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>{t(msgKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionResult;
