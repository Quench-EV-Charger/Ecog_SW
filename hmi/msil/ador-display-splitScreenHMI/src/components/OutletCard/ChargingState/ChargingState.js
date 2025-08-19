import React, { useContext, useEffect, useState } from "react";
import stopIcon from "../../../assets/icons/stop_icon.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBatteryFull,
  faBolt,
  faPlug,
  faClock,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import * as S from "./styles";
import {
  elapsedTime,
  inStoppingProccess,
  isActive,
  isDisabled,
  isNeedUnplug,
  isPreparingBothVCCU,
  secondsToHms,
  timestampToTime,
} from "../../../Utilis/UtilityFunction";
import { useSelector } from "react-redux";
import { OutletType } from "../../../constants/constants";
import useSessionDb from "../../../LocalDB/useSessionDb";
import { ThemeContext } from "../../ThemeContext/ThemeProvider";

function ChargingState({ handleClick, eachOutlet }) {
  const [chargingStats, setChargingStats] = useState({});
  const [isCharging, setIsCharging] = useState(true);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const store = useSelector((state) => state.charging);
  const { chargingMode } = store;
  const [sessionStart, setSessionStart] = useState(null);
  const { fetchSessionByOutletAndUser } = useSessionDb();
  const { theme, toggleTheme } = useContext(ThemeContext);




  useEffect(() => {
    const intervalId = setInterval(() => {
      if (eachOutlet) {
        if(inStoppingProccess(eachOutlet)){
          handleClick('stopcharger')
        }
        const updatedBatteryLevel = eachOutlet.EVRESSSOC ? +eachOutlet.EVRESSSOC.toFixed(0) : 0;
        const updatedPowerUtilizing = eachOutlet.pp ? (eachOutlet.pp / 1000).toFixed(2) + " kW" : 'N/A';

        let updatedEnergyConsumed = eachOutlet?.curr_ses_Wh;
        const isAC = eachOutlet?.outletType === OutletType.AC;
        if (!isAC && (updatedEnergyConsumed || updatedEnergyConsumed === 0)) {
          updatedEnergyConsumed = updatedEnergyConsumed / 1000;
        }
        updatedEnergyConsumed = updatedEnergyConsumed?.toFixed(3);
        const updatedEnergySupplied = updatedEnergyConsumed + " kWh";

        const updatedVoltageSupply = eachOutlet.pv !== undefined ? eachOutlet.pv.toFixed(2) + " V" : "N/A";
        const updatedCurrentSupply = eachOutlet.pc !== undefined ? eachOutlet.pc.toFixed(2) + " A" : "N/A";
        const updatedTimeElapsed = elapsedTime(eachOutlet.sessionStart);
        const updatedCurrentDemand = eachOutlet.tc !== undefined ? eachOutlet.tc.toFixed(2) + " A" : "N/A";
        const updatedVoltageDemand = eachOutlet.tv !== undefined ? eachOutlet.tv.toFixed(2) + " V" : "N/A";

        const updatedTemperatureGunDCMinus = (
          eachOutlet.outlet == 1
            ? eachOutlet?.temperatures?.CCS_A2_temp?.toFixed(1)
            : eachOutlet?.temperatures?.CCS_B2_temp?.toFixed(1)
        ) + "°C" || "-";

        const updatedTemperatureGunDCPlus = (
          eachOutlet.outlet == 1
            ? eachOutlet?.temperatures?.CCS_A1_temp?.toFixed(1)
            : eachOutlet?.temperatures?.CCS_B1_temp?.toFixed(1)
        ) + "°C" || "-";

        const updatedTemperatureCabinet = eachOutlet?.temperatures?.cabinet_temp?.toFixed(1) + "°C" || "-";
        const updatedTemperatureInlet = eachOutlet?.temperatures?.outlet_temp?.toFixed(1) + "°C" || "-";

        setChargingStats({
          batteryLevel: updatedBatteryLevel,
          powerUtilizing: updatedPowerUtilizing,
          energySupplied: updatedEnergySupplied,
          voltageSupply: updatedVoltageSupply,
          currentSupply: updatedCurrentSupply,
          timeElapsed: updatedTimeElapsed,
          currentDemand: updatedCurrentDemand,
          voltageDemand: updatedVoltageDemand,
          temperatureGunDCMinus: updatedTemperatureGunDCMinus,
          temperatureGunDCPlus: updatedTemperatureGunDCPlus,
          temperatureCabinet: updatedTemperatureCabinet,
          temperatureInlet: updatedTemperatureInlet,
        });
      }
    }, 1); // every 5 seconds

    return () => clearInterval(intervalId);
  }, [eachOutlet]);

  useEffect(() => {
    const fetchStartDetails = async () => {
      if (eachOutlet?.outlet && eachOutlet?.user) {
        const startDetails = await fetchSessionByOutletAndUser(
          eachOutlet.outlet,
          eachOutlet.user
        );
        // const startPercentage = startDetails?.startPercentage;
        setSessionStart(startDetails?.sessionStart)
      }
    };
    fetchStartDetails();
  }, [eachOutlet]);

    const {
    batteryLevel,
    powerUtilizing,
    energySupplied,
    voltageSupply,
    currentSupply,
    timeElapsed,
    currentDemand,
    voltageDemand,
    temperatureGunDCMinus,
    temperatureGunDCPlus,
    temperatureCabinet,
    temperatureInlet,
  } = chargingStats;

  const handleStopClick = () => {
    setIsCharging(false);
    proceedWithClick();
  };

  const proceedWithClick = () => {
    const { pilot, auth, outlet, user } = eachOutlet;

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
      } else if (pilot >= 1 && pilot <= 2 && !auth) {
        handleClick("auth");
      } else {
        // setShowPlugAlert(true);
        // setTimeout(() => setShowPlugAlert(false), 5000);
      }
    }
  };

  const handleMoreDetailClick = () => {
    setShowMoreDetails((prev) => !prev);
  };

  const transitionStyle = {
    transition: "all 0.4s ease-in-out",
    opacity: 1,
    transform: "translateY(0px)",
  };

  const hiddenStyle = {
    opacity: 0,
    transform: "translateY(20px)",
    position: "absolute",
    pointerEvents: "none",
  };

  return (
    <S.Container style={{ position: "relative" }}>
      <S.ButtonWrapper>
        <S.StopButton onClick={handleStopClick}>
          <img src={stopIcon} alt="stop-icon" />
          STOP
        </S.StopButton>
      </S.ButtonWrapper>

      <div
        style={{
          ...(!showMoreDetails ? transitionStyle : hiddenStyle),
          width: "100%",
        }}
      >
        <S.InfoWrapper>
          <S.InfoCardBattery>
            <h3 style={{ display: "flex", alignItems: "center", color: theme === "dark" ? "white" : "black" }}>
              <FontAwesomeIcon
                icon={faBatteryFull}
                style={{
                  color: "green",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Battery Level
            </h3>
            <S.ProgressBarContainer>
              <S.ProgressBarFill style={{ width: `${batteryLevel}%` }} />
              <S.BatteryText>{batteryLevel}%</S.BatteryText>
            </S.ProgressBarContainer>
          </S.InfoCardBattery>

          <S.InfoCard>
            <h3 style={{ display: "flex", alignItems: "center", color: theme === "dark" ? "white" : "black" }}>
              <FontAwesomeIcon
                icon={faBolt}
                style={{
                  color: "red",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Power Utilising
            </h3>
            <p style={{color: theme === "dark" ? "white" : "black"}}>{powerUtilizing}</p>
          </S.InfoCard>

          <S.InfoCard>
            <h3 style={{ display: "flex", alignItems: "center", color: theme === "dark" ? "white" : "black" }}>
              <FontAwesomeIcon
                icon={faPlug}
                style={{
                  color: "blue",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Energy Supplied
            </h3>
            <p style={{color: theme === "dark" ? "white" : "black"}}>{energySupplied}</p>
          </S.InfoCard>

          <S.InfoCard>
            <h3 style={{ display: "flex", alignItems: "center", color: theme === "dark" ? "white" : "black" }}>
              <FontAwesomeIcon
                icon={faClock}
                style={{
                  color: "gray",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Time Elapsed
            </h3>
            <p style={{color: theme === "dark" ? "white" : "black"}}>{timeElapsed}</p>
          </S.InfoCard>
        </S.InfoWrapper>
      </div>

      <div
        style={{
          ...(showMoreDetails ? transitionStyle : hiddenStyle),
          width: "100%",
        }}
      >
        <S.InfoWrapper>
          {/* Current */}
          <S.InfoCard>
            <h3 style={{color: theme ==="dark" ? "white" : "black",}}>
              <FontAwesomeIcon
                icon={faBolt}
                style={{
                  color: "#ff4500",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Current
            </h3>
            <S.InfoRowGrid>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Demand</strong>
                <span>{currentDemand}</span>
              </span>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Supply</strong>
                <span>{currentSupply}</span>
              </span>
            </S.InfoRowGrid>
          </S.InfoCard>

          <S.InfoCard>
            <h3 style={{color: theme ==="dark" ? "white" : "black",}}>
              <FontAwesomeIcon
                icon={faPlug}
                style={{
                  color: "#1e90ff",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Voltage
            </h3>
            <S.InfoRowGrid>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Demand</strong>
                <span>{voltageDemand}</span>
              </span>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Supply</strong>
                <span>{voltageSupply}</span>
              </span>
            </S.InfoRowGrid>
          </S.InfoCard>

          <S.InfoCard>
            <h3 style={{color: theme ==="dark" ? "white" : "black",}}>
              <FontAwesomeIcon
                icon={faClock}
                style={{ color: "gray", fontSize: "24px", marginRight: "8px" }}
              />
              Time
            </h3>
            <S.InfoRowGrid>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Start</strong>
                <span>{timestampToTime(sessionStart, store?.config?.timezone)}</span>
              </span>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Remaining</strong>
                <span>{secondsToHms(eachOutlet.TimeToFull)}</span>
              </span>
            </S.InfoRowGrid>
          </S.InfoCard>

          <S.InfoCard>
            <h3 style={{color: theme ==="dark" ? "white" : "black",}}>
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{
                  color: "#ffa500",
                  fontSize: "24px",
                  marginRight: "8px",
                }}
              />
              Temperature
            </h3>
            <S.InfoRowGrid>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Gun DC-</strong>
                <span>{temperatureGunDCMinus}</span>
              </span>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Gun DC+</strong>
                <span>{temperatureGunDCPlus}</span>
              </span>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Cabinet</strong>
                <span>{temperatureCabinet}</span>
              </span>
              <span style={{color: theme ==="dark" ? "white" : "black",}}>
                <strong>Inlet</strong>
                <span>{temperatureInlet}</span>
              </span>
            </S.InfoRowGrid>
          </S.InfoCard>
        </S.InfoWrapper>
      </div>

      <div
        style={{
          position: "absolute",
          top: "310px",
          right: "10px",
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <S.ButtonFixedRight>
          <S.MoreDetailsButton onClick={handleMoreDetailClick}>
            <FontAwesomeIcon
              icon={faCircleInfo}
              style={{ marginRight: "6px" }}
            />
            {showMoreDetails ? "Less" : "More"} Details
          </S.MoreDetailsButton>
        </S.ButtonFixedRight>
      </div>
    </S.Container>
  );
}

export default ChargingState;
