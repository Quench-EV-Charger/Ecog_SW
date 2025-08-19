import React from "react";
import { Row, Col, Typography } from "antd";

import MainContext from "../providers/MainContext";

import e_stop from "../assets/images/e_stop.gif";

const { Title } = Typography;

class EmergencyStop extends React.Component {
  static contextType = MainContext;

  render() {
    const { shown } = this.props;
    return (
      <div
        style={{
          background: "rgba(0, 0, 0, 0.75)",
          display: shown ? "flex" : "none",
          position: "absolute",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          zIndex: "110",
        }}
        data-testid="emergency-stop"
      >
        <Row type="flex" justify="space-between" align="middle">
          <Col span={24} align="middle">
            <img
              style={{ height: "23.438vw" }}
              alt="Error sign"
              responsive="true"
              src={e_stop}
              data-testid="stop-image"
            />
          </Col>
        </Row>
        <Row
          type="flex"
          justify="space-around"
          style={{ textAlign: "center", marginTop: "1.563vw" }}
        >
          <Col span={24}>
            <Title level={1}>
              <div
                style={{
                  color: "#E62518",
                  height: "9.375vw",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "3vw" }}>
                  {this.context.t("EMERGENCY_PRESSED")}
                </span>
                <span style={{ fontSize: "3vw" }}>
                  {this.context.t("EMERGENCY_RELEASE")}
                </span>
              </div>
            </Title>
          </Col>
        </Row>
      </div>
    );
  }
}

export default EmergencyStop;
