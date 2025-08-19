import React, { useContext } from "react";
import { Row, Col } from "antd";
import * as S from "./styles";
import { withTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

const Temps = () => {
  const { chargerState } = useSelector((state) => state.charging);
  const { theme, toggleTheme } = useContext(ThemeContext);

  if (!chargerState || !chargerState[0]?.temperatures) return null;

  const temperatures = chargerState[0].temperatures;


  return (
    <>
      <Row
        style={{
          marginTop: "6vh",
          marginLeft: "20px",
          marginRight: "20px",
          boxShadow: "0 0 8px rgb(136 171 226)",
          borderRadius: "6px",
        }}
      >
        <Col span={8} offset={6} style={S.ChargingText(theme)}>
          <h2>Gun A DC+ Temperature:</h2>

          {(temperatures.CCS_A2_temp || temperatures.cable_temp_2) && (
            <h2>Gun A DC- Temperature:</h2>
          )}

          {temperatures.CCS_B1_temp && <h2>Gun B DC+ Temperature:</h2>}

          {temperatures.CCS_B2_temp && <h2>Gun B DC- Temperature:</h2>}

          <h2>Cabinet Temperature:</h2>
          <h2>Inlet Temperature:</h2>
        </Col>

        <Col span={3} style={S.ChargingText(theme)}>
          <h2>
            {temperatures.CCS_A1_temp?.toFixed(1) ||
              temperatures.cable_temp_1?.toFixed(1)}{" "}
            °C
          </h2>

          {(temperatures.CCS_A2_temp || temperatures.cable_temp_2) && (
            <h2>
              {temperatures.CCS_A2_temp?.toFixed(1) ||
                temperatures.cable_temp_2?.toFixed(1)}{" "}
              °C
            </h2>
          )}

          {temperatures.CCS_B1_temp && (
            <h2>{temperatures.CCS_B1_temp.toFixed(1)} °C</h2>
          )}

          {temperatures.CCS_B2_temp && (
            <h2>{temperatures.CCS_B2_temp.toFixed(1)} °C</h2>
          )}

          <h2>{temperatures.cabinet_temp?.toFixed(1)} °C</h2>
          <h2>{temperatures.outlet_temp?.toFixed(1)} °C</h2>
        </Col>
      </Row>

      {/* Optional voltage display */}
      {/* <Row>
                <Col span={24} style={{
                    textAlign: "center", fontSize: "3vh",
                    color: "rgb(55, 55, 68)",
                }}>
                    <h2>
                        L1: {chargerState[0]?.can1_RX_m0_inputVoltage_AB?.toFixed(2)} V,
                        L2: {chargerState[0]?.can1_RX_m0_inputVoltage_BC?.toFixed(2)} V,
                        L3: {chargerState[0]?.can1_RX_m0_inputVoltage_CA?.toFixed(2)} V
                    </h2>
                </Col>
            </Row> */}
    </>
  );
};

export default withTranslation()(Temps);
