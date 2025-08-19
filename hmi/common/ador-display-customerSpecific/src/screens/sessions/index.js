/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import SessionsFooter from "../../components/Sessions/SessionsFooter";
import EmergencyStop from "../../components/EmergencyStop";
import PowerFailure from "../../components/PowerFailure";
import IMDFault from "../../components/IMDFault";
import Session from "../../components/Sessions/Session";
import AlertBox from "../../components/AlertBox"
import { Button } from "antd";
import { Row, Col } from "antd";
import ChargingMode from "../chargingmode";
import OverlayVCCU from "../../components/VCCU/Overlay";
import ReservationAlert from "../../components/ReservationAlert";

import {reservationHour} from "../../utils"


import {
  getControllers,
  inStoppingProccess,
  isCharging,
  isHandshaking,
  clearRfid,
  isNeedUnplug,
  isOutletPreparing,
} from "../../utils";

import * as S from "./styles";

class Sessions extends Component {
  static contextType = MainContext;

  state = {
    showReservationPrompt: false,
    reservationDetails: null,
};
  setupRFIDSocket = () => {
    const { config, chargerState, changePath, setSelectedState } = this.context;
    const { socketUrl, isRfidFlow } = config;
    if (isRfidFlow) return;

    // go to charging screen if !isRfidFlow. for isRfidFlow, we are stopping charging
    this.socket = new ReconnectingWebSocket(`${socketUrl}/services/rfid/idTag`);
    this.socket.onmessage = (event) => {
      const rfid = event.data;
      console.log(rfid);
      if (rfid.startsWith("VID:")) {
        this.setState({
          errorInRfid: false,
        });
      }

      const activeSession = chargerState.find(
        (state) =>
          state.user === rfid &&
          state.pilot >= 3 &&
          state.pilot <= 4 &&
          state.phs >= 3
      );
      if (activeSession) {
        localStorage.setItem("selectedOutlet", activeSession?.outlet);
        localStorage.setItem("user", activeSession.user);
        setSelectedState(activeSession);
        changePath("/charging");
      }
    };
  };

  isFaulted = (eachOutlet) =>
    this.context.faultedOutlets?.includes(eachOutlet?.outlet);

  isBlocked = (eachOutlet) =>
    this.context.blockedOutlets?.includes(eachOutlet?.outlet);
  
  isPreparingBothVCCU = () => {
    if (this.context?.chargerState.length === 1 ) {
      return false;
    }
    if(this.context.chargerState[0].phs == 2 && this.context.chargerState[1].phs == 2){
      return true;
    }
    else if(this.context.chargerState[0].phs == 7 || this.context.chargerState[1].phs == 7){
      return true;
    }
    else{
      return false;
    }
  };

  checkReservation = async () => {
      try {
        const {selectedState} = this.context;// prettier-ignore
        const details = await reservationHour(this.context.config?.API,selectedState.outlet);
        if (details && selectedState.phs >= 2) {
          this.setState({
            showReservationPrompt: true,
            reservationDetails: details.message
          });
        }
      } catch (error) {
        console.error("Error fetching reservation details:", error);
      }
    };
   
  isInoperative = (eachOutlet) =>
    this.context.inoperativeOutlets?.includes(eachOutlet?.outlet);

  isDisabled = (eachOutlet) =>
    this.isFaulted(eachOutlet) ||
    this.isBlocked(eachOutlet) ||
    isHandshaking(eachOutlet) ||
    this.isInoperative(eachOutlet)||
    (this.context.chargingMode==1 && this.isPreparingBothVCCU() == false);
  
  isActive = (eachOutlet) =>
    this.context.activeOutlets?.includes(eachOutlet?.outlet);

