import React, { Component } from 'react';
import { Row, Col } from 'antd';
import * as S from "./styles";

import HomeScreenFooter from "./HomeScreenFooter";
import { withTranslation } from "react-i18next";
import MainContext from "../../providers/MainContext";

class About extends Component {

    render() {
        return (
            <MainContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        <div className="about-container">
                            <br />
                            <Row style={{ marginTop: "5vh" }} >
                                <Col offset={2} span={6}>
                                    <div className="qr-code-placeholder">
                                        <img src={'/brandings/qrCode.png'} alt="QR Code" style={S.QR} />
                                    </div>
                                </Col>
                                <Col offset={2} span={14}>
                                    <div className="charger-texts" style={S.ChargingText}>
                                        <br/>
                                        <p>
                                        SERIAL NUMBER = {context.t("SERIAL_NUMBER")}
                                        <br/>
                                        MODEL NUMBER = {context.t("MODEL_NUMBER")}
                                        <br/>
                                        MANUFACTURER = {context.t("MANUFACTURER")}
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                            <HomeScreenFooter />
                        </div>
                    </React.Fragment>
                )}
            </MainContext.Consumer>
        );
    }
}


export default withTranslation()(About);
