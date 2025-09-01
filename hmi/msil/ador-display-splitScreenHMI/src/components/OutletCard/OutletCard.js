import React, { useContext, useEffect, useState } from "react";
import * as S from "./style";
import gunIcon from "../../assets/icons/gun_icon.png";
import InitialState from "./InitialState/InitialState";
import ChargingState from "./ChargingState/ChargingState";
import Numpad from "./AuthState.js/Numpad/Numpad";
import Rfid from "./AuthState.js/RFID/Rfid";
import AuthMode from "./AuthState.js/AuthMode";
import { useTranslation } from "react-i18next";
import {
  checkErrors,
  getAllOutletsAsOutOfOrder,
  getState,
  getStatusText,
  timeout,
  inStoppingProccess,
  isNeedUnplug,
  deAuthorize,
  isHandshaking
} from "../../Utilis/UtilityFunction";
import AuthorizeEv from "./AuthState.js/AuthorizeEv";
import CheckPoints from "./CheckpointScreen/Checkpoints";
import ChargingComplete from "./ChargingComplete/ChargingComplete";
import PostCharging from "./PostCharging/PostCharging";
import SessionResult from "./SessionSummary/SessionResult";
import { useSelector, useDispatch } from "react-redux";
import {
  setEStopRoutingHandled,
  setPowerFailureRoutingHandled,
  setStoppingOutlet,
} from "../../redux/chargingSlice";
import useSessionDb from "../../LocalDB/useSessionDb";
import StopCharging from "./StopCharging/StopCharging";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

