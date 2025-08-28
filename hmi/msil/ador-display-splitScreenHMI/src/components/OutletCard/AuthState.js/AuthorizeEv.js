import React, { useEffect, useState, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Row, Col, Typography } from "antd";
import ReconnectingWebSocket from "reconnecting-websocket";
import { withTranslation } from "react-i18next";
import store from "../../../redux/store";
import mqtt from "mqtt";

import {
  isNeedUnplug,
  clearRfid,
  isActive,
  stopCharging,
  reservationHour,
} from "../../../Utilis/UtilityFunction";
import { httpPost, httpGet } from "../../../services/servicesApi";
import useSessionDb from "../../../LocalDB/useSessionDb";
import autochargespin from "../../../assets/images/autochargespin.gif";
import AuthMode from "./AuthMode";
import Rfid from "./RFID/Rfid";
import IpcMqttService from "../../../services/ipcMqttService";
import {
  setRemoteAuthMode,
  setSelectedState,
} from "../../../redux/chargingSlice";
import PlugEV from "../GunAlerts/plugEV";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";
import { isHandshaking } from "../../../Utilis/UtilityFunction";

const { Title } = Typography;

const AuthorizeEv = ({ status, outlet, handleClick }) => {
  const { addOrUpdateSessionToDb } = useSessionDb();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useContext(ThemeContext);


  const [errorInRfid, setErrorInRfid] = useState(false);
  const [currentPIN, setCurrentPIN] = useState("");
  const [errorInPIN, setErrorInPIN] = useState(false);
  const [spinnerShown, setSpinnerShown] = useState(false);
  const [allowToShowAlert, setAllowToShowAlert] = useState(false);
  const [waitingForOcppMsg, setWaitingForOcppMsg] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [isAutocharging, setIsAutocharging] = useState(true);
  const [autochargeauth, setAutochargeauth] = useState(true);
  const [reservationStartTime, setReservationStartTime] = useState(null);
  const [reservationEndTime, setReservationEndTime] = useState(null);
  const [showAuthMode, setShowAuthMode] = useState(true);
  const [authMode, setAuthMode] = useState(null);

  const selectedState = useSelector((state) => state.charging.selectedState);
  const chargerState = useSelector((state) => state.charging.chargerState);
  const config = useSelector((state) => state.charging.config);

  const showRfidError = () => {
    setErrorInRfid(true);
    setTimeout(() => hideRfidError(), 5000);
    setAllowToShowAlert(false);
  };

  const hideRfidError = () => setErrorInRfid(false);
  const hidePINError = () => {
    setErrorInPIN(false);
    setCurrentPIN("");
  };

  const fetchData = useCallback(async (API, outletID) => {
    try {
      const endpoint = `${API}/services/ocpp/reservations`;
      const apiResponse = await httpGet(endpoint);
      const currentTimestamp = Date.now();

      if (Array.isArray(apiResponse)) {
        const validReservations = apiResponse.filter(({ data }) => {
          const { startDate, expiryDate } = data || {};
          return (
            new Date(startDate).getTime() <= currentTimestamp &&
            new Date(expiryDate).getTime() > currentTimestamp
          );
        });

        const outletReservation = validReservations.find(
          ({ data }) => String(data?.connectorId) === outletID
        );

        if (outletReservation) {
          const { startDate, expiryDate } = outletReservation.data;
          setReservationStartTime(new Date(startDate).getTime());
          setReservationEndTime(new Date(expiryDate).getTime());
        } else {
          setReservationStartTime(null);
          setReservationEndTime(null);
        }
      }
    } catch (error) {
      console.error("Error fetching reserved outlets:", error);
      setReservationStartTime(null);
      setReservationEndTime(null);
    }
  }, []);

  const authResHandler = useCallback(
    (data) => {
      data = data.detail;
      const isAC = selectedState?.outletType === "AC";

      if (data.type === "auth-res") {
        setWaitingForOcppMsg(false);
        const CurrentIDTag = data.payload.idTag;

        if (
          CurrentIDTag.startsWith("VID:") &&
          data.payload.status !== "Rejected"
        )
          return;

        if (data.payload.status === "Rejected") {
          if (CurrentIDTag.startsWith("VID:")) {
            hideRfidError();
            setAutochargeauth(false);
            setIsAutocharging(false);
            setShowAuthMode(true);
          }
          if (!allowToShowAlert) return;
          if (currentPIN === "") showRfidError();
          else setErrorInPIN(true);
        } else {
          if (data.payload?.idTag && isAC) {
            insertACSession(data.payload.idTag);
          }
          setSpinnerShown(true);
        }
      }
    },
    [allowToShowAlert, currentPIN, selectedState]
  );

  const handleRemoteAuth = (data) => {
    data = data.detail;
    if (data.type === "remoteauth") {
      if (data.payload?.mode === "SF") {
        dispatch(setRemoteAuthMode(data.payload.mode));
      } else {
        dispatch(setRemoteAuthMode(null));
      }

      if (data.payload.remoteauth) {
        const outletID = data.payload.outledID;
        const outletState = chargerState.find(
          (o) => o.outlet == outletID && o.online
        );
        if (outletState) {
          localStorage.setItem("user", outletState.user);
          localStorage.setItem("selectedOutlet", outletState.outlet);
          dispatch(setSelectedState(outletState));
        }
        // handleClick("checkpoint");
      }
    }
  };

  const insertACSession = (user) => {
    addOrUpdateSessionToDb(
      selectedState.outlet,
      selectedState.user,
      selectedState.outletType,
      selectedState.timestamp,
      Date.now(),
      user,
      selectedState.EVRESSSOC,
      selectedState.EVRESSSOC,
      Date.now(),
      selectedState.curr_ses_Wh
    );
  };

  const handlePINSubmit = async () => {
    setWaitingForOcppMsg(true);
    await postOtp(currentPIN);
  };

  const postOtp = async (rfid) => {
    const chargingStore = store.getState();
    const { config, chargingMode } = chargingStore.charging;

    try {
      const endpoint =
        config?.comboMode && chargingMode > 0
          ? `${config.API}/services/rfid/v2/authdetails`
          : `${config.API}/services/rfid/idtag`;

      const payload =
        config?.comboMode && chargingMode > 0
          ? { idTAG: String(rfid), outletId: 0 }
          : { idTag: rfid };

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("OTP post failed", error);
    }
  };

  const handlePostOutletId = async (rfid) => {
    try {
      const chargingStore = store.getState();
      const { config } = chargingStore.charging;
      const localOutletId = localStorage.getItem("selectedOutlet");
      const outletState = chargerState.find(
        (state) => state.outlet == localOutletId
      );
      const outletId = Number(outletState?.outlet);
      await httpPost(
        `${config.API}/services/rfid/outletId`,
        JSON.stringify({ outletId }),
        "outlet id post"
      );
    } catch (error) {
      console.log(error);
    }
  };

  const setupWebSocket = useCallback(() => {
    const chargingStore = store.getState();
    const { config } = chargingStore.charging;

    const socket = new ReconnectingWebSocket(
      `${config.socketUrl}/services/rfid/idTag`
    );

    socket.onopen = () => {
      console.log("WebSocket connected.");
    };

    socket.onmessage = async (event) => {
      if (!event || !event.data || typeof event.data !== "string") return;
      try {
        await handlePostOutletId(event.data);
        setAllowToShowAlert(true);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket encountered an error:", error);
    };

    socket.onclose = (event) => {
      console.warn("WebSocket closed:", event);
    };

    return socket;
  }, [chargerState]);

  const setAutocharge = async () => {
    try {
      const chargingStore = store.getState();
      const { config } = chargingStore.charging;
      const response = await httpGet(`${config.API}/db/config`);
      setIsAutocharging(response?.autoChargeMode || false);
    } catch (error) {
      console.error("Failed to set autocharge:", error);
    }
    setTimeout(() => {
      setIsAutocharging(false);
      setAutochargeauth(false);
    }, 10000);
  };

  // useEffect(() => {
  //   let outputHand = isHandshaking(outlet)
  //   if (status === "auth" && isHandshaking(outlet)) {
  //     console.log(outputHand)
  //     handleClick("checkpoint");
  //   }
  // })

  useEffect(() => {
    let socketRef;

    const init = async () => {
      const chargingStore = store.getState();
      const api = chargingStore?.charging?.config?.API;

      await clearRfid(api);
      socketRef = setupWebSocket();
      window.addEventListener("auth-res", authResHandler);
      window.addEventListener("remoteauth", handleRemoteAuth);
      await fetchData(api, selectedState.outlet);
    };

    init();

    return () => {
      // Clean up WebSocket connection
      if (socketRef && socketRef.close) {
        socketRef.close();
        console.log("WebSocket closed on cleanup.");
      }
      // Remove custom event listeners
      window.removeEventListener("auth-res", authResHandler);
      window.removeEventListener("remoteauth", handleRemoteAuth);
    };
  }, [authResHandler, fetchData, selectedState, handleRemoteAuth]);

  useEffect(() => {
    setAutocharge();
  }, []);

  return (
    <Row>
      <Col span={24}>
        {isAutocharging && autochargeauth && (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <img
              src={autochargespin}
              alt="Auto Charging"
              width="200px"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(76%) sepia(23%) saturate(333%) hue-rotate(178deg) brightness(96%) contrast(89%)",
              }}
            />
            <div
              style={{
                color: theme === "dark" ? "white" : "black",
                fontSize: "20px",
                marginTop: "20px",
              }}
            >
              Attempting AutoCharge...
            </div>
          </div>
        )}

        {!isAutocharging && showAuthMode && (
          <>
            {config?.uiConfiguration?.otpEnable ? (
              <AuthMode outlet={outlet} handleClick={handleClick} />
            ) : (
              <>
                <Rfid status={status} eachOutlet={outlet} handleClick={handleClick} />

                {errorInRfid && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 10,
                    }}
                  >
                    <PlugEV errMsg="Wrong RFID. Please swipe correct RFID." />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Col>
    </Row>
  );
};

export default withTranslation()(AuthorizeEv);
