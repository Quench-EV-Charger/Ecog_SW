/* eslint eqeqeq: "off"*/
import React from "react";
import { Row } from "antd";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import TimeoutRouter from "../../components/TimeoutRouter";
import { CheckPoint } from "../../components/Checkpoints/Checkpoint";

import { deAuthorize, getCorrectOutletType, isFaulted } from "../../utils";
import { handleOutletSelect } from "../../helpers/RfidFlowHelpers";

import * as S from "./styles";

const COLORS = {
  WAITING: "white",
  PASSED: "#00B051",
  ERROR: "red",
};

// prettier-ignore
const CheckPointList = {
  CHECKPOINT_CHARGING_TYPE_SELECTED: "CHECKPOINT_CHARGING_TYPE_SELECTED", // Charging Type Selected - CCS
  CHECKPOINT_EV_DETECTED: "CHECKPOINT_EV_DETECTED", // EV Detected
  CHECKPOINT_EV_AUTHORIZED: "CHECKPOINT_EV_AUTHORIZED", // EV Authorized
  CHECKPOINT_EV_COMMUNICATION: "CHECKPOINT_EV_COMMUNICATION", // EV Communication
  CHECKPOINT_OCPP_COMMUNICATION: "CHECKPOINT_OCPP_COMMUNICATION", // OCPP Communication
  CHECKPOINT_CABLE_CHECK: "CHECKPOINT_CABLE_CHECK",   // Cable Check
  CHECKPOINT_PRE_CHARGING: "CHECKPOINT_PRE_CHARGING",   // Pre-Charging
  CHECKPOINT_CHARGING: "CHECKPOINT_CHARGING",   // Charging…
};

class CheckPoints extends React.Component {
  static contextType = MainContext;

  cableCheckV = "";
  preChargingV = "";
  faultedTimer = null;

  state = {
    isFaulted: false,
  };

  displayCableCheckV = () => {
    if (this.cableCheckV && typeof this.cableCheckV === "number") {
      return `${this.cableCheckV} V`;
    }
    return "";
  };
  displayPreChargingV = () => {
    if (this.preChargingV && typeof this.preChargingV === "number") {
      return `${this.preChargingV} V`;
    }
    return "";
  };
  handleVoltageAssignments = () => {
    const phs = this.context.selectedState?.phs;
    const displayedCableCheckV = Number(this.cableCheckV);
    const displayedPreChargingV = Number(this.preChargingV);
    const stateV = Number(this.context?.selectedState?.pv);
    if (displayedCableCheckV < stateV && phs === 4) {
      this.cableCheckV = Number(stateV?.toFixed(2));
    }
    if (displayedPreChargingV < stateV && phs === 5) {
      this.preChargingV = Number(stateV?.toFixed(2));
    }
  };
  getCableCheckColor = () => {
    const { selectedState } = this.context || {};
    const phs = selectedState?.phs;

    if (phs < 3) return COLORS.ERROR;
    else if (phs >= 3 && phs <= 4) return COLORS.WAITING;
    else if (phs > 4) return COLORS.PASSED;
    return COLORS.WAITING;
  };
  getPreChargeColor = () => {
    const { selectedState } = this.context || {};
    const phs = selectedState?.phs;

    if (phs < 3) return COLORS.ERROR;
    else if (phs >= 3 && phs <= 5) return COLORS.WAITING;
    else if (phs > 5) return COLORS.PASSED;
    return COLORS.WAITING;
  };
  getChargingColor = () => {
    const { selectedState } = this.context || {};
    const phs = selectedState?.phs;

    if (phs < 3) return COLORS.ERROR;
    else if (phs >= 3 && phs <= 6) return COLORS.WAITING;
    else if (phs === 7) return COLORS.PASSED;
    return COLORS.WAITING;
  };
  isEVDetected = () => {
    const { selectedState } = this.context || {};
    const pilot = selectedState?.pilot;
    return pilot >= 1 && pilot <= 4;
  };
  getChargingType = () => {
    const { t, selectedState } = this.context || {};
    const checkPoint = t(CheckPointList["CHECKPOINT_CHARGING_TYPE_SELECTED"]);
    const outletType = getCorrectOutletType(selectedState?.outletType);
    return `${checkPoint} - ${outletType}`;
  };
  isAuth = () => this.context.selectedState?.auth;
  isEVCommunicated = () => this.context.selectedState?.phs;

