import React from "react";
import { Row, Col, Typography } from "antd";

import MainContext from "../providers/MainContext";
import warning from "../assets/icons/warning.png";
import { Errors } from "../constants/Errors";

const { Title } = Typography;

class ACEnergyMeterFailure extends React.Component {
  static contextType = MainContext;

  render() {
    const { shown } = this.props;

    return (
      <div
        style={{
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: shown ? "flex" : "none",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh", // Full viewport height
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          zIndex: "110",
        }}


        data-testid="ac-energy-meter-failure"
      >
        {/* Warning Icon */}
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

        {/* Fault Messages */}
        <Row type="flex" justify="space-around">
          <Col span={24}>
            <Title level={1}>
              <span style={{ color: "#E62518", fontSize: "3vw" }}>
                {this.context.t("AC_ENERGY_METER_FAILURE")}
              </span>
            </Title>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ACEnergyMeterFailure;
