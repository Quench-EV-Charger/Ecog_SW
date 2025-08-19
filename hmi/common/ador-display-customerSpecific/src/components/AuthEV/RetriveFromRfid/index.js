import React, { Component } from "react";
import { Row, Col } from "antd";
import ReconnectingWebSocket from "reconnecting-websocket";
import { withTranslation, Trans } from "react-i18next";

import Navbar from "../../navbar";
import MainContext from "../../../providers/MainContext";

import DateBox from "../../DateBox";
import AlertBox from "../../AlertBox";
import TimeoutRouter from "../../TimeoutRouter";
import Numpad from "../Numpad";

import ScanRfid from "../../../assets/images/scan_rfid.svg";
import { isActive, clearRfid } from "../../../utils";

import * as S from "./styles";

class RetrieveSession extends Component {
  static contextType = MainContext;

  socket = null;

  state = {
    errorInRfid: false,
    currentPIN: "",
    errorInPIN: false,
    isButtonDisabled: false,
    nullRfidSent: false,
  };

  showRfidError = () => this.setState({ errorInRfid: true });

  hideRfidError = () => this.setState({ errorInRfid: false });

  setCurrentPIN = (currentPIN) => this.setState({ currentPIN });

  setErrorInPIN = () => this.setState({ errorInPIN: true });

  hidePINError = () => this.setState({ errorInPIN: false, currentPIN: "" });

  handlePINClick = (buttonValue) => {
    if (this.state.isButtonDisabled) return;
    let newPIN = this.state.currentPIN.slice();
    if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(buttonValue)) {
      if (this.state.currentPIN.length !== 4) {
        newPIN = `${newPIN}${buttonValue}`;
        this.setState({ currentPIN: newPIN, isButtonDisabled: true });
        setTimeout(() => this.setState({ isButtonDisabled: false }), 250);
      }
    } else if (buttonValue === "BACK") {
      newPIN = newPIN.slice(0, newPIN.length - 1);
      this.setCurrentPIN(newPIN);
    } else if (buttonValue === "ENTER") {
      this.handlePINSubmit();
    }
  };

  handlePINSubmit = async () => {
    const { currentPIN } = this.state;
    this.handleRetrieveSession(currentPIN, "PIN");
  };

  handleInvalidUser = (source) => {
    if (source === "RFID") {
      this.showRfidError();
    } else {
      this.setCurrentPIN("");
      this.setErrorInPIN();
    }
  };

  setLocalStorageAndContext = (outletState) => {
    localStorage.setItem("selectedOutlet", outletState?.outlet);
    localStorage.setItem("user", outletState?.user);
    this.context.setSelectedState(outletState);
  };

  handleRetrieveSession = async (rfid, source) => {
    const { changePath, chargerState } = this.context;

    // there might be 2 same user. one might be done other might be charging. but if one is charging, we should go to charging screen, not the result
    const activeOutlet = chargerState.find(
      (outletState) =>
        isActive(outletState) && outletState?.user?.includes(rfid)
    );
    if (activeOutlet) {
      this.setLocalStorageAndContext(activeOutlet);
      changePath("/charging");
      return;
    }

    // if there is no charging outlet with the given user go to result screen if the given user is there
    const outlet = chargerState.find((outletState) => {
      return outletState?.user?.includes(rfid);
    });
    if (outlet) {
      this.setLocalStorageAndContext(outlet);
      if (isActive(outlet)) changePath("/charging");
      else changePath(`/session-result?user=${outlet?.user}`);
    } else {
      this.handleInvalidUser(source);
    }
  };

  setupWebSocket = () => {
    const { config } = this.context;
    this.socket = new ReconnectingWebSocket(
      `${config.socketUrl}/services/rfid/idTag`
    );
    this.socket.onmessage = (event) => {
      if (!event || !event.data || typeof event.data !== "string") return; // skip for null rfid
      if (this.state.nullRfidSent) return; // prevent edge-case (after sending null rfid, prevent to receive it and post again)
      this.handleRetrieveSession(event.data, "RFID");
      clearRfid(config?.API);
      this.setState({ nullRfidSent: true });
      setTimeout(() => this.setState({ nullRfidSent: false }), 1000);
    };
  };

  isEnterKey = (buttons, index) => index === buttons.length - 1;

  isEnterButtonDisabled = (buttons, index) => {
    if (this.isEnterKey(buttons, index)) {
      return this.state.currentPIN.length !== 4;
    }
  };

  componentDidMount = () => {
    this.setupWebSocket();
  };

  componentWillUnmount() {
    this.socket && this.socket.close();
  }

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter />
            <AlertBox
              iconType="warning"
              display={this.state.errorInRfid}
              onClose={this.hideRfidError}
              errorMessage={context.t("WRONG_RFID")}
            />
            <AlertBox
              iconType="warning"
              display={this.state.errorInPIN}
              onClose={this.hidePINError}
              errorMessage={context.t("WRONG_PIN")}
              clearOutletIdOnClose={true}
            />
            <Navbar heading={context.t("RETRIEVE_SESSION")} theme="light" />
            <Row style={S.RetrievePage} data-testid="retrive-from-frid">
              <Row style={{ ...S.ContentRow, height: "80vh" }}>
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
                          ? "AUTH_MESSAGE_RFIDFLOW"
                          : "AUTH_MESSAGE"
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

export default withTranslation()(RetrieveSession);