  componentDidUpdate(prevProps, prevState) {
    const { selectedState, changePath, config, preparingOutletsIds, chargerState, setSelectedState, setShouldGoHomeOnSessionStart } = this.context; // prettier-ignore

    if (selectedState?.needsUnplug && selectedState?.wasAuthorized) {
      console.log("checkpoints --> unplugev", selectedState);
      changePath("/unplugev");
      return;
    }

    if (
      typeof selectedState?.pilot === "number" &&
      selectedState?.pilot === 0
    ) {
      console.log("checkpoints --> home", selectedState);
      changePath("/");
      return;
    }

    if (selectedState)
      if (!prevState.isFaulted && this.state.isFaulted) {
        this.faultedTimer = setTimeout(() => {
          console.log(
            "going home because it is faulted in checkpoints",
            selectedState
          );
          deAuthorize(config?.API, selectedState);
          changePath("/");
        }, 35000);
      }

    if (
      isFaulted(selectedState) ||
      selectedState?.pilot <= 0 ||
      selectedState?.phs < 2
    ) {
      if (this.state.isFaulted) return;
      this.setState({ isFaulted: true });
    } else {
      clearTimeout(this.faultedTimer);
    }

    if (config?.isRfidFlow && selectedState.phs > 4) {
      // selectedState.phs > 4 -> if passed cable check
      const otherPreparingOutletId = preparingOutletsIds.find(
        (preparingOutletId) => preparingOutletId != selectedState?.outlet
      );
      if (otherPreparingOutletId) {
        const otherPreparingOutletState = chargerState.find(
          (a) => a.outlet == otherPreparingOutletId
        );
        handleOutletSelect(otherPreparingOutletState, setSelectedState);
        changePath("/authorize");
        setShouldGoHomeOnSessionStart(true);
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this.faultedTimer);
  }

  render() {
    this.handleVoltageAssignments();
    const outletType = this.context?.selectedState?.outletType;
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter />
            <Navbar
              heading={context.t("CHECKPOINTS_AND_STATUS")}
              theme="light"
            />
            <Row style={S.CheckPointsPage} data-testid="checkpoints-page">
              {/* CHARGING TYPE SELECTED */}
              <CheckPoint
                iconType="check"
                iconColor={COLORS.PASSED}
                text={this.getChargingType()}
                outletType={outletType}
              />
              {/* EV Detected */}
              <CheckPoint
                iconType={this.isEVDetected() ? "check" : "close"}
                iconColor={this.isEVDetected() ? COLORS.PASSED : COLORS.ERROR}
                text={context.t(CheckPointList["CHECKPOINT_EV_DETECTED"])}
                outletType={outletType}
              />
              {/* EV Authorized */}
              <CheckPoint
                iconType={this.isAuth() ? "check" : "close"}
                iconColor={this.isAuth() ? COLORS.PASSED : COLORS.ERROR}
                text={context.t(CheckPointList["CHECKPOINT_EV_AUTHORIZED"])}
                outletType={outletType}
              />
              {/* EV Communication */}
              <CheckPoint
                iconType={this.isEVCommunicated() ? "check" : "close"}
                iconColor={this.isEVCommunicated() ? COLORS.PASSED : COLORS.ERROR} // prettier-ignore
                text={context.t(CheckPointList["CHECKPOINT_EV_COMMUNICATION"])}
                outletType={outletType}
              />
              {/* OCPP Communication */}
              <CheckPoint
                iconType={context.ocppOnline ? "check" : "close"}
                iconColor={context.ocppOnline ? COLORS.PASSED : COLORS.ERROR}
                text={context.t(
                  CheckPointList["CHECKPOINT_OCPP_COMMUNICATION"]
                )}
                outletType={outletType}
              />
              {/* Cable Check */}
              <CheckPoint
                iconType={context.selectedState?.phs > 4 ? "check" : "close"}
                iconColor={this.getCableCheckColor()}
                text={`${context.t(CheckPointList["CHECKPOINT_CABLE_CHECK"])} ${this.displayCableCheckV()}`} // prettier-ignore
                outletType={outletType}
              />
              {/* Pre-Charge */}
              <CheckPoint
                iconType={context.selectedState?.phs > 5 ? "check" : "close"}
                iconColor={this.getPreChargeColor()}
                text={`${context.t(CheckPointList["CHECKPOINT_PRE_CHARGING"])} ${this.displayPreChargingV()}`} // prettier-ignore
                outletType={outletType}
              />
              {/* Charging */}
              <CheckPoint
                iconType={context.selectedState?.phs === 7 ? "check" : "close"}
                iconColor={this.getChargingColor()}
                text={context.t(CheckPointList["CHECKPOINT_CHARGING"])}
                outletType={outletType}
              />
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default CheckPoints;
