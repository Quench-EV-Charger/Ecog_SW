import React, { useEffect, useState, useRef } from "react";
import { Row } from "antd";
import { CheckPoint } from "./Checkpoint";
import {
  deAuthorize,
  getCorrectOutletType,
  isFaulted,
} from "../../../Utilis/UtilityFunction";
import * as S from "./Styles";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

const COLORS = {
  WAITING: "white",
  PASSED: "#00B051",
  ERROR: "red",
};

const ICONS = {
  [COLORS.PASSED]: "check",
  [COLORS.ERROR]: "close",
  [COLORS.WAITING]: "loading", // ⏳ spinner or custom
};

const CheckPointList = {
  CHECKPOINT_CHARGING_TYPE_SELECTED: "CHECKPOINT_CHARGING_TYPE_SELECTED",
  CHECKPOINT_EV_DETECTED: "CHECKPOINT_EV_DETECTED",
  CHECKPOINT_EV_AUTHORIZED: "CHECKPOINT_EV_AUTHORIZED",
  CHECKPOINT_EV_COMMUNICATION: "CHECKPOINT_EV_COMMUNICATION",
  CHECKPOINT_OCPP_COMMUNICATION: "CHECKPOINT_OCPP_COMMUNICATION",
  CHECKPOINT_CABLE_CHECK: "CHECKPOINT_CABLE_CHECK",
  CHECKPOINT_PRE_CHARGING: "CHECKPOINT_PRE_CHARGING",
  CHECKPOINT_CHARGING: "CHECKPOINT_CHARGING",
};