  getButtonText = (eachOutlet) => {
    const { t } = this.context;
    if (this.isActive(eachOutlet)) {
      return t("STOP_CHARGING");
    } else if (this.isDisabled(eachOutlet) && this.context.chargingMode == 1) {
      return t("START_CHARGING");
    } 
    else if (this.isDisabled(eachOutlet)) {
      return t("UNAVAILABLE");
    }
    else {
      return t("START_CHARGING");
    }
  };
  // changed temperature checks as per state obj
  isOutletTempHigh = eachOutlet => {
    if (eachOutlet.outlet == 1 && eachOutlet.errorObj?.gunTemperatureErr_1) {
      return (eachOutlet.errorObj?.gunTemperatureErr_1);
    } 
    else if (eachOutlet.outlet == 2 && eachOutlet.errorObj?.gunTemperatureErr_2)
      return (eachOutlet.errorObj?.gunTemperatureErr_2);
  };

  isPowerFail= eachOutlet => {
    if (eachOutlet.errorObj?.powerLossErr) {
      return (eachOutlet.errorObj?.powerLossErr);
    }
  };

  isPowerModuleCommErr = eachOutlet => {
    let isConvTimeout = false;
    if(eachOutlet?.modbus_selec_online){
      if (eachOutlet?.phs > 2){
        isConvTimeout = eachOutlet?.can1_RX_time?.conv_timeout;
      }
      else{
        isConvTimeout = false;
      }
    }
    else{
      isConvTimeout = eachOutlet?.can1_RX_time?.conv_timeout;
    }
    return isConvTimeout;

  }
  resetautocharging =() => {
    if(this.context?.selectedState?.outlet == 1 && !this.context?.isGunOneSpinner) this.context.setIsGunSpinnerOne(true)
    if(this.context?.selectedState?.outlet == 2 && !this.context?.isGunTwoSpinner) this.context.setIsGunSpinnerTwo(true)
  }

  getStatusText = (eachOutlet) => {
    //if (this.context.chargingMode == 1) { eachOutlet = this.context.chargerState[0] }
    const { t, chargingMode, reservedOutlets, errTogglingTimeout } = this.context;
    if (this.isPowerFail(eachOutlet)){
      eachOutlet && this.resetautocharging()
      return t("POWER_FAILURE");
    } else if (this.isPowerModuleCommErr(eachOutlet) && !errTogglingTimeout) {
      eachOutlet && this.resetautocharging()
      return t("POWER_MODULE_COMM");
    } else if (this.isOutletTempHigh(eachOutlet) && !errTogglingTimeout) {
      return t("SINGLE_OUTLET_TEMP");
    } else if (inStoppingProccess(eachOutlet)) {
      return t("STOPPING")
    } else if (isNeedUnplug(eachOutlet) && !this.isFaulted(eachOutlet)) {
      eachOutlet && this.resetautocharging()
      return t("UNPLUG_EV")
    } else if (isOutletPreparing(eachOutlet) && !this.isFaulted(eachOutlet)) {
      return t("PREPARING")
    } else if (this.isActive(eachOutlet)) {
      return t("CHARGING");
    } else if (
      chargingMode > 0 &&
      (this.isFaulted(eachOutlet) || this.isBlocked(eachOutlet))
    ) {
      return t("BLOCKED");
    } else if (this.isInoperative(eachOutlet)) {
      return t("INOPERATIVE");
    }
    else if (this.isFaulted(eachOutlet)) {
      eachOutlet && this.resetautocharging()
      return t("FAULTED");
    } else if (this.isBlocked(eachOutlet)) {
      return t("BLOCKED");
    } else if (reservedOutlets?.includes(eachOutlet?.outlet)) {
      return t("RESERVED")
    } else {
      return t("AVAILABLE");
    }
  };

