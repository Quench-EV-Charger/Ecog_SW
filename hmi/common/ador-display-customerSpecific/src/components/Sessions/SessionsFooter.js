/* eslint eqeqeq: "off" */
import React, { Component } from "react";
import { Button, Typography } from "antd";
// import { Trans } from "react-i18next";

import DateBox from "../DateBox";
// import { GunLetters } from "../../constants/constants";
import * as S from "./styles";
import MainContext from "../../providers/MainContext";


const { Title } = Typography;

export default class SessionsFooter extends Component {
  static contextType = MainContext;
  constructor(props) {
    super(props);
    this.state = {
      qrString: "", // <-- define qrString in state
      config:props.config
    };
  }
  async componentDidMount() {

    const { config } = this.state;

    if (config?.API) {
      try {
        const response = await fetch(`${config.API}/ocpp-client/config`);
        const data = await response.json();

        if (data.QRHashStr) {
          const parts = data.QRHashStr.split("_");
          const extractedString = parts[parts.length - 1];
          this.setState({ qrString: extractedString });
        }
      } catch (err) {
        console.warn("Failed to fetch QR string:", err);
      }
    }
  }

  render() {
    const {
      buttonText, // Button text passed as prop
      retrieveDisabled, // Boolean to disable the retrieve button
      errorCode, // Error code for determining the button's style
      history, // History object for routing
      toStopText, // Text to display for stopping session
      isRfidFlow, // Flag indicating if RFID flow is active
      activeOutlets, // Array of active outlets
      chargingMode, // Current charging mode
      comboMode, // Flag for combo mode
      isRfidReaderConnected, // Flag to indicate if RFID reader is connected
      rfidReaderDisconnectedText, // Text to show if RFID reader is disconnected
    } = this.props;

    const { qrString } = this.state;

    // Function to handle click event on the 'Retrieve' button
    // const handleRetrieveClick = () => {
    //   if (!history || !history.push || retrieveDisabled) return;
    //   history.push("/retrieve");
    // };

    // // Function to get the text to stop the session, based on active outlets
    // const getToStopText = () => {
    //   if (
    //     activeOutlets &&
    //     Array.isArray(activeOutlets) &&
    //     activeOutlets.length > 0
    //   ) {
    //     return toStopText;
    //   } else {
    //     return "";
    //   }
    // };

    // // Logic for determining gun ID for fast mode
    // const gunIdForFastMode =
    //   (chargingMode > 0 && GunLetters[+chargingMode - 1]) || "";

    // // Check if the gun ID is valid (length of 1 character)
    // const isGunIdValid =
    //   gunIdForFastMode &&
    //   typeof gunIdForFastMode === "string" &&
    //   gunIdForFastMode.length === 1;

    return (
      <div style={S.SessionsFooterContainer} data-testid="sessions-footer">
        <div style={S.FooterTextsContainer}>
          <div>
            {!isRfidReaderConnected && (
              <Title style={S.RfidDisconnectedText}>
                {rfidReaderDisconnectedText}
              </Title>
            )}
          </div>
        </div>

        {/* Display DateBox component, with color based on errorCode */}
        <DateBox color={errorCode ? "white" : "dark"} />

        {/* Show QR string fetched from backend */}
        {qrString && (
          <div style={{
            margin: 0,
            left: 0,
            bottom: 0,
            padding: "0 1.15vw 1.15vw 25px",
            position: "absolute",
            fontSize: "2vw",
            color:"rgba(230, 37, 24, 1)",
            // textShadow: color === "dark" ? "1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black" : "2px 2px 0 white, -2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white",
  
          }}>
            <strong>{qrString}</strong>
          </div>
        )}
      </div>
    );
  }
}
