import React from "react";
import { Row, Col } from "antd";
import { Trans } from "react-i18next";
import ReconnectingWebSocket from "reconnecting-websocket";

import MainContext from "../../providers/MainContext";
import TimeoutRouter from "../../components/TimeoutRouter";
import Spinner from "../../components/Spinner";
import DateBox from "../../components/DateBox";
import AlertBox from "../../components/AlertBox";
import Navbar from "../../components/navbar";
import Numpad from "../../components/AuthEV/Numpad";

import { clearRfid, stopCharging ,getallCapsIdTag} from "../../utils";
import ScanRfid from "../../assets/images/scan_rfid.svg";

import * as S from "./styles";

class StopCharging extends React.Component {
  static contextType = MainContext;

  socket = null;

  state = {
    currentPIN: "",
    errorInPIN: false,
    errorInRfid: false,
    isButtonDisabled: false,
    spinnerShown: false,
    nullRfidSent: false,
  };

  showRfidError = () => this.setState({ errorInRfid: true });
  hideRfidError = () => this.setState({ errorInRfid: false });
  setCurrentPIN = (currentPIN) => this.setState({ currentPIN });
  setErrorInPIN = () => this.setState({ errorInPIN: true });
  hidePINError = () => this.setState({ errorInPIN: false, currentPIN: "" });

  isEnterKey = (buttons, index) => index === buttons.length - 1;

  isEnterButtonDisabled = (buttons, index) => {
    if (this.isEnterKey(buttons, index)) {
      return this.state.currentPIN.length !== 4;
    }
  };

  handlePINClick = (buttonValue) => {
    if (this.state.isButtonDisabled) return;
    let newPIN = this.state.currentPIN.slice();
    if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(buttonValue)) {
      if (this.state.currentPIN.length === 4) {
        return;
      } else {
        newPIN = `${newPIN}${buttonValue}`;
        this.setState({ currentPIN: newPIN, isButtonDisabled: true });
        setTimeout(() => this.setState({ isButtonDisabled: false }), 250);
        return;
      }
    } else if (buttonValue === "BACK") {
      newPIN = newPIN.slice(0, newPIN.length - 1);
    } else if (buttonValue === "ENTER") {
      this.handlePINSubmit();
    }
    this.setCurrentPIN(newPIN);
  };

  stopCharging = async () => {
    const API = this.context.config?.API;
    const { selectedState, chargingMode, ipcClient } = this.context;
    const { user, outlet } = selectedState;
    console.log(selectedState);
    //Trigger event:
    const id = Date.now();
    const type = "charging-operation";
    if( chargingMode > 0){
      await stopCharging(API, user, 1);
      await stopCharging(API, user, 2);
      var payload = {"stopReason":"Local", "outletId":1};
      var message = JSON.stringify({ id, type, payload });
      ipcClient.publish("hmi", message);
      console.log("HMI Stop published", message);
      payload = {"stopReason":"Local", "outletId":2};
      message = JSON.stringify({ id, type, payload });
      ipcClient.publish("hmi", message);
      console.log("HMI Stop published", message);
    }else{
      await stopCharging(API, user, outlet);
      const payload = {"stopReason":"Local", "outletId":outlet};
      const message = JSON.stringify({ id, type, payload });
      ipcClient.publish("hmi", message);
      console.log("HMI Stop published", message);
    }
    this.setState({ spinnerShown: true });
  };

  handlePINSubmit = () => {
    const { currentPIN } = this.state;
    const { selectedState,ipcClient } = this.context;
    const { outlet } = selectedState;
    const currentUser = selectedState.user;
    if (currentUser?.includes(currentPIN)) {
      this.stopCharging();
    } else {
      let data = {
        type: "hmi#idTag-error",
        payload: {
          idTag: currentPIN,
          outletId: outlet,
        },
      };
      ipcClient.publish("hmi", JSON.stringify(data));
      this.setErrorInPIN();
    }
  };

  handleRFIDSubmit = (rfid) => {
    const API = this.context.config?.API;
    const { currentPIN } = this.state;
    const { selectedState,ipcClient } = this.context;
    const currentUser = selectedState.user;
    const { outlet } = selectedState;
    if (getallCapsIdTag(API)){
      // Convert both to lowercase for case-insensitive comparison
      const lowercaseRfid = rfid.toLowerCase();
      if (currentUser?.toLowerCase().includes(lowercaseRfid)) {
        console.log(currentUser?.toLowerCase().includes(lowercaseRfid));
        this.stopCharging();
      } else {
        let data = {
        type: "hmi#idTag-error",
        payload: {
          idTag: currentPIN,
          outletId: outlet,
        },
      };
      ipcClient.publish("hmi", JSON.stringify(data));
      this.showRfidError();
      }
    }
    else{
      if (currentUser?.includes(rfid)) {
        this.stopCharging();
      } else {
        this.showRfidError();
      }
    }    
  };

  setupWebSocket = () => {
    const { config } = this.context;
    const socketEndpoint = `${config.socketUrl}/services/rfid/idTag`;
    this.socket = new ReconnectingWebSocket(socketEndpoint);
    this.socket.onmessage = async (event) => {
      if (this.state.nullRfidSent) return; // prevent edge-case (after sending null rfid, prevent to receive it and post again)
      this.handleRFIDSubmit(event.data);
      clearRfid(config?.API);
      this.setState({ nullRfidSent: true });
      setTimeout(() => this.setState({ nullRfidSent: false }), 1000);
    };
  };

  componentDidMount() {
    this.setupWebSocket();
  }

  componentWillUnmount = async () => {
    this.socket && this.socket.close();
  };

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter />
            {this.state.spinnerShown && <Spinner />}
            <AlertBox
              iconType="warning"
              display={this.state.errorInRfid}
              onClose={this.hideRfidError}
              errorMessage={this.context.t("WRONG_PIN_STOP")}
            />
            <AlertBox
              iconType="warning"
              display={this.state.errorInPIN}
              onClose={this.hidePINError}
              errorMessage={this.context.t("WRONG_PIN_STOP")}
              clearOutletIdOnClose={true}
            />
            <Navbar heading={this.context.t("STOP_CHARGING")} theme="light" />
            <Row style={S.StopChargingPage} data-testid="stop-charging-page">
              <Row style={S.ContentRow}>
                <Col span={2} />
                {!context.config?.isRfidFlow && (
                  <Col span={7} style={S.InputCol}>
                    <Numpad
                      currentPIN={this.state.currentPIN}
                      setCurrentPIN={this.setCurrentPIN}
                      onPINSubmit={this.handlePINSubmit}
                    />
                  </Col>
                )}
                <Col span={7} offset={1} style={S.ContentTextCol}>
                  <span style={S.ContentText}>
                    <Trans
                      i18nKey={
                        context.config?.isRfidFlow
                          ? "STOP_MESSAGE_RFIDFLOW"
                          : "STOP_MESSAGE"
                      }
                      components={{ bold: <strong /> }}
                    />
                  </span>
                </Col>
                <Col span={5} style={S.ImgCol}>
                  <img
                    src={ScanRfid}
                    alt="ScanRfid"
                    style={S.Img}
                    data-testid="scan-rfid-image"
                  />
                </Col>
                <Col span={2} />
              </Row>
            </Row>
            <DateBox color="dark" />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default StopCharging;
