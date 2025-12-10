/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import { Row, Col, Button, Typography } from "antd";
import { withTranslation } from "react-i18next";

import MainContext from "../../providers/MainContext";
import { GunLetter } from "../../components/Charging/GunLetter";
import { ProgressPercentage } from "../../components/Charging/ProgressPercentage";
import Navbar from "../../components/navbar";
import DateBox from "../../components/DateBox";
import TimeoutRouter from "../../components/TimeoutRouter";

import {
  elapsedTime,
  randomBetween,
  secondsToHms,
  timestampToTime,
  getEmulatedMetering,
} from "../../utils";
import CarImage from "../../assets/images/ecog_car.svg";
import { GunLetters, max32BitInt, OutletType } from "../../constants/constants";
import { fetchSessionByOutletAndUser } from "../../localDb/dbActions";

import * as S from "./styles";

const { Title } = Typography;

class Charging extends Component {
  static contextType = MainContext;

  constructor(props) {
    super(props);
    this.state = {
      startPercentage: 0,
      sessionStart: null,
      background: null,
      stopChargerStatus: "",
      emulatedMetering: null
    };
  }

  takeToHome = () => {
    this.context.changePath("/");
  };

  handleStopButtonClick = () => {
    this.context.changePath("/stopcharging");
  };

  setBackground = () => {
    const { config } = this.context;
    const { chargingBackground } = config || {};
    const { images, changeRandomly } = chargingBackground || {};

    if (!Array.isArray(images) || images?.length <= 0) {
      return;
    }
    let idx = 0;
    if (changeRandomly) {
      idx = randomBetween(0, images.length - 1);
    }
    const background = images[idx];
    this.setState({ background });
    this.setBackgroundInterval();
  };

  setBackgroundInterval = () => {
    const { config } = this.context;
    const { chargingBackground } = config || {};
    const { changeFreqSec } = chargingBackground || {};

    let intervalMs = 4000;
    const maxSetIntervalSec = max32BitInt / 1000;
    if (changeFreqSec > 0 && changeFreqSec < maxSetIntervalSec) {
      intervalMs = changeFreqSec * 1000;
    }
    this.backgroundInterval = setInterval(this.changeBackground, intervalMs);
  };

  changeBackground = () => {
    const { config } = this.context;
    const { chargingBackground } = config || {};
    const { changeRandomly } = chargingBackground || {};

    if (changeRandomly) this.changeBackgroundRandom();
    else this.changeBackgroundInOrder();
  };

  changeBackgroundRandom = () => {
    const { background } = this.state;
    const { config } = this.context;
    const { chargingBackground } = config || {};
    const { images } = chargingBackground || {};

    let idx = randomBetween(0, images.length - 1);
    let newBackground = images[idx];
    while (newBackground === background) {
      idx = randomBetween(0, images.length - 1);
      newBackground = images[idx];
    }
    this.setState({ background: newBackground });
  };

  changeBackgroundInOrder = () => {
    const { background } = this.state;
    const { config } = this.context;
    const { chargingBackground } = config || {};
    const { images } = chargingBackground || {};

    let idx = images.indexOf(background);
    let nextIdx = idx + 1;
    if (nextIdx === images.length) {
      nextIdx = 0;
    }
    const nextBackground = images[nextIdx];
    this.setState({ background: nextBackground });
  };

  componentDidMount = async () => {
    this.setState({ stopChargerStatus: "STOP_CHARGING" });
    // this.state.await setEmulatedMetering();
    const emulatedmetering = await getEmulatedMetering(this.context.config?.API);
    this.setState({emulatedMetering : emulatedmetering})
    this.setBackground();
    const startDetails = await fetchSessionByOutletAndUser(
      this.context.selectedState?.outlet,
      this.context.selectedState?.user
    );
    const startPercentage = startDetails?.startPercentage;
    const sessionStart = startDetails?.sessionStart;
    this.setState({ startPercentage, sessionStart });

    if (this.context.config?.isRfidFlow) {
      if (this.context.shouldGoHomeOnSessionStart)
        this.context.setShouldGoHomeOnSessionStart(false);
    }
  };

  componentWillUnmount() {
    clearInterval(this.backgroundInterval);
  }