  handleButtonClick = async (eachOutlet) => {
    const { changePath, setSelectedState } = this.context;
    const { pilot, authorized, outlet, user } = eachOutlet;
    const isComboMode = this?.context?.config?.comboMode;

    if (this.isDisabled(eachOutlet)) {
      return;
    }

    if(this.isPreparingBothVCCU() == false && this.context.chargingMode == 1){
      return;
    }

    setSelectedState(eachOutlet);
    localStorage.setItem("selectedOutlet", outlet);
    localStorage.setItem("user", user);

    if (this.isActive(eachOutlet)) {
      changePath("/stopcharging");
    } else {
      if (inStoppingProccess(eachOutlet)) changePath("/stopping");
      else if (isNeedUnplug(eachOutlet)) changePath("/unplugev");
      // else if (isComboMode) changePath("/chargingmode");
      else if (pilot >= 1 && pilot <= 2 && !authorized) changePath("/authorize"); // prettier-ignore
      else changePath("/plugev");
    }
  };

  handleSessionClick = async (eachOutlet) => {
    const { changePath, setSelectedState } = this.context; // prettier-ignore
    const { outlet, user } = eachOutlet;

    if (this.isActive(eachOutlet)) {
      setSelectedState(eachOutlet);
      localStorage.setItem("user", user);
      localStorage.setItem("selectedOutlet", outlet);
      if (isCharging(eachOutlet)) {
        changePath("/charging");
      } else {
        changePath("/checkpoints");
      }
    }
  };

