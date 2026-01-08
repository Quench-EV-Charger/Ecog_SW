import React from "react";
import { Row, Col, Icon } from "antd";
import MainContext from "../providers/MainContext";
import { elapsedTime, timestampToTime } from "../utils";

class SessionSummaryPopup extends React.Component {
  static contextType = MainContext;

  state = {
    countdownSeconds: 45,
  };


  componentDidMount() {
    if (this.props.sessionData) {
      this.startCountdown();
    }
  }

  componentDidUpdate(prevProps) {
    // Restart countdown when new session arrives
    if (prevProps.sessionData !== this.props.sessionData && this.props.sessionData) {
      this.startCountdown();
    }
  }


  componentWillUnmount() {
    this.stopCountdown();
  }

  startCountdown = () => {
    this.stopCountdown();
    const { sessionData } = this.props;
    const countdownStartTime = sessionData?.countdownStartTime || Date.now();
    const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
    const remaining = Math.max(0, 45 - elapsed);
    this.setState({ countdownSeconds: remaining });

    this.countdownInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
      const remaining = Math.max(0, 45 - elapsed);
      this.setState({ countdownSeconds: remaining });

      if (remaining <= 0) {
        this.stopCountdown();
      }
    }, 100);
  };

  stopCountdown = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  };

  renderCountdownCircle = () => {
    const { countdownSeconds } = this.state;
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (countdownSeconds / 45) * circumference;

    return (
      <div style={{ position: "relative", width: "45px", height: "45px" }}>
        <svg
          style={{
            transform: "rotate(-90deg)",
            width: "45px",
            height: "45px",
          }}
        >
          <circle
            cx="22.5"
            cy="22.5"
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth="3"
          />
          <circle
            cx="22.5"
            cy="22.5"
            r={radius}
            fill="none"
            stroke="#99B7E6"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 0.1s linear",
              strokeLinecap: "round",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#99B7E6" }}>
            {countdownSeconds}
          </div>
        </div>
      </div>
    );
  };

  renderGunLetter = (letter, useQAsOutletID) => (
    <div
      style={{
        backgroundColor: "#E62518",
        border: useQAsOutletID ? "none" : "0.156vw solid #0070c0",
        boxShadow: "0.078vw 0.313vw 0.938vw rgba(0, 0, 0, 0.08)",
        borderRadius: "50%",
        color: "#FFFFFF",
        height: "50px",
        width: "50px",
        minWidth: "50px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "18px",
        fontWeight: "bold",
      }}
    >
      {useQAsOutletID ? "" : letter}
    </div>
  );

  renderDataTable = (labels, values) => (
    <div style={{ width: "100%" }}>
      {labels.map((label, idx) => (
        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", borderBottom: "1px solid #e8e8e8" }}>
          <span style={{ fontWeight: "600", color: "#E62518", fontSize: "16px" }}>
            {label}
          </span>
          <span style={{ color: "#333333", fontSize: "16px", fontWeight: "500", textAlign: "right" }}>
            {values[idx]}
          </span>
        </div>
      ))}
    </div>
  );

  // ✅ Extract error message mapping - returns array of ALL active errors (equal priority)
  getErrorMessage = (errorObj) => {
    // Handle null or undefined errorObj (normal completion case)
    if (!errorObj) {
      return [];
    }

    // Error mapping table
    const errorMap = {
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
      imdFaultyErr_controller1: "IMD_DEVICE_FAULT_CONTROLLER_1",
      imdFaultyErr_controller2: "IMD_DEVICE_FAULT_CONTROLLER_2",
      imdResistanceErr_1: "IMD_RESISTANCE_ERR",
      imdResistanceErr_2: "IMD_RESISTANCE_ERR",
      ac_em_fail: "AC_ENERGY_METER_FAILURE",
    };

    // Collect ALL active errors
    const activeErrors = [];
    for (const [errorKey, errorMessage] of Object.entries(errorMap)) {
      if (errorObj[errorKey] === true) {
        activeErrors.push(errorMessage);
      }
    }

    // Check for any unknown errors not in our map
    const knownErrorKeys = Object.keys(errorMap);
    const hasUnknownError = Object.entries(errorObj).some(
      ([key, value]) => value === true && !knownErrorKeys.includes(key)
    );

    if (hasUnknownError) {
      console.warn("[SessionSummaryPopup] Unknown error detected in errorObj:", errorObj);
      activeErrors.push("CHARGING_ERROR");
    }

    console.log("[SessionSummaryPopup] DEBUG getErrorMessage - Input errorObj:", errorObj);
    console.log("[SessionSummaryPopup] DEBUG getErrorMessage - Active errors found:", activeErrors);

    return activeErrors;
  };

  renderCloseButton = () => {
    const { onClose } = this.props;

    return (
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          backgroundColor: "#E62518",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          fontSize: "20px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(230, 37, 24, 0.3)",
          zIndex: "10",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#C41E15";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#E62518";
          e.currentTarget.style.transform = "scale(1)";
        }}
        data-testid="session-summary-close-button"
      >
        ×
      </button>
    );
  };

  renderLoadingScreen = (t) => {
    return (
      <>
        {/* Blur Background Overlay */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: "1000",
          }}
          data-testid="session-summary-blur-overlay"
        >
          <div
            style={{
              position: "relative",
              padding: "20px",
              maxWidth: "95vw",
              pointerEvents: "auto",
            }}
            data-testid="session-summary-loading"
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "60px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                border: "2px solid #99B7E6",
                width: "100%",
                maxWidth: "700px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "30px",
              }}
            >
              {/* Spinner */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  border: "6px solid #E8E8E8",
                  borderTop: "6px solid #99B7E6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />

              {/* Loading Text */}
              <div
                style={{
                  textAlign: "center",
                  color: "#99B7E6",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Loading session summary
              </div>

              {/* CSS Animation */}
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        </div>
      </>
    );
  };

  renderSessionSummary = () => {
    const { sessionData } = this.props;
    const { t } = this.context;

    if (!sessionData) return null;

    // Handle loading state
    if (sessionData.mode === "loading") {
      return this.renderLoadingScreen(t);
    }

    let mode = "single";
    let sessions = [];

    if (sessionData.mode === "dual" && Array.isArray(sessionData.sessions)) {
      mode = "dual";
      sessions = sessionData.sessions;
    } else if (sessionData.mode === "single" && Array.isArray(sessionData.sessions)) {
      mode = "single";
      sessions = sessionData.sessions;
    } else if (sessionData.sessionStart !== undefined) {
      mode = "single";
      sessions = [sessionData];
    }

    const timezone = this.context.config?.timezone;

    return (
      <>
        {/* Blur Background Overlay */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: "1000",
          }}
          data-testid="session-summary-blur-overlay"
        >
          <div
            style={{
              position: "relative",
              padding: "20px",
              maxWidth: "95vw",
              pointerEvents: "auto",
            }}
            data-testid="session-summary-popup"
          >
            {mode === "single" && sessions[0] && this.renderSingleGunSummary(sessions[0], t, timezone)}
            {mode === "dual" && sessions.length === 2 && this.renderDualGunSummary(sessions, t, timezone)}
          </div>
        </div>
      </>
    );
  };

  renderSingleGunSummary = (sessionData, t, timezone) => {
    const {
      sessionStart,
      sessionStop,
      startSoC,
      stopSoC,
      energyConsumed,
      gunLetter,
      useQAsOutletID,
      errorObj: sessionErrorObj = {},
    } = sessionData;

    // ✅ Get ALL active errors (returns array)
    const errorMessages = this.getErrorMessage(sessionErrorObj);
    console.log("[SessionSummaryPopup] Single Gun - errorObj:", sessionErrorObj, "errorMessages:", errorMessages);

    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "50px 40px 40px 40px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          border: "2px solid #99B7E6",
          width: "100%",
          maxWidth: "1400px",
          position: "relative",
        }}
      >
        {/* Close Button */}
        {this.renderCloseButton()}
        {/* Header Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px", marginTop: "10px" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
            {this.renderCountdownCircle()}
            <div
              style={{
                color: "#99B7E6",
                fontSize: "23px",
                fontWeight: "bold",
              }}
            >
              {t ? t("THANKS_FOR_CHARGING") : "Thank you for Charging"}
            </div>
            <Icon type="check-circle" style={{ fontSize: "45px", color: "#92D050" }} />
          </div>
          {gunLetter && (
            <div style={{ marginTop: "10px" }}>{this.renderGunLetter(gunLetter, useQAsOutletID)}</div>
          )}
        </div>

        {/* Content Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Left Column: Time Information */}
          <div style={{ paddingRight: "10px" }}>
            {this.renderDataTable(
              [
                t ? t("START_TIME") : "Start Time",
                t ? t("STOP_TIME") : "Stop Time",
                t ? t("TIME_TAKEN") : "Time Taken",
              ],
              [
                timestampToTime(sessionStart, this?.context?.config?.timezone),
                timestampToTime(sessionStop, this?.context?.config?.timezone),
                elapsedTime(sessionStart, sessionStop),

              ]
            )}
          </div>

          {/* Right Column: Energy and SoC Information */}
          <div style={{ paddingLeft: "10px" }}>
            {this.renderDataTable(
              [
                t ? t("START_SOC") : "Start SoC",
                t ? t("STOP_SOC") : "Stop SoC",
                t ? t("ENERGY") : "Energy",
              ],
              [
                `${startSoC}%`,
                `${stopSoC}%`,
                `${energyConsumed} kWh`,
              ]
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginTop: "25px", minHeight: "40px", gap: "10px" }}>
          {errorMessages && errorMessages.length > 0 && errorMessages.map((errorMsg, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", color: "#E62518", gap: "10px" }}>
              <Icon type="warning" style={{ fontSize: "24px" }} />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>{t ? t(errorMsg) : errorMsg}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  renderDualGunSummary = (sessions, t, timezone) => {
    // ✅ Collect ALL error messages from all sessions (flatMap to flatten arrays)
    const allErrorMessages = sessions
      .flatMap((s) => this.getErrorMessage(s.errorObj));

    console.log("[SessionSummaryPopup] Dual Gun - sessions:", sessions.map(s => ({ outlet: s.outlet, errorObj: s.errorObj })), "allErrorMessages:", allErrorMessages);

    const uniqueErrorMessages = [...new Set(allErrorMessages)];

    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "55px 45px 45px 45px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          border: "2px solid #99B7E6",
          width: "100%",
          maxWidth: "1600px",
          position: "relative",
        }}
      >
        {/* Close Button */}
        {this.renderCloseButton()}
        {/* Header with countdown */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px", gap: "15px" }}>
          {this.renderCountdownCircle()}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#99B7E6",
                fontSize: "23px",
                fontWeight: "bold",
              }}
            >
              {t ? t("THANKS_FOR_CHARGING") : "Thank you for Charging"}
            </div>
          </div>
          <Icon type="check-circle" style={{ fontSize: "45px", color: "#92D050" }} />
        </div>

        {/* Dual Gun Content - Responsive Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {sessions.map((sessionData, idx) => this.renderDualGunSection(sessionData, String.fromCharCode(65 + idx), t, timezone))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "20px", minHeight: "30px" }}>
          {uniqueErrorMessages.map((errorMsg, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", color: "#E62518", gap: "10px", marginBottom: "5px" }}>
              <Icon type="warning" style={{ fontSize: "24px" }} />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>{t ? t(errorMsg) : errorMsg}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  renderDualGunSection = (sessionData, gunLabel, t, timezone) => {
    const {
      sessionStart,
      sessionStop,
      startSoC,
      stopSoC,
      energyConsumed,
      gunLetter,
      useQAsOutletID,
    } = sessionData;

    return (
      <div
        key={gunLabel}
        style={{
          padding: "18px",
          backgroundColor: "#f9f9f9",
          borderRadius: "10px",
          border: "1px solid #e0e0e0",
        }}
      >
        {/* Gun Header */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ color: "#E62518", fontSize: "15px", fontWeight: "bold" }}>
            Gun {gunLabel}
          </span>
        </div>

        {/* Gun Letter */}
        {gunLetter && (
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div
              style={{
                backgroundColor: "#E62518",
                border: useQAsOutletID ? "none" : "0.156vw solid #0070c0",
                boxShadow: "0.078vw 0.313vw 0.938vw rgba(0, 0, 0, 0.08)",
                borderRadius: "50%",
                color: "#FFFFFF",
                height: "45px",
                width: "45px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0 auto",
              }}
            >
              {useQAsOutletID ? "" : gunLetter}
            </div>
          </div>
        )}

        {/* Data Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #e8e8e8" }}>
            <span style={{ color: "#E62518", fontWeight: "600", fontSize: "14px" }}>
              {t ? t("START_TIME") : "Start Time"}
            </span>
            <span style={{ color: "#333333", fontSize: "14px" }}>
              {timestampToTime(sessionStart, timezone)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", paddingTop: "12px", borderBottom: "1px solid #e8e8e8" }}>
            <span style={{ color: "#E62518", fontWeight: "600", fontSize: "14px" }}>
              {t ? t("STOP_TIME") : "Stop Time"}
            </span>
            <span style={{ color: "#333333", fontSize: "14px" }}>
              {timestampToTime(sessionStop, timezone)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", paddingTop: "12px", borderBottom: "1px solid #e8e8e8" }}>
            <span style={{ color: "#E62518", fontWeight: "600", fontSize: "14px" }}>
              {t ? t("TIME_TAKEN") : "Time Taken"}
            </span>
            <span style={{ color: "#333333", fontSize: "14px" }}>
              {elapsedTime(sessionStart, sessionStop)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", paddingTop: "12px", borderBottom: "1px solid #e8e8e8" }}>
            <span style={{ color: "#E62518", fontWeight: "600", fontSize: "14px" }}>
              {t ? t("START_SOC") : "Start SoC"}
            </span>
            <span style={{ color: "#333333", fontSize: "14px" }}>{startSoC}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", paddingTop: "12px", borderBottom: "1px solid #e8e8e8" }}>
            <span style={{ color: "#E62518", fontWeight: "600", fontSize: "14px" }}>
              {t ? t("STOP_SOC") : "Stop SoC"}
            </span>
            <span style={{ color: "#333333", fontSize: "14px" }}>{stopSoC}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px" }}>
            <span style={{ color: "#E62518", fontWeight: "600", fontSize: "14px" }}>
              {t ? t("ENERGY") : "Energy"}
            </span>
            <span style={{ color: "#333333", fontSize: "14px" }}>{energyConsumed} kWh</span>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { popupShown } = this.props;

    return <>{popupShown && this.renderSessionSummary()}</>;
  }
}

export default SessionSummaryPopup;