  render() {
    const chargerState = this.context.selectedState;
    if (!chargerState) {
      this.takeToHome();
      return <div />;
    }
    const isAC = !!chargerState && chargerState.outletType === OutletType.AC;
    const stopButtonText = this.context.t(this.state.stopChargerStatus);
    const cantStop =
      chargerState &&
      chargerState.phs &&
      chargerState.phs < 7 &&
      this.state.stopChargerStatus !== "STOPPING_THREEDOTS";
    const letter =
      chargerState && chargerState.outlet && GunLetters[chargerState?.index];

    let energyConsumed = chargerState?.curr_ses_Wh;
    if (!isAC && (energyConsumed || energyConsumed === 0)) {
      energyConsumed = energyConsumed / 1000;
    }
    energyConsumed = energyConsumed?.toFixed(3);
    const background = this.state.background;

    // const isSFForCurrentOutlet =
    //   this.context.chargingMode > 0 &&
    //   this.context.chargingMode == this.context.selectedState.index + 1;

    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter
              timeoutSec={context.config?.timeToGoScreensaverSec}
              routeTo="/screensaver"
            />
            <div style={S.ChargingPage(background)} data-testid="charging-page">
              <Navbar
                heading={context.t("CURRENT_SESSION_STATUS")}
                theme="light"
                transparent={!!background}
              />
              <Row style={S.Overlay}>
                <Col span={14} style={S.LeftCol}>
                  <Row style={S.GunLetterContainer}>
                    <GunLetter
                      letter={letter}
                      useQAsOutletID={context?.config?.useQAsOutletID}
                    />
                    {/* {isSFForCurrentOutlet && (
                      <Title style={S.ChargingInSFText}>
                        {context.t("CHARGING_IN_SF")}
                      </Title>
                    )} */}
                  </Row>
                  <Row style={S.ProgressColContainer}>
                    <Col span={5} style={S.ProgressCol}>
                      {!isAC && (
                        <ProgressPercentage
                          percent={chargerState && chargerState.EVRESSSOC}
                        />
                      )}
                    </Col>
                    <Col span={19} style={S.FullHeight}>
                      <Row style={S.FullHeight}>
                        <img
                          src={CarImage}
                          alt="car"
                          style={S.FullHeight}
                          data-testid="car-image"
                        />
                      </Row>
                    </Col>
                  </Row>
                  <Row style={{ height: "0" }}>
                    <Title style={S.ChargingText}>
                      {context.t("CHARGING_THREEDOTS")}
                    </Title>
                  </Row>
                  {context.config?.isRfidFlow && (
                    <Row>
                      <Title style={S.ToStopText}>
                        {context.t("RFID_OR_APP_TO_STOP")}
                      </Title>
                    </Row>
                  )}
                  {!context.config?.isRfidFlow && (
                    <Row style={S.ButtonsContainer}>
                      <Button
                        disabled={cantStop}
                        onClick={this.handleStopButtonClick}
                        style={S.StopButton(cantStop)}
                      >
                        {stopButtonText}
                      </Button>
                      <Button onClick={this.takeToHome} style={S.HomeButton}>
                        {context.t("GO_HOME")}
                      </Button>
                    </Row>
                  )}
                </Col>
                <Col span={10} style={S.RightCol}>
                  <Row style={S.SessionInfoTextsContainer}>
                    <p style={S.SessionInfoText}>
                      {context.t("START_TIME")}:{" "}
                      {timestampToTime(this.state.sessionStart, this?.context?.config?.timezone)}
                    </p>
                    {!isAC && (
                      <p style={S.SessionInfoText}>
                        {context.t("START_SOC")}:{" "}
                        {this.state.startPercentage?.toFixed(0)}%
                      </p>
                    )}
                    {!isAC && (
                      <p style={S.SessionInfoText}>
                        {context.t("TIME_ELAPSED")}:{" "}
                        {elapsedTime(chargerState.sessionStart)}
                      </p>
                    )}
                  </Row>
                  <Row style={S.SessionInfoTextsContainer}>
                    <p style={S.SessionInfoText}>
                      {context.t("VOLTAGE")}:{" "}
                      {chargerState?.dc_meter?.voltage !== undefined && !this.state.emulatedMetering
                        ? `${chargerState.dc_meter.voltage.toFixed(2)} V`
                        : chargerState?.pv !== undefined
                        ? `${chargerState.pv.toFixed(2)} V`
                        : "N/A"}
                    </p>

                    <p style={S.SessionInfoText}>
                      {context.t("CURRENT")}:{" "}
                      {chargerState?.dc_meter?.current !== undefined && !this.state.emulatedMetering
                        ? `${chargerState.dc_meter.current.toFixed(2)} A`
                        : chargerState?.pc !== undefined
                        ? `${chargerState.pc.toFixed(2)} A`
                        : "N/A"}
                    </p>
                    <p style={S.SessionInfoText}>
                      {context.t("POWER")}:{" "}
                      {chargerState?.dc_meter?.total_import_mains_power !== undefined && !this.state.emulatedMetering
                        ? `${chargerState.dc_meter.total_import_mains_power.toFixed(2)} kW`
                        : chargerState?.pp !== undefined
                        ? `${(chargerState.pp / 1000).toFixed(2)} kW`
                        : "N/A"}
                    </p>
                    <p style={S.SessionInfoText}>
                      {context.t("UNIT_CONSUMED")}:{" "}
                      {chargerState?.dc_meter?.total_import_device_energy !== undefined && !this.state.emulatedMetering
                        ? `${chargerState.dc_meter.total_import_device_energy.toFixed(2)} kWh`
                        : energyConsumed !== undefined
                        ? `${energyConsumed} kWh`
                        : "N/A"}
                    </p>
                  </Row>
                  {context.selectedState?.outletType !== "AC" && (
                    <Row style={S.SessionInfoTextsContainer}>
                      <p style={S.SessionInfoText}>
                        {context.t("DEMAND_VOLTAGE")}:{" "}
                        {!!chargerState &&
                          !!chargerState.tv &&
                          chargerState.tv.toFixed(2)}{" "}
                        V
                      </p>
                      <p style={S.SessionInfoText}>
                        {context.t("DEMAND_CURRENT")}:{" "}
                        {!!chargerState && chargerState.tc !== undefined ? (
                          <>{chargerState.tc.toFixed(2)} A </>
                        ) : (
                          "N/A"
                        )}
                      </p>
                      {!isAC && (
                      <p style={S.SessionInfoText}>
                        {context.t("TIME_TO_FULL_CHARGE")}:{" "}
                        {secondsToHms(chargerState.TimeToFull)}
                      </p>
                    )}
                    {isAC && (
                      <p style={S.SessionInfoText}>
                        {context.t("TIME_ELAPSED")}:{" "}
                        {secondsToHms(chargerState.curr_ses_secs)}
                      </p>
                    )}
                    </Row>
                  )}                  
                  <Row style={S.SessionInfoTextsContainer}>
                    <p style={S.SessionInfoText}>
                      <span>Gun DC+ Temp: {
                      (chargerState.outlet==1?
                        chargerState?.temperatures.hasOwnProperty('CCS_A1_temp')?
                        chargerState?.temperatures?.CCS_A1_temp.toFixed(1):"-":
                        chargerState?.temperatures.hasOwnProperty('CCS_B1_temp')?
                        chargerState?.temperatures?.CCS_B1_temp.toFixed(1):"-")
                      }{"°C"}</span>
                      <span style={S.SessionInfoText}>Inlet Temp: {chargerState.temperatures.outlet_temp?.toFixed(1)}°C</span>
                    </p>
                    <p style={S.SessionInfoText}>
                    <span>Gun DC- Temp: {
                      (chargerState.outlet==1?
                        chargerState?.temperatures.hasOwnProperty('CCS_A2_temp')?
                        chargerState?.temperatures?.CCS_A2_temp.toFixed(1):"-":
                        chargerState?.temperatures.hasOwnProperty('CCS_B2_temp')?
                        chargerState?.temperatures?.CCS_B2_temp.toFixed(1):"-")
                      }{"°C"}</span>
                      <span style={S.SessionInfoText}>Cabinet Temp: {chargerState.temperatures.cabinet_temp?.toFixed(1)}°C</span>
                    </p>
                  </Row>

                </Col>
              </Row>
            </div>
            <DateBox />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default withTranslation()(Charging);