  postControllerTime = async (controller) => {
    const date = new Date().toISOString();
    const timeSyncingEndpoint = `http://${controller.ip}/api/system/timeFromBrowser`;
    fetch(timeSyncingEndpoint, {
      headers: { "content-type": "application/json;charset=UTF-8" },
      body: JSON.stringify({ date }),
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          const errMsg = `Failed to synchronize time for ${controller.ip} - ${response.statusText}`;
          console.log(errMsg);
        } else {
          const successMsg = `Synchronized time for ${controller.ip}`;
          console.log(successMsg);
        }
      })
      .catch((error) => {
        const errMsg = `Failed to synchronize time for ${controller.ip} - ${error}`;
        console.log(errMsg);
      });
  };

  syncSECCTime = async () => {
    const API = this.context?.config?.API;
    const controllers = await getControllers(API);
    if (!controllers || !Array.isArray(controllers)) {
      console.log("Controllers are not proper to sync time! controllers: ", controllers); // prettier-ignore
      return;
    }

    for (const controller of controllers) {
      if (controller.ip) {
        this.postControllerTime(controller);
      }
    }
    this.context.setSeccTimeSynced(true);
  };

  getIsRfidReaderConnected = () => {
    return this.context.chargerState && 
    Array.isArray(this.context.chargerState) && 
    this.context.chargerState[0] && 
    this.context.chargerState[0].RFIDConnected;
  }

  componentDidMount = async () => {
    this.setupRFIDSocket();
    this.reservationCheckInterval = setInterval(() => {
      this.checkReservation();
  }, 3000);

    if (!this.context.seccTimeSynced) {
      this.syncSECCTimeTimeout = setTimeout(() => this.syncSECCTime(), 5000);
    }

    clearRfid(this.context.config?.API);

    if (this.context.config?.isRfidFlow) {
      if (this.context.shouldGoHomeOnSessionStart)
        this.context.setShouldGoHomeOnSessionStart(false);
    }
  };

  componentWillUnmount = () => {
    if (this.socket) this.socket.close();
    clearTimeout(this.syncSECCTimeTimeout);
    clearInterval(this.reservationCheckInterval);
  };
  handleClosePrompt = () => {
    this.setState({ 
      showReservationPrompt: false
    });
    clearInterval(this.reservationCheckInterval);
  };

  render() {
    const { faultedOutlets} = this.context;
    const {showReservationPrompt,reservationDetails} = this.state;
    // Determine if faultedOutlets is empty or not
    const isFaultedOutletsEmpty = !faultedOutlets || faultedOutlets.length === 0;
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
            {context.shouldDisplay > 0 && isFaultedOutletsEmpty &&(
              <OverlayVCCU 
                display={true} 
                ANPR={""} 
                message={
                  context.shouldDisplay === 1 
                    ? "Please connect both the guns to the vehicle" 
                    : context.shouldDisplay === 2 
                      ? "Please plug in the other gun to start charging" 
                      : ""
                }
              />
            )}
            <EmergencyStop shown={context.showEStop} />
            <PowerFailure shown={context.errorCode === "powerloss"} />
            <AlertBox
              iconType="warning"
              display={context.showHandshakeErrorModal && context.selectedState?.pilot > 0}
              onClose={() => context.setShowHandshakeErrorModal(false)}
              errorMessage={context.t("HANDSHAKE_ERROR_MODAL")}
            />
            <Navbar theme="light" />
            <div style={S.SessionsPage} data-testid="sessions-page">
              {/* Conditionally rendering the charging mode section */}
              {(String(context.chargingMode) === "0" || String(context.chargingMode) === "1") && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: "2px", // Add space between header and session 
                    marginRight: "350px",
                  }}
                >
                  <h2
                    style={{
                      color: "red",
                      fontWeight: "bold",
                      fontSize: "30px",
                    }}
                  >
                    {context.config?.comboMode ?
                      String(context.chargingMode) === "0"
                      ? context.t("CHARGING_HEADER_REGULAR")
                      : context.t("CHARGING_HEADER_DUAL")
                      : context.t("")
                    }
                  </h2>
                </div>
              )}
              

              <div style={S.TariffsContainer(context.errorCode)}>
                <div style={S.TariffsAligner}>
                  {context.chargerState &&
                    Array.isArray(context.chargerState) &&
                    context.chargerState.map((eachItem, index) => (
                      <Session
                        key={eachItem?.index}
                        eachItem={eachItem}
                        index={index}
                        context={context}
                        getStatusText={this.getStatusText}
                        handleSessionClick={this.handleSessionClick}
                        handleButtonClick={this.handleButtonClick}
                        getButtonText={this.getButtonText}
                        isDisabled={this.isDisabled}
                        useQAsOutletID={context.config?.useQAsOutletID}
                        reservedOutlets={context.config?.reservedOutlets}
                      />
                    ))}

                  {context.config?.comboMode && (
                    <div style={S.SideSpace}>
                      <div style={{ ...S.ButtonContainer, marginTop: "-20px", marginRight: "10px" }}>
                        <span style={{ ...S.StatusText, fontSize: "24px", fontWeight: "bold" }}>
                          {context.t("SELECT_CHARGING_MODE")+ ":"}
                        </span>
                        <br />
                        <br />
                        <ChargingMode />
                        <div>
                          <p
                            style={{
                              color: "red",
                              fontWeight: "bold",
                              fontSize: "20px",
                              textAlign: "center", // corrected "centre" to "center" for proper alignment
                              paddingRight: "10px",
                              transform: "translateY(-10px) translateX(10px)", // Shift upwards and to the right
                            }}
                          >
                            {String(context.chargingMode) === "0" && context.config.comboMode ===true
                              ? context.t("CHARGING_DESCRIPTION_REGULAR")
                              : context.t("CHARGING_DESCRIPTION_DUAL")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <SessionsFooter 
                isRfidReaderConnected={this.getIsRfidReaderConnected()}
                rfidReaderDisconnectedText={context.t("RFID_DISCONNECTED")}
                config={this.context.config}
              />
              {/* {!context.config?.comboMode && (
                <SessionsFooter
                  buttonText={this.context.t("RETRIEVE_SESSION")}
                  retrieveDisabled={false}
                  errorCode={context.errorCode}
                  history={this.props?.history}
                  toStopText={this.context.t("RFID_OR_APP_TO_STOP")}
                  isRfidFlow={this.context.config?.isRfidFlow}
                  activeOutlets={this.context.activeOutlets}
                  t={this.context.t}
                  chargingMode={this.context.chargingMode}
                  comboMode={this.context.config?.comboMode}
                  isRfidReaderConnected={this.getIsRfidReaderConnected()}
                  rfidReaderDisconnectedText={context.t("RFID_DISCONNECTED")}
                />
              )} */}
            </div>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }

}

export default Sessions;
