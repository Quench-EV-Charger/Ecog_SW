import React, { useContext, useEffect, useRef, useState } from "react";
import rfidImg from "../../../../assets/images/scan_rfid.svg";
import * as S from "./style";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedState } from "../../../../redux/chargingSlice";
import { setRfidAuthOwner } from "../../../../redux/rfidSlice";
import { ThemeContext } from "../../../ThemeContext/ThemeProvider";
import { isHandshaking } from "../../../../Utilis/UtilityFunction";

function Rfid({ status, handleClick, eachOutlet }) {
  const dispatch = useDispatch();
  const charging = useSelector((state) => state.charging);
  const rfidAuthOwner = useSelector((state) => state.rfid.rfidAuthOwner);
  const { config } = charging;

  const socketRef = useRef(null);
  const eachOutletRef = useRef(eachOutlet);
  const [initialized, setInitialized] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);


  // Keep eachOutlet ref in sync
  useEffect(() => {
    eachOutletRef.current = eachOutlet;
    if (eachOutlet?.outlet) {
      dispatch(
        setRfidAuthOwner({ outletId: eachOutlet.outlet, timestamp: Date.now() })
      );
    }
  }, [eachOutlet, dispatch]);

  useEffect(() => {
    setInitialized(true);
    const { isRfidFlow, socketUrl } = config || {};
    if (rfidAuthOwner.outletId !== eachOutlet.outletId) {
      return;
    }

    if (!isRfidFlow && socketUrl) {
      const socket = new ReconnectingWebSocket(
        `${socketUrl}/services/rfid/idTag`
      );
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const rfid = event.data;
        console.log("RFID Scanned:", rfid);

        const outlet = eachOutletRef.current;

        const activeSession =
          outlet?.user === rfid &&
          outlet?.pilot >= 3 &&
          outlet?.pilot <= 4 &&
          outlet?.phs >= 3;

        if (activeSession) {
          localStorage.setItem("selectedOutlet", outlet.outlet);
          localStorage.setItem("user", outlet.user);
          dispatch(setSelectedState(outlet));
          // handleClick("checkpoint");
        }
      };

      return () => {
        socket.close();
      };
    }
  }, [config, dispatch, handleClick]);

  // Redirect if different outlet scanned
  useEffect(() => {
    if (!initialized) return;
    if (rfidAuthOwner?.outletId !== eachOutlet?.outlet) {
      handleClick("initial");
    }
  }, [rfidAuthOwner, eachOutlet?.outlet, initialized, handleClick]);




  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "2vh 8px",
      gap: "4vh",
      boxSizing: "border-box",
    }}>
      <div style={S.rfid_info(theme)}>
        Swipe your RFID card or click<br/>
        "Start Charging" on your mobile app to authorize EV
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <img src={rfidImg} style={S.rfid_img} alt="Scan RFID" />
      </div>
      <div>
        <button
          onClick={() => {
            handleClick("initial");
          }}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #FFA500",
            padding: "0 18px",
            borderRadius: 40,
            height: 48,
            fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
            boxShadow: "0 0 5px #FFA500",
            color: "#FFA500",
            cursor: "pointer",
            letterSpacing: 1,
            textTransform: "uppercase",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
            }}
          />Back

        </button>
      </div>
    </div>
  );
}

export default Rfid;
