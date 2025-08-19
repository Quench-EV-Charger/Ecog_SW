import React from "react";
import { Row, Col, Typography } from "antd";

import MainContext from "../providers/MainContext";

import warning from "../assets/icons/warning.png";
import { Errors } from "../constants/Errors";

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
        data-testid="power-failure"
      >
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          style={{ marginTop: "-7.813vw" }}
        >
          <Col span={24} align="middle">
            <img
              style={{ height: "23.438vw" }}
              alt="Error sign"
              responsive="true"
              src={warning}
              data-testid="warning-image"
            />
          </Col>
        </Row>
        <Row type="flex" justify="space-around">
          <Col span={24}>
            <Title level={1}>
              <span style={{ color: "#E62518", fontSize: "3vw" }}>
                {this.context.t(Errors["powerloss"])}
              </span>
            </Title>
          </Col>
        </Row>
      </div>
    );
  }
}

export default EmergencyStop;
