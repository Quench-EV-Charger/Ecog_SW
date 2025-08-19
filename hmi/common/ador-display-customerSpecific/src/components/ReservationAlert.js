import React, { Component } from "react";
import { Button, Icon } from "antd";
import MainContext from "../providers/MainContext";
import { withTranslation } from "react-i18next";

class ReservationAlert extends Component {
  static contextType = MainContext;

  render() {
    const { showReservationPrompt, reservationDetails, onClose } = this.props;

    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          background: "rgba(255,255,255, 0.8)",
          position: "fixed",
          top: 0,
          left: 0,
          display: showReservationPrompt ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
        data-testid="alert-box"
      >
        <div
          style={{
            width: "63.047vw",
            textAlign: "center",
            background: "white",
            height: "40vw",
            boxShadow: "0px 1.094vw 8.203vw rgba(0, 0, 0, 0.3)",
            borderRadius: "2vw",
            padding: "3vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Icon
            type="info-circle"
            style={{
              fontSize: "7.813vw",
              color: "#E62518",
              marginBottom: "2vw",
            }}
            data-testid="alert-icon"
          />
          
          <div style={{ 
            font: "Inter", 
            fontSize: "2.344vw",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",  // Center content vertically
            width: "100%",  // Take full width of parent
            padding: "0 2vw",  // Add horizontal padding
          }}>
            <p style={{ 
              fontWeight: "bold", 
              marginBottom: "1vw" 
            }}>
              {this.context.t("RESERVATION_DETAILS")}
            </p>
            <p>
              {this.context.t("RESERVATION_MESSAGE") + reservationDetails}
            </p>
          </div>

          <Button
            style={{
              width: "19vw",
              fontSize: "1.875vw",
              fontWeight: "bold",
              height: "4.375vw",
              borderRadius: "2.188vw",
              background: "#E62518",
              color: "#ffffff",
              boxShadow: "0px 0.547vw 1.094vw rgba(0, 0, 0, 0.2)",
            }}
            onClick={onClose}
            data-testid="close-button"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }
}

export default withTranslation()(ReservationAlert);