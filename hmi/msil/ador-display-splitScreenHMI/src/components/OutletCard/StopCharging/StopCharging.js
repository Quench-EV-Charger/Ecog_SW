import React, { useEffect, useMemo, useState, useRef, useContext } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import mqtt from "mqtt";
import {
  stopCharging,
  clearRfid,
  getallCapsIdTag,
} from "../../../Utilis/UtilityFunction";
import ReconnectingWebSocket from "reconnecting-websocket";
import PlugEV from "../GunAlerts/plugEV";
import rfidImg from "../../../assets/images/scan_rfid.svg";
import * as S from "./style";
import { setRfidAuthOwner } from "../../../redux/rfidSlice";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";


const StopCharging = ({ eachOutlet, handleClick }) => {
  const dispatch = useDispatch()
  const store = useSelector((state) => state.charging);
  const rfidAuthOwner = useSelector((state) => state.rfid.rfidAuthOwner);
  const reduxStore = useStore();

  const eachOutletRef = useRef(eachOutlet);

  const [currentPIN, setCurrentPIN] = useState("");
  const [errorInPIN, setErrorInPIN] = useState(false);
  const [errorInRfid, setErrorInRfid] = useState(false);
  const [nullRfidSent, setNullRfidSent] = useState(false);
  const processedRfidsRef = useRef(new Set());
  const processingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef(null);

  const ipcClient = useMemo(() => {
    return mqtt.connect(store?.ipcClientRoute);
  }, [store?.ipcClientRoute]);

  const stopCharge = async () => {
    const { config, chargingMode } = store;
    const { user, outlet } = eachOutletRef.current;
    const API = config?.API;
    const id = Date.now();
    const type = "charging-operation";

    const publishStopMessage = (outletId) => {
      const payload = { stopReason: "Local", outletId };
      const message = JSON.stringify({ id, type, payload });
      ipcClient.publish("hmi", message);
      console.log("HMI Stop published", message);
    };

    try {
      if (chargingMode > 0) {
        await Promise.all([
          stopCharging(API, user, 1),
          stopCharging(API, user, 2),
        ]);
        [1, 2].forEach(publishStopMessage);
      } else {
        await stopCharging(API, user, outlet);
        publishStopMessage(outlet);
      }
    } catch (error) {
      console.error("Error during stop charging:", error);
    } finally {
      handleClick("stopcharger");
      ipcClient.end();
    }
  };

  const handlePINSubmit = () => {
    const currentUser = eachOutletRef.current.user;
    if (currentUser?.includes(currentPIN)) {
      stopCharge();
    } else {
      const data = {
        type: "hmi#idTag-error",
        payload: { idTag: currentPIN, outletId: eachOutletRef.current.outlet },
      };
      ipcClient.publish("hmi", JSON.stringify(data));
      setErrorInPIN(true);
    }
  };

  const handleRFIDSubmit = (rfid) => {
    const API = store?.config?.API;
    const currentUser = eachOutletRef.current.user;
    const outletId = eachOutletRef.current.outlet;
    const currentRfidOwner = reduxStore.getState().rfid.rfidAuthOwner;
    if (currentRfidOwner.outletId !== outletId) {
      return;
    }

    if (getallCapsIdTag(API)) {
      const rfidTag = JSON.parse(rfid).idTag
      const rfidData = JSON.parse(rfid)

      // if(rfidData.outletId != null) {
      //   return
      // }
      if (currentUser?.toLowerCase().includes(rfidTag.toLowerCase())) {
        stopCharge();
      } else {
        ipcClient.publish(
          "hmi",
          JSON.stringify({
            type: "hmi#idTag-error",
            payload: { idTag: rfid, outletId },
          })
        );
        setErrorInRfid(true);
        setTimeout(() => setErrorInRfid(false), 5000);
      }
    } else {
      if (currentUser?.includes(rfid)) {
        stopCharge();
      } else {
        setErrorInRfid(true);
        setTimeout(() => setErrorInRfid(false), 5000);
      }
    }
  };

  const setupWebSocket = () => {
    const socketEndpoint = `${store?.config?.socketUrl}/services/rfid/v2/idTag`;
    const socket = new ReconnectingWebSocket(socketEndpoint);
    socket.onmessage = async (event) => {
      if (nullRfidSent) return;
      
      const rfidData = event.data;
      
      // Prevent duplicate processing of same RFID
      if (processedRfidsRef.current.has(rfidData)) {
        return;
      }
      
      // Mark RFID as processed
      processedRfidsRef.current.add(rfidData);
      
      // Clear processed RFID after 3 seconds to allow re-authentication
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      processingTimeoutRef.current = setTimeout(() => {
        processedRfidsRef.current.delete(rfidData);
      }, 5000);
      
      handleRFIDSubmit(event.data);
      setNullRfidSent(true);
      setTimeout(() => setNullRfidSent(false), 1000);
    };
    socketRef.current = socket;
  };

  useEffect(() => {
    const initialize = async () => {
      eachOutletRef.current = eachOutlet;
      dispatch(
        setRfidAuthOwner({ outletId: eachOutlet.outlet, timestamp: Date.now() })
      );
      await clearRfid(store?.config?.API);
      setupWebSocket();
      setInitialized(true);
    };
    initialize();

    return () => {
      // socketRef.current?.close();
      // Clear RFID processing timeout and set
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      processedRfidsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (rfidAuthOwner.outletId !== eachOutlet.outlet) {
      handleClick("charging");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfidAuthOwner, initialized]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleClick("initial");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
    };
  }, [countdown]);

  return (
    <div style={{ position: "relative" }}>
      <img src={rfidImg} style={S.rfid_img} alt="Scan RFID" />
      <div style={S.rfid_info(theme)}>
        Please scan your RFID card to{" "}
        <b style={{ color: "red" }}>stop charging</b> your EV.
        <br />
        <span style={{ fontSize: 18, color: "#00BFFF" }}>
          Returning to home in {countdown} seconds...
        </span>
      </div>
      {errorInRfid && (
        <div style={{ position: "absolute", top: "90px", zIndex: 10 }}>
          <PlugEV errMsg="Wrong RFID. Please swipe correct RFID." />
        </div>
      )}

      {/* Fixed Back Button at bottom-left */}
      <div
        style={{
          position: "absolute",
          top: "380px",
        }}
      >
        <button
          onClick={() => handleClick("initial")}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #00BFFF",
            padding: "0 18px",
            borderRadius: 40,
            height: 48,
            fontSize: 16,
            boxShadow: "0 0 5px #00BFFF",
            color: "#00BFFF",
            cursor: "pointer",
            letterSpacing: 1,
            textTransform: "uppercase",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 0 1px #00BFFF";
            e.currentTarget.style.backgroundColor = "rgba(0, 255, 204, 0.05)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 0 12px #00BFFF";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "rotate(135deg)",
              border: "solid #00BFFF",
              borderWidth: "0 3px 3px 0",
              padding: 4,
              marginRight: 8,
            }}
          />Back
          
        </button>
      </div>
    </div>
  );
};

export default StopCharging;
