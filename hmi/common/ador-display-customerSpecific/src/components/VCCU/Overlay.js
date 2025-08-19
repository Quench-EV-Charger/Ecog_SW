import React, { Component } from "react";
import { Icon } from "antd";
import MainContext from "../../providers/MainContext";

class OverlayVCCU extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ANPRMessage: '',
      prevANPRMessage: '',
      displayANPR: true
    };
  }

  static contextType = MainContext;

  render() {
    const { display, title, message, iconType, width, height } = this.props;

    return display ? (
      <div
        style={{
          height: "100vh",
          width: "100%",
          background: "rgba(255,255,255, 0.8)",
          zIndex: "1000",
          position: "fixed",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        data-testid="alert-box"
      >
        <div
          style={{
            width: width || "53.047vw",
            textAlign: "center",
            background: "white",
            height: height || "30vw",
            boxShadow: "0px 1.094vw 8.203vw rgba(0, 0, 0, 0.3)",
            position: "absolute",
            zIndex: "3",
          }}
        >
          <Icon
            type="api"
            style={{
              fontSize: "7.813vw",
              marginTop: "5.469vw",
              marginBottom: "2.344vw",
              color: "#E62518",
            }}
            data-testid="alert-icon"
          />
          <p style={{ font: "Inter", fontSize: "2vw" }}>
            {title || "Dual VCCU Mode selected"} {/* Default title */}
          </p>
          <p style={{ font: "Inter", fontSize: "1.5vw" }}>
            {message } {/* Default message */}
          </p>
        </div>
      </div>
    ) : null;
  }
}

export default OverlayVCCU;