const CheckPoints = (props) => {
  const { t } = useTranslation();

  const {
    selectedOutlet,
    config,
    preparingOutletsIds,
    chargerState,
    setShouldGoHomeOnSessionStart,
    ocppOnline,
    handleClick,
  } = props;

  const [isFaultedState, setIsFaultedState] = useState(false);
  const faultedTimer = useRef(null);
  const cableCheckV = useRef("");
  const preChargingV = useRef("");
  const [currentStep, setCurrentStep] = useState(0);
  const hasStartedCharging = useRef(false);
  const myOutlet = useSelector((state) =>
    state.charging.chargerState.find((a) => a.outlet === selectedOutlet.outlet)
  );

  const handleVoltageAssignments = () => {
    const phs = myOutlet?.phs;
    const displayedCableCheckV = Number(cableCheckV.current);
    const displayedPreChargingV = Number(preChargingV.current);
    const stateV = Number(myOutlet?.pv);

    if (displayedCableCheckV < stateV && phs === 4) {
      cableCheckV.current = Number(stateV?.toFixed(2));
    }
    if (displayedPreChargingV < stateV && phs === 5) {
      preChargingV.current = Number(stateV?.toFixed(2));
    }
  };

  const displayCableCheckV = () =>
    typeof cableCheckV.current === "number" ? `${cableCheckV.current} V` : "";

  const displayPreChargingV = () =>
    typeof preChargingV.current === "number" ? `${preChargingV.current} V` : "";

  const getCableCheckColor = () => {
    const phs = myOutlet?.phs;
    if (phs < 3) return COLORS.ERROR;
    if (phs >= 3 && phs <= 4) return COLORS.WAITING;
    if (phs > 4) return COLORS.PASSED;
    return COLORS.WAITING;
  };

  const getPreChargeColor = () => {
    const phs = myOutlet?.phs;
    if (phs < 3) return COLORS.ERROR;
    if (phs >= 3 && phs <= 5) return COLORS.WAITING;
    if (phs > 5) return COLORS.PASSED;
    return COLORS.WAITING;
  };

  const getChargingColor = () => {
    const phs = myOutlet?.phs;
    if (phs < 3) return COLORS.ERROR;
    if (phs >= 3 && phs <= 6) return COLORS.WAITING;
    if (phs === 7) return COLORS.PASSED;
    return COLORS.WAITING;
  };

  const isEVDetected = () => {
    const pilot = myOutlet?.pilot;
    return pilot >= 1 && pilot <= 4;
  };

  const getChargingType = () => {
    const checkPoint = t(CheckPointList["CHECKPOINT_CHARGING_TYPE_SELECTED"]);
    const outletType = getCorrectOutletType(myOutlet?.outletType);
    return `${checkPoint} - ${outletType}`;
  };

  const isAuth = () => myOutlet?.auth;
  const isEVCommunicated = () => myOutlet?.phs;

  const outletType = myOutlet?.outletType;

  const getIconTypeFromColor = (color) => ICONS[color] || "loading";

  const steps = [
    {
      iconColor: COLORS.PASSED,
      iconType: getIconTypeFromColor(COLORS.PASSED),
      text: getChargingType(),
    },
    {
      iconColor: isEVDetected() ? COLORS.PASSED : COLORS.ERROR,
      iconType: getIconTypeFromColor(
        isEVDetected() ? COLORS.PASSED : COLORS.ERROR
      ),
      text: t(CheckPointList["CHECKPOINT_EV_DETECTED"]),
    },
    {
      iconColor: isAuth() ? COLORS.PASSED : COLORS.ERROR,
      iconType: getIconTypeFromColor(isAuth() ? COLORS.PASSED : COLORS.ERROR),
      text: t(CheckPointList["CHECKPOINT_EV_AUTHORIZED"]),
    },
    {
      iconColor: isEVCommunicated() ? COLORS.PASSED : COLORS.ERROR,
      iconType: getIconTypeFromColor(
        isEVCommunicated() ? COLORS.PASSED : COLORS.ERROR
      ),
      text: t(CheckPointList["CHECKPOINT_EV_COMMUNICATION"]),
    },
    {
      iconColor: ocppOnline ? COLORS.PASSED : COLORS.ERROR,
      iconType: getIconTypeFromColor(ocppOnline ? COLORS.PASSED : COLORS.ERROR),
      text: t(CheckPointList["CHECKPOINT_OCPP_COMMUNICATION"]),
    },
    {
      iconColor: getCableCheckColor(),
      iconType: getIconTypeFromColor(getCableCheckColor()),
      text: `${t(
        CheckPointList["CHECKPOINT_CABLE_CHECK"]
      )} ${displayCableCheckV()}`,
    },
    {
      iconColor: getPreChargeColor(),
      iconType: getIconTypeFromColor(getPreChargeColor()),
      text: `${t(
        CheckPointList["CHECKPOINT_PRE_CHARGING"]
      )} ${displayPreChargingV()}`,
    },
    {
      iconColor: getChargingColor(),
      iconType: getIconTypeFromColor(getChargingColor()),
      text: t(CheckPointList["CHECKPOINT_CHARGING"]),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length) return prev + 1;
  
        clearInterval(interval);
  
        const keys = Object.keys(CheckPointList);
        const result = {};
        keys.forEach((key, index) => {
          const step = steps[index];
          if (step) {
            result[key] = step.iconType === "check";
          }
        });
  
        const resultWithoutOcpp = { ...result };
        delete resultWithoutOcpp["CHECKPOINT_OCPP_COMMUNICATION"];
  
        const allRequiredPassed = Object.values(resultWithoutOcpp).every(
          (val) => val === true
        );
  
        if (allRequiredPassed) {
          hasStartedCharging.current = true; // ✅ Mark charging as started
          handleClick("charging");
        } else {
          const hasWaitingStep = steps.some(
            (step, index) =>
              index <= currentStep && step.iconColor === COLORS.WAITING
          );
  
          if (hasWaitingStep) {
            setTimeout(() => {
              if (!hasStartedCharging.current) {
                handleClick("unplug");
              }
            }, 30000); // ⏳ Only unplug if not started charging
          } else {
            handleClick("unplug");
          }
        }
  
        return prev;
      });
    }, 600);
  
    return () => clearInterval(interval);
  }, [steps, handleClick, currentStep]);

  useEffect(() => {
    handleVoltageAssignments();
    if (myOutlet?.needsUnplug) {
      handleClick("unplug");
      return;
    }

    if (typeof myOutlet?.pilot === "number" && myOutlet?.pilot === 0) {
      handleClick("initial");
      return;
    }

    if (isFaulted(myOutlet) || myOutlet?.pilot <= 0 || myOutlet?.phs < 2) {
      if (!isFaultedState) setIsFaultedState(true);
    } else {
      clearTimeout(faultedTimer.current);
    }

    if (isFaultedState) {
      faultedTimer.current = setTimeout(() => {
        deAuthorize(config?.API, myOutlet);
        handleClick("initial");
      }, 35000);
    }

    if (config?.isRfidFlow && myOutlet?.phs > 4) {
      const otherPreparingOutletId = preparingOutletsIds.find(
        (id) => id !== myOutlet?.outlet
      );
      if (otherPreparingOutletId) {
        const otherPreparingOutletState = chargerState.find(
          (a) => a.outlet === otherPreparingOutletId
        );
        handleClick("auth");
        setShouldGoHomeOnSessionStart(true);
      }
    }

    return () => clearTimeout(faultedTimer.current);
  }, [
    myOutlet,
    isFaultedState,
    config,
    chargerState,
    preparingOutletsIds,
    handleClick,
  ]);

  return (
    <Row style={S.CheckPointsPage} data-testid="checkpoints-page">
      {steps.map((step, index) =>
        index <= currentStep ? (
          <CheckPoint
            key={index}
            iconType={step.iconType}
            iconColor={step.iconColor}
            text={step.text}
            outletType={outletType}
          />
        ) : null
      )}
    </Row>
  );
};

export default CheckPoints;
