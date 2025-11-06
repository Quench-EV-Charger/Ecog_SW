/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import { Row, Col, Typography } from "antd";
import ReconnectingWebSocket from "reconnecting-websocket";
import { withTranslation, Trans } from "react-i18next";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import Navigation from "../../components/Navigation";
import AlertBox from "../../components/AlertBox";
import DateBox from "../../components/DateBox";
import Spinner from "../../components/Spinner";
import TimeoutRouter from "../../components/TimeoutRouter";
import Numpad from "../../components/AuthEV/Numpad";

import { isNeedUnplug, clearRfid, isActive, stopCharging } from "../../utils";
import ScanRfid from "../../assets/images/scan_rfid.svg";
import { httpPost,httpGet } from "../../apis/Queries";
import { addOrUpdateSessionToDb } from "../../localDb/dbActions";
import {reservationHour} from "../../utils";
import ReservationAlert from "../../components/ReservationAlert";
import autochargespin from '../../assets/images/autochargespin.gif';

import * as S from "./styles";
const { Title } = Typography;

class AuthorizeEv extends Component {
  static contextType = MainContext;

  socket = null;

  state = {
    errorInRfid: false,
    currentPIN: "",
    errorInPIN: false,
    spinnerShown: false,
    allowToShowAlert: false,
    time: 0,
    waitingForOcppMsg: false,
    showNumpad: true, // State to control Numpad visibility
    isAutocharging: false, // State to handle autocharging process
    isReservation: false, // State to handle if reservation is made.
    reservationStartTime : null,
    reservationEndTime : null,
    showReservationPrompt: false,
    reservationDetails: null,
    showReservationDetails: false,
    autochargeauth: true,
  };
  showRfidError = () => {
    this.setState({
      errorInRfid: true,
      allowToShowAlert: false,
    });
  };
  hideRfidError = () => {
    this.setState({
      errorInRfid: false,
    });
  };
  hideReservation = () => {
    this.setState({
      isReservation: false,
    });
  };
  setCurrentPIN = (currentPIN) => {
    this.setState({ currentPIN });
  };
  setErrorInPIN = () => {
    this.setState({
      errorInPIN: true,
      allowToShowAlert: false,
    });
  };
  hidePINError = () => {
    this.setState({
      errorInPIN: false,
      currentPIN: "",
    });
  };

  fetchData = async (API,outledID) => {
    const endpoint = `${API}/services/ocpp/reservations`;
        
    try {
      const apiResponse = await httpGet(endpoint);
  
      if (Array.isArray(apiResponse)) {
        const currentTimestamp = Date.now();
  
        // Filter valid reservations and set the reservation details in state
        const validReservations = apiResponse.filter((item) => {
          const { startDate, expiryDate } = item?.data || {};
          return (
            startDate &&
            expiryDate &&
            new Date(startDate).getTime() <= currentTimestamp &&
            new Date(expiryDate).getTime() > currentTimestamp
          );
        });
  
        // Find the reservation for the selected outlet (if any)
        const outletReservation = validReservations.find(
          (item) => String(item?.data?.connectorId) === outledID
        );
  
        if (outletReservation) {
          const { startDate, expiryDate } = outletReservation.data;
  
          // Update state with the reservation times
          this.setState({
            reservationStartTime: new Date(startDate).getTime(),
            reservationEndTime: new Date(expiryDate).getTime(),
          });
        } else {
          // No valid reservation for the selected outlet, clear reservation times
          this.setState({
            reservationStartTime: null,
            reservationEndTime: null,
          });
        }
      } else {
        // Invalid response, clear reservation times
        this.setState({
          reservationStartTime: null,
          reservationEndTime: null,
        });
      }
    } catch (error) {
      console.error("Error fetching reserved outlets:", error);
  
      // On error, clear reservation times
      this.setState({
        reservationStartTime: null,
        reservationEndTime: null,
      });
    }
  }

  handleClosePrompt = () => {
    this.setState({ 
      showReservationPrompt: false ,
      showReservationDetails: false,
    });
  };

  authResHandler = (data) => {
    console.log("AuthRes received", data);
    const { selectedState} = this.context;
    const isAC = selectedState?.outletType === "AC";
    data = data.detail;
    console.log(data);
    if (data.type === "auth-res") {
      this.setState({ waitingForOcppMsg: false });

      // AutoCharge: If the IDTag contains VID: return
      const CurrentIDTag = data.payload.idTag;
      if (CurrentIDTag.startsWith("VID:") && data.payload.status !== "Rejected") {
        console.log(data.payload);
      }
      if (data.payload.status === "Rejected") {
        console.log(this.state.allowToShowAlert,"before")
        if (CurrentIDTag.startsWith("VID:")) {
          this.hideRfidError();
          console.log("RFID Error Hidden for rejected VID!");
          console.log("VID is rejected");
          this.setState({autochargeauth : false});
          this.setState({isAutocharging : false});
        }
        
        if (!this.state.allowToShowAlert) return;
        console.log(this.state.allowToShowAlert,"after")
        if (this.state.currentPIN === "") {
          this.showRfidError();
        } else {
          this.setErrorInPIN();
        } 
      } else {
        if (data?.payload?.idTag) {
          if (isAC) {
            this.insertACSession(data?.payload?.idTag, selectedState);
          }
        }
        this.setState({ spinnerShown: true });
      }
    }
  };

