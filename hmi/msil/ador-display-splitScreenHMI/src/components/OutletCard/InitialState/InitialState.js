import React, { useEffect, useState, useCallback, useContext } from "react";
import connectorImg from "../../../assets/icons/gun_icon_outlet.png";
import faultedImg from "../../../assets/icons/close.png";
import { useSelector } from "react-redux";
import {
  isDisabled,
  isPreparingBothVCCU,
  isActive,
  inStoppingProccess,
  isNeedUnplug,
  isCharging,
  reservationHour,
  reservedDetails,
} from "../../../Utilis/UtilityFunction";
import PlugEV from "../GunAlerts/plugEV";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";
import { QRCodeSVG } from "qrcode.react";

function InitialState(props) {
  const { eachOutlet, handleClick, chargingStatus } = props;
  const store = useSelector((state) => state.charging);
  const { config, chargerState, chargingMode } = store;
  const hashStr = config?.uiConfiguration?.qrCode?.QRHashStr;
  const showQRCode = config?.uiConfiguration?.qrCode?.qrCodeEnabled;

  const [showPlugAlert, setShowPlugAlert] = useState(false);
  const [showReservationPrompt, setShowReservationPrompt] = useState(false);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [showReservationDetails, setShowReservationDetails] = useState(false);
  const [reservationDetailsHome, setReservationDetailsHome] = useState(null);
  const [pendingClick, setPendingClick] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const noFaultedStatus = [
    "charging",
    "preparing",
    "reserved",
    "available",
    "stopping",
  ];

  const outletId = Number(eachOutlet.outlet);

  const checkReservationDetails = async () => {
    try {
      const details = await reservedDetails(config?.API, outletId);
      const outletState = chargerState[outletId - 1];
      if (
        details &&
        outletState &&
        (outletState.phs === 1 || outletState.phs === 2)
      ) {
        setReservationDetailsHome(details);
        setShowReservationDetails(true);
      } else {
        setShowReservationDetails(false);
      }
    } catch (error) {
      console.error("Error fetching reservation details:", error);
    }
  };

  useEffect(() => {
    const runIntervalTasks = async () => {
      await checkReservationDetails();
      await handleSessionClick();
    };

    // Run once on mount
    runIntervalTasks();

    // Then run repeatedly every 5 seconds (adjust as needed)
    const interval = setInterval(() => {
      runIntervalTasks();
    }, 1000); // 5000ms = 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [store]);

  const handleSessionClick = async () => {
    const { outlet, user } = eachOutlet;
    if (isActive(eachOutlet)) {
      localStorage.setItem("user", user);
      localStorage.setItem("selectedOutlet", outlet);
      if (isCharging(eachOutlet)) {
        handleClick("charging");
      } else {
        handleClick("checkpoint");
      }
    }
  };

  const startAndStopButtonClick = async () => {
    try {
      if(!noFaultedStatus.includes(chargingStatus)){
        return
      }
      const promptDetails = await reservationHour(
        config?.API,
        eachOutlet.outlet
      );
      if (promptDetails && eachOutlet.phs >= 1) {
        setShowReservationPrompt(true);
        setReservationDetails(promptDetails.message);
        setPendingClick(true);
        return;
      }
      proceedWithClick(); // No reservation, proceed directly
    } catch (error) {
      console.error("Error checking reservation on click:", error);
    }
  };

  const proceedWithClick = () => {
    const { pilot, authorized, outlet, user } = eachOutlet;

    if (isDisabled(eachOutlet)) return;
    if (!isPreparingBothVCCU() && chargingMode === 1) return;

    localStorage.setItem("selectedOutlet", outlet);
    localStorage.setItem("user", user);

    if (isActive(eachOutlet)) {
      handleClick("stopcharging");
    } else {
      if (inStoppingProccess(eachOutlet)) {
        handleClick("stopcharging");
      } else if (isNeedUnplug(eachOutlet)) {
        handleClick("unplug");
      } else if (pilot >= 1 && pilot <= 2 && !authorized) {
        handleClick("auth");
      } else {
        setShowPlugAlert(true);
        setTimeout(() => setShowPlugAlert(false), 5000);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "40px",
        position: "relative",
      }}
      onClick={startAndStopButtonClick}
    >
      {showPlugAlert && (
        <div style={{ position: "absolute", top: "90px", zIndex: 10 }}>
          <PlugEV errMsg="Please plug in your EV charger to start charging." />
        </div>
      )}

      {showReservationPrompt && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            background: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "20px",
            borderRadius: "12px",
            zIndex: 20,
            textAlign: "center",
            width: "80%",
            maxWidth: "400px",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "10px" }}>
            🔔 This outlet is reserved
          </p>
          <p style={{ fontSize: "16px", marginBottom: "15px" }}>
            {reservationDetails || "Reservation is active for this outlet."}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReservationPrompt(false);
              setReservationDetails(null);
              if (pendingClick) {
                setPendingClick(false);
                proceedWithClick(); // Resume flow after OK
              }
            }}
            style={{
              backgroundColor: theme === "dark" ? "#ffffff" : "black",
              color: theme === "dark" ? "#000000" : "black",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            OK
          </button>
        </div>
      )}

      {showReservationDetails && (
        <div
          style={{
            position: "absolute",
            top: "100px",
            background: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "20px",
            borderRadius: "12px",
            zIndex: 20,
            textAlign: "center",
            width: "80%",
            maxWidth: "400px",
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: "bold" }}>
            Reserved For: {reservationDetailsHome?.vehicleId}
          </p>
          <p style={{ fontSize: "14px", fontWeight: "bold" }}>
            Ends at: {reservationDetailsHome?.expiryDate}
          </p>
        </div>
      )}

      {noFaultedStatus.includes(chargingStatus) ? (
        <>
          <span
            style={{
              fontSize: "40px",
              color: theme === "dark" ? "white" : "black",
            }}
          >
            Press here to start
          </span>
          <div
            style={{
              padding: "16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            {showQRCode ? (
              <QRCodeSVG
                value={hashStr}
                size={200}
                level="H"
                includeMargin={true}
                bgColor={theme === "dark" ? "#1e1e1e" : "#ffffff"}
                fgColor={theme === "dark" ? "#ffffff" : "#000000"}
              />
            ) : (
              <img
                style={{
                  width: "55%",
                  opacity: "70%",
                  filter: theme === "dark" ? "invert(0)" : "invert(1)",
                }}
                src={connectorImg}
                alt="Plug connector"
              />
            )}
          </div>

          <span
            style={{
              fontSize: "30px",
              color: theme === "dark" ? "white" : "black",
              position: "relative",
              bottom: "25px",
            }}
          >
            {eachOutlet.PowerCapW / 1000} kW
          </span>
        </>
      ) : (
        <>
          <img
            style={{
              width: "35%",
              padding: "20px",
              position: "relative",
              top: "25px",
            }}
            src={faultedImg}
            alt="Plug connector"
          />
          <span
            style={{
              fontSize: "30px",
              color: theme === "dark" ? "white" : "black",
              position: "relative",
              top: "55px",
            }}
          >
            {eachOutlet.PowerCapW / 1000} kW
          </span>
        </>
      )}
    </div>
  );
}

export default InitialState;