function OutletCard({ eachOutlet, status, onStatusChange }) {
  const dispatch = useDispatch();
  const { addOrUpdateSessionToDb } = useSessionDb();
  const [isTimeout, setIsTimeout] = useState(false)

  const Store = useSelector((state) => state.charging);
  const {
    // selectedState,
    config,
    preparingOutletsIds,
    setShouldGoHomeOnSessionStart,
    ocppOnline,
    powerFailureRoutingHandled,
    chargingMode,
    eStopRoutingHandled,
    chargerState,
    shouldGoHomeOnSessionStart,
    firstOutletIdToAllowAutoRoute
  } = Store;
  const { theme, toggleTheme } = useContext(ThemeContext);

  const { t } = useTranslation();
  const chargingStatus = getStatusText(eachOutlet, t).toLowerCase();

  const handleClick = (value) => {
    onStatusChange(value);
  };

  const fetchState = async () => {
    const isComboMode = config?.comboMode;
    const API = config?.API;
    // if (pathname === "/reboot") return; // prevent to see "No Charge Outlet Active" while rebooting

    try {
      parseChargingState();
      let chargerState = await timeout(5000, getState(API));
      if (!chargerState) chargerState = [];
      if (!Array.isArray(chargerState)) chargerState = [chargerState];
      chargerState = chargerState.map((outletState, index) => ({
        ...outletState,
        index,
      }));

      const errorObj = checkErrors(chargerState, chargingMode, isComboMode); // prettier-ignore
      const { showAlert, showEStop, errorCode } = errorObj || {};
      const needsEStopRouting = showEStop && eStopRoutingHandled;
      if (needsEStopRouting) {
        if (status === "sessionresult") handleClick("initial");
        else if (status !== "initial") handleClick("unplug");
        dispatch(setEStopRoutingHandled(true));
      }
      if (!showEStop && eStopRoutingHandled) {
        dispatch(setEStopRoutingHandled(false));
      }

      const needsPowerFailureRouting = errorCode === "powerloss" && powerFailureRoutingHandled;
      if (needsPowerFailureRouting) {
        if (status === "sessionresult") handleClick("initial");
        else if (status !== "initial") handleClick("unplug");
        dispatch(setPowerFailureRoutingHandled(true));
      }
      if (errorCode !== "powerloss" && powerFailureRoutingHandled) {
        dispatch(setPowerFailureRoutingHandled(false));
      }

      if (errorCode === "powerloss" || errorCode === "emergency") {
        chargerState = getAllOutletsAsOutOfOrder(chargerState);
      }
    } catch (err) {
      console.error("Error on state polling:", err);
    }
  };

  const parseChargingState = async () => {
    if (!eachOutlet) return;

    // const {
    //   // selectedState,
    //   chargerState,
    //   config,
    // } = this.state;
    const { pilot, auth, phs, user, evsestat } = eachOutlet;
    // const { pathname } = this.props.location;

    const stoppingOutlet = chargerState.find((state) =>
      inStoppingProccess(state)
    );
    if (stoppingOutlet && stoppingOutlet.outlet === eachOutlet.outlet && status !== "stopcharging" && firstOutletIdToAllowAutoRoute) {
      const outletStateToSet = chargerState.find(
        (o) => o.outlet == firstOutletIdToAllowAutoRoute
      );
      addOrUpdateSessionToDb(
        outletStateToSet?.outlet,
        outletStateToSet?.user,
        outletStateToSet?.outletType,
        outletStateToSet?.timestamp,
        outletStateToSet?.sessionStart,
        outletStateToSet?.EVRESSSOC,
        outletStateToSet?.EVRESSSOC,
        Date.now(),
        outletStateToSet?.curr_ses_Wh,
      );
      localStorage.setItem("user", outletStateToSet?.user);
      localStorage.setItem("selectedOutlet", outletStateToSet?.outlet);
      // this.setState({ selectedState: outletStateToSet });
      // handleClick("stopcharging");
    }
    if (status === "stopcharging" && !inStoppingProccess(eachOutlet)) {
      if (isNeedUnplug(eachOutlet)) {
        handleClick("unplug");
      }
    }

    if (status === "auth" && pilot === 0) {
      handleClick("plugev");
    } else if (status === "charging" && pilot === 0) {
      handleClick("sessionresult");
    } else if (status === "charging" && (evsestat === 5 || pilot === 7)) {
      handleClick("sessionresult");
    } else if (
      !inStoppingProccess(eachOutlet) &&
      isNeedUnplug(eachOutlet) &&
      status !== "unplug"
    ) {
      if (status === "auth") {
        handleClick('unplug')
        setIsTimeout(true)
        // this.state.changePath(/unplugev?isTimeout=${true}); Need to be checked 
        deAuthorize(config?.API, eachOutlet);
      } else if (status === "plugev" || status === "charging") {
        handleClick("unplug");
      }
    } else if (
      !inStoppingProccess(eachOutlet) &&
      !isNeedUnplug(eachOutlet) &&
      !status.includes("sessionresult") &&
      status === "unplug"
    ) {
      if (isTimeout) {
        handleClick("initial");
      } else {
        handleClick("sessionresult");
      }
    } else if (
      !inStoppingProccess(eachOutlet) &&
      !isNeedUnplug(eachOutlet) &&
      !status.includes("sessionresult") &&
      status === "charging" &&
      pilot < 3 &&
      phs < 3
    ) {
      handleClick('sessionresult');
    } else if (status === "plugev" && pilot >= 1 && pilot <= 4 && !auth) {
      handleClick("auth");
    } else if (
      status === "checkpoints" &&
      pilot >= 3 &&
      pilot <= 4 &&
      phs >= 7
    ) {
      if (
        shouldGoHomeOnSessionStart &&
        config?.isRfidFlow
      ) {
        handleClick("initail");
      } else {
        handleClick("charging");
      }
    } else if (status === "auth" && isHandshaking(eachOutlet)) {
      handleClick("checkpoint");
    } 
    // else if (pathname === "/remoteauth" && isHandshaking(eachOutlet)) {
    //   handleClick("checkpoint");
    // }

    dispatch(setStoppingOutlet(!!stoppingOutlet))
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1000); // Poll every 5 sec
    return () => clearInterval(interval);
  }, [Store]);

  return (
    <div style={S.boxStyle(theme)}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img style={S.gun_icon} src={gunIcon} alt="" />
          <span style={S.gun_heading(theme)}>
            GUN {eachOutlet.outlet} - {eachOutlet.outletType}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "row-reverse" }}>
          <span style={S.getSOCStyle(chargingStatus)}>
            {getStatusText(eachOutlet, t)}
          </span>
        </div>
      </div>

      <div>
        {status === "initial" && (
          <InitialState eachOutlet={eachOutlet} handleClick={handleClick} chargingStatus={chargingStatus}/>
        )}
        {status === "auth" && (
          <AuthorizeEv status={status} outlet={eachOutlet} handleClick={handleClick} />
        )}
        {status === "otp" && (
          <Numpad outlet={eachOutlet} handleClick={handleClick} />
        )}
        {status === "rfid" && (
          <Rfid eachOutlet={eachOutlet} handleClick={handleClick} />
        )}
        {status === "checkpoint" && (
          <CheckPoints
            selectedOutlet={eachOutlet}
            config={config}
            preparingOutletsIds={preparingOutletsIds}
            chargerState={chargerState}
            ocppOnline={ocppOnline}
            setShouldGoHomeOnSessionStart={setShouldGoHomeOnSessionStart}
            handleClick={handleClick}
          />
        )}
        {status === "charging" && <ChargingState eachOutlet={eachOutlet}  handleClick={handleClick}/>}
        {status === "stopcharging" && <StopCharging eachOutlet={eachOutlet} handleClick={handleClick} />}
        {status === "stopcharger" && <PostCharging eachOutlet={eachOutlet} handleClick={handleClick} />}
        {status === "unplug" && <ChargingComplete eachOutlet={eachOutlet} handleClick={handleClick} status={status}/>}
        {status === "sessionresult" && <SessionResult outlet={eachOutlet}  handleClick={handleClick} />}
      </div>
    </div>
  );
}

export default OutletCard;