  insertACSession = (user, selectedState) => {
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

  postOtp = async (rfid) => {
    const { config, chargingMode } = this.context;
    
    // Create a promise for the statements inside the if block
    const handleComboMode = async () => {
      console.log("handleComboMode");
      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
  
      let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({
          idTAG:  String(rfid),
          outletId: 0
        }),
      };
  
      // Await the fetch call to ensure it completes before continuing
      const response = await fetch(
        `${config.API}/services/rfid/v2/authdetails`,
        requestOptions
      );
      // Await the response to get the JSON data
      const result = await response.json();
  
      if (response.status === 200) {
        console.log("otp sent", result);
      }
    };
  
    console.log(chargingMode);
    
    // Check if comboMode is true and chargingMode > 0, then execute the promise
    if (config?.comboMode && chargingMode > 0) {
      try {
        await handleComboMode();
      } catch (error) {
        console.error("Error in handling combo mode:", error);
      }
    } else {
      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
  
      let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({ idTag: rfid }),
      };
  
      const response = await fetch(
        `${config.API}/services/rfid/idtag`,
        requestOptions
      );
      
      const result = await response.json();
  
      if (response.status === 200) {
        console.log("otp sent", result);
      }
    }
  };

  setupWebSocket = () => {
    const { config } = this.context;
    const rfidEndpointToListen = `${config.socketUrl}/services/rfid/idTag`;
    this.socket = new ReconnectingWebSocket(rfidEndpointToListen);
    this.socket.onmessage = async (event) => {
      if (!event || !event.data || typeof event.data !== "string") return; // skip for null rfid
      this.handlePostOutletId(event?.data);
      this.setState({ allowToShowAlert: true });
    };
  };

  handlePINSubmit = async () => {
    const { currentPIN } = this.state;
    this.setState({ waitingForOcppMsg: true });
    await this.postOtp(currentPIN);
  };

  handlePostOutletId = async (rfid) => {
    const { chargerState, config } = this.context;
    if (config?.isRfidFlow) {
      const chargingRfidState = chargerState.find(
        (outletState) => outletState?.user === rfid && isActive(outletState)
      );
      if (chargingRfidState) {
        await stopCharging(
          config?.API,
          chargingRfidState?.user,
          chargingRfidState?.outlet
        );
      } else {
        await this.postOutletId();
      }
    } else {
      await this.postOutletId();
    }
  };

  postOutletId = async () => {
    const { config, chargerState } = this.context;
    const { API } = config || {};

    const localOutletId = localStorage.getItem("selectedOutlet");
    const outletState = chargerState.find(
      (state) => state.outlet == localOutletId
    );
    const outletId = Number(outletState?.outlet);
    await httpPost(
      `${API}/services/rfid/outletId`,
      JSON.stringify({ outletId }),
      "outlet id post"
    );
  };

  getIsRfidReaderConnected = () => {
    return (
      this.context.chargerState &&
      Array.isArray(this.context.chargerState) &&
      this.context.chargerState[0] &&
      this.context.chargerState[0].RFIDConnected
    );
  };

  checkReservation = async () => {
    try {
      const {selectedState} = this.context;// prettier-ignore
      const details = await reservationHour(this.context.config?.API,selectedState.outlet);
      if (details && selectedState.phs >= 1) {
        this.setState({
          showReservationPrompt: true,
          reservationDetails: details.message
        });
      }
    } catch (error) {
      console.error("Error fetching reservation details:", error);
    }
  };
  setAutocharge = async () => {
    try {
      const response = await fetch(`${this.context.config?.API}/db/config`);
      const data = await response.json();
      if (data?.autoChargeMode === false) {
        this.setState({ isAutocharging: false });
      } else {
        console.error("Failed to fetch auto charge mode");
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    }
    // Set a timer to display Numpad after 30 seconds if autocharging is incomplete
    if((this.context.selectedState.outlet == 1 && this.context?.isGunOneSpinner) || (this.context.selectedState.outlet == 2 && this.context.isGunTwoSpinner)) {
      setTimeout(() => {
        this.setState({ isAutocharging: false, autoChargeMode:false });
        if(this.context.selectedState.outlet == 1 && this.context?.isGunOneSpinner) this.context.setIsGunSpinnerOne(false)

        if(this.context.selectedState.outlet == 2 && this.context?.isGunTwoSpinner) this.context.setIsGunSpinnerTwo(false)
      }, 60000);
    }
  };

  componentWillMount = () => {
    const { selectedState, chargerState } = this.context;
    if (!selectedState) return;

    const outletid = localStorage.getItem("selectedOutlet");
    const outletState = chargerState.find(
      (outlet) => outlet.outlet == outletid
    );
    if (isNeedUnplug(outletState)) {
      this.context.changePath("/unplugev");
    }
  };
  setReservation = () => {
    const {selectedState} = this.context;// prettier-ignore
    if (selectedState?.reservedOutlets?.hasOwnProperty(selectedState.outledID)) {
      this.setState({ isReservation: true });
      this.fetchData(selectedState?.API, selectedState.outledID);
    } 
  }


  componentDidMount = async () => {
    await clearRfid(this.context.config?.API);
    this.setupWebSocket();
    window.addEventListener("auth-res", this.authResHandler, false);
    this.checkReservation();
    this.setReservation();
    //set autocharge from /db/config
    // this.setAutocharge();
  };

  componentDidUpdate(prevProps, prevState) {
    const { changePath, selectedState, faultedOutlets, config, chargingMode } = this.context;
  
    if (
      faultedOutlets &&
      Array.isArray(faultedOutlets) &&
      faultedOutlets.includes(selectedState?.outlet)
    ) {
      if (!(config?.comboMode && chargingMode > 0)) {
        if (this.props?.history?.location?.pathname !== "/") {
          changePath("/");
        }
      }
    }
  }

  componentWillUnmount = async () => {
    await clearRfid(this.context.config?.API);
    await httpPost(
      `${this.context.config.API}/services/rfid/outletId`,
      JSON.stringify({ outletId: null }),
      "outlet id post"
    );
    window.removeEventListener("auth-res", this.authResHandler, false);
    this.socket && this.socket.close();
  };

  render() {
    const { showReservationPrompt, reservationDetails, autochargeauth } = this.state;
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            {showReservationPrompt && reservationDetails && (
              <ReservationAlert
                showReservationPrompt={showReservationPrompt}
                reservationDetails={reservationDetails}
                onClose={this.handleClosePrompt}
              />
            )}
            <TimeoutRouter />
            <AlertBox
              iconType="warning"
              display={this.state.errorInRfid}
              onClose={() => {
                this.hideRfidError();
                this.hideReservation();
              }}
              errorMessage={
                this.state.isReservation 
                  ? `Charger is reserved from ${this.state.reservationStartTime} to ${this.state.reservationStopTime}. Use correct RFID card`
                  : context.t("WRONG_RFID")
              }
            />
            <AlertBox
              iconType="warning"
              display={this.state.errorInPIN}
              onClose={() => {
                this.hidePINError();
                this.hideReservation();
              }}
              errorMessage={
                this.state.isReservation
                  ? `Charger is reserved from ${this.state.reservationStartTime} to ${this.state.reservationStopTime}. Use correct RFID card`
                  : context.t("WRONG_PIN")}
              clearOutletIdOnClose={true}
            />
            {this.state.spinnerShown && <Spinner />}
            <Navbar heading={this.context.t("AUTHORIZE")} theme="light" />
            <Row style={S.AuthorizePage} data-testid="auth-page">
              <Row style={S.NavigationContainer}>
                <Navigation selectedState={context.selectedState} />
              </Row>
              <Row style={S.ContentRow}>
                <Col span={2} />
                {!context.config?.isRfidFlow && (
                  <Col span={7} style={S.InputCol}>
                    {this.context.config?.OTPEnabled?<Numpad
                      currentPIN={this.state.currentPIN}
                      setCurrentPIN={this.setCurrentPIN}
                      onPINSubmit={this.handlePINSubmit}
                      waitingForOcppMsg={this.state.waitingForOcppMsg}
                    />:<img
                    src={ScanRfid}
                    alt="ScanRfid"
                    style={S.Img}
                    data-testid="scan-rfid-image"
                  />}
                  </Col>
                )}
                <Col span={7} offset={1} style={S.ContentTextCol}>
                  <span style={S.ContentText}>
                    <Trans
                      i18nKey={context.config?.isRfidFlow
                          ? "AUTH_MESSAGE_RFIDFLOW"
                          : "AUTH_MESSAGE"
                      }
                      components={{ bold: <strong /> }}
                    />
                  </span>
                </Col>
                {this.context.config?.OTPEnabled?(<Col span={5} style={S.ImgCol}>
                  <img
                    src={ScanRfid}
                    alt="ScanRfid"
                    style={S.Img}
                    data-testid="scan-rfid-image"
                  />
                </Col>):null}
                <Col span={2} />
              </Row>
              <Row style={S.FooterRow}>
                <div style={S.FooterTextContainer}>
                  <span style={S.FooterText}>
                    {this.state.isAutocharging ?
                    null
                    :context.config?.isRfidFlow
                      ? context.t("AUTHORIZATION_TERMINATION_RFIDFLOW")
                      : context.t("AUTHORIZATION_TERMINATION")}
                  </span>
                </div>
                <div style={S.RfidDisconnectedTextContainer}>
                  {!this.getIsRfidReaderConnected() && (
                    <Title style={S.RfidDisconnectedText}>
                      {context.t("RFID_DISCONNECTED")}
                    </Title>
                  )}
                </div>
              </Row>
            </Row>
            <DateBox color="dark" />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default withTranslation()(AuthorizeEv);
