import React, { Component } from "react";
import MainContext from "../../providers/MainContext";
import { Row, Col } from "antd";
import * as S from "./styles";
import { withTranslation } from "react-i18next";
import SessionsFooter from "../Sessions/SessionsFooter";
// import HomeScreenFooter from "./HomeScreenFooter";

class Temps extends Component {
    static contextType = MainContext;
    render() {
        const chargerState = this.context.chargerState;

        return (
            <MainContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        
                        <Row style={{ marginTop: "8vh" ,marginBottom: "98px"}}>
                            <Col span={8} offset={6} style={S.ChargingText}>
                                <h2>
                                    Gun A DC+ Temperature:
                                </h2>

                                {((chargerState[0].temperatures.CCS_A2_temp) || (chargerState[0].temperatures.cable_temp_2)) && <h2>
                                    Gun A DC- Temperature:
                                </h2>}
                                {chargerState[0].temperatures.CCS_B1_temp && <h2>
                                    Gun B DC+ Temperature:
                                </h2>}

                                {chargerState[0].temperatures.CCS_B2_temp && <h2>
                                    Gun B DC- Temperature:
                                </h2>}

                                <h2>
                                    Cabinet Temperature:
                                </h2>
                                <h2>
                                    Inlet Temperature:
                                </h2>
                            </Col>
                            <Col span={3} style={S.ChargingText}>
                                <h2>
                                    {chargerState[0].temperatures.CCS_A1_temp?.toFixed(1) || chargerState[0].temperatures.cable_temp_1?.toFixed(1)} °C
                                </h2>
                                {((chargerState[0].temperatures.CCS_A2_temp) || (chargerState[0].temperatures.cable_temp_2?.toFixed(1))) && <h2>
                                    {chargerState[0].temperatures.CCS_A2_temp?.toFixed(1) || (chargerState[0].temperatures.cable_temp_2?.toFixed(1))} °C
                                </h2>}
                                {chargerState[0].temperatures.CCS_B1_temp && <h2>
                                    {chargerState[0].temperatures.CCS_B1_temp?.toFixed(1)} °C
                                </h2>}
                                {chargerState[0].temperatures.CCS_B2_temp && <h2>
                                    {chargerState[0].temperatures.CCS_B2_temp?.toFixed(1)} °C
                                </h2>}
                                <h2>
                                    {chargerState[0].temperatures.cabinet_temp?.toFixed(1)} °C
                                </h2>
                                <h2>
                                    {chargerState[0].temperatures.outlet_temp?.toFixed(1)} °C
                                </h2>
                            </Col>
                        </Row>
                        {/* <br />
                        <Row>
                            <Col span={24} style={{
                                textAlign: "center", fontSize: "3vh",
                                color: "rgb(55, 55, 68)",
                            }}>
                                <h2>
                                    {"L1"}:{" "}
                                    {!!chargerState &&
                                        !!chargerState[0].can1_RX_m0_inputVoltage_AB &&
                                        chargerState[0].can1_RX_m0_inputVoltage_AB.toFixed(2)}{""}
                                    V
                                    {", L2"}:{" "}
                                    {!!chargerState &&
                                        !!chargerState[0].can1_RX_m0_inputVoltage_BC &&
                                        chargerState[0].can1_RX_m0_inputVoltage_BC.toFixed(2)}{""}
                                    V
                                    {", L3"}:{" "}
                                    {!!chargerState &&
                                        !!chargerState[0].can1_RX_m0_inputVoltage_CA &&
                                        chargerState[0].can1_RX_m0_inputVoltage_CA.toFixed(2)}{""}
                                    V
                                </h2>
                            </Col>
                        </Row> */}
                        <SessionsFooter></SessionsFooter>
                    </React.Fragment>
                )}
            </MainContext.Consumer>
        );
    }
}

export default withTranslation()(Temps);