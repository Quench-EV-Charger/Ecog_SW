import React, { useContext, useEffect, useRef, useState } from "react";
import rfidImg from "../../../../assets/images/scan_rfid.svg";
import * as S from "./style";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedState } from "../../../../redux/chargingSlice";
import { setRfidAuthOwner } from "../../../../redux/rfidSlice";
import { ThemeContext } from "../../../ThemeContext/ThemeProvider";
import { isHandshaking } from "../../../../Utilis/UtilityFunction";

function Rfid({status, handleClick, eachOutlet }) {
  const dispatch = useDispatch();
  const charging = useSelector((state) => state.charging);
  const rfidAuthOwner = useSelector((state) => state.rfid.rfidAuthOwner);
  const { config } = charging;

  const socketRef = useRef(null);
  const eachOutletRef = useRef(eachOutlet);
  const timerRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [countdown, setCountdown] = useState(60);
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

    // if (!isRfidFlow && socketUrl) {
    //   const socket = new ReconnectingWebSocket(
    //     `${socketUrl}/services/rfid/idTag`
    //   );
    //   socketRef.current = socket;

    //   socket.onmessage = (event) => {
    //     const rfid = event.data;
    //     console.log("RFID Scanned:", rfid);

    //     const outlet = eachOutletRef.current;

    //     const activeSession =
    //       outlet?.user === rfid &&
    //       outlet?.pilot >= 3 &&
    //       outlet?.pilot <= 4 &&
    //       outlet?.phs >= 3;

    //     if (activeSession) {
    //       localStorage.setItem("selectedOutlet", outlet.outlet);
    //       localStorage.setItem("user", outlet.user);
    //       dispatch(setSelectedState(outlet));
    //       // handleClick("checkpoint");
    //     }
    //   };

    //   return () => {
    //     socket.close();
    //   };
    // }
  }, [config, dispatch, handleClick]);

  // Redirect if different outlet scanned
  useEffect(() => {
    if (!initialized) return;
    if (rfidAuthOwner?.outletId !== eachOutlet?.outlet) {
      handleClick("initial");
    }
  }, [rfidAuthOwner, eachOutlet?.outlet, initialized, handleClick]);

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
  },[countdown])



  return (
    <div style={{ position: "relative" }}>
      <img src={rfidImg} style={S.rfid_img} alt="Scan RFID" />
      <div style={S.rfid_info(theme)}>
        Please scan your RFID card to authorize your EV
        <br />
        <span style={{ fontSize: 18, color: "#FFA500" }}>
          Returning to home in {countdown} seconds...
        </span>
      </div>
      <div style={{ position: "absolute", top: "380px" }}>
        <button
          onClick={() => {
            clearInterval(timerRef.current);
            handleClick("initial");
          }}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #FFA500",
            padding: "0 18px",
            borderRadius: 40,
            height: 48,
            fontSize: 16,
            boxShadow: "0 0 5px #FFA500",
            color: "#FFA500",
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

export default Rfid;
