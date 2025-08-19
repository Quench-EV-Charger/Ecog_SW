import React, { Component } from "react";
import { Icon, Button } from "antd";
import { Trans } from "react-i18next";

import MainContext from "../providers/MainContext";

import { availableButtonShadow } from "../constants/constants";
import { httpPost } from "../apis/Queries";

const GunLetters = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
  6: "F",
};

class AlertBox extends Component {
  static contextType = MainContext;

  clearOutletId = async () => {
    const { config } = this.context;
    const { API } = config || {};

    await httpPost(
      `${API}/services/rfid/outletId`,
      JSON.stringify({ outletId: null }),
      "outlet id post null"
    );
  };

  handleClose = async () => {
    const { clearOutletIdOnClose, onClose } = this.props;

    if (clearOutletIdOnClose) {
      await this.clearOutletId();
    }
    onClose();
  };

  render() {
    return (
      <React.Fragment>
        <MainContext.Consumer>
          {() => (
            <React.Fragment>
              <div
                style={{
                  height: "100vh",
                  width: "100%",
                  background: "rgba(255,255,255, 0.8)",
                  zIndex: "1000",
                  position: "fixed",
                  display: this.props.display ? "flex" : "none",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                data-testid="alert-box"
              >
                <div
                  style={{
                    width: this.props.width || "53.047vw",
                    textAlign: "center",
                    background: "white",
                    height: this.props.height || "30vw",
                    boxShadow: " 0px 1.094vw 8.203vw rgba(0, 0, 0, 0.3)",
                    position: "absolute",
                    zIndex: "3",
                  }}
                >
                  <Icon
                    type={this.props.iconType}
                    style={{
                      fontSize: "7.813vw",
                      marginTop: "5.469vw",
                      marginBottom: "2.344vw",
                      color: "#E62518",
                    }}
                    data-testid="alert-icon"
                  />
                  <p style={{ font: "Inter", fontSize: "2.344vw" }}>
                    {this.props.isOneshotError ? (
                      <Trans
                        i18nKey={this.context.oneShotError?.code}
                        values={{
                          gun: GunLetters[this.context.oneShotError?.outlet],
                        }}
                      />
                    ) : (
                      this.props.errorMessage
                    )}
                  </p>

                  <Button
                    style={{
                      width: "19vw",
                      fontSize: "1.875vw",
                      fontWeight: "bold",
                      height: "4.375vw",
                      borderRadius: "2.188vw",
                      background: "rgb(230, 37, 24)",
                      color: "#ffffff",
                      boxShadow: availableButtonShadow,
                    }}
                    onClick={this.handleClose}
                    data-testid="close-button"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </React.Fragment>
          )}
        </MainContext.Consumer>
      </React.Fragment>
    );
  }
}

export default AlertBox;
