import React, { Component } from "react";
import { Row, Col, Typography, Icon } from "antd";

import MainContext from "../../providers/MainContext";
import Header from "../../components/Header";

import "../../styles/anims.css";
import * as S from "./styles";

const { Title } = Typography;

class ScreenStarting extends Component {
  static contextType = MainContext;

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Header title={context.t(" ")} theme="light" />
            <Row
              style={S.ScreenStartingPage}
              data-testid="screen-starting-page"
            >
              <Col span={8} style={S.IconCol}>
                <Icon
                  style={S.Icon}
                  className="flip-scale-up-hor"
                  type="poweroff"
                  data-testid="power-off-icon"
                />
              </Col>
              <Col span={16} style={S.TextCol}>
                <Row>
                  <Title style={S.Text}>
                    {context.t("CHARGER_GETTING_READY")},
                  </Title>
                </Row>
                <Row>
                  <Title style={S.Text}>{context.t("BRAND_PRODUCT")}</Title>
                </Row>
              </Col>
            </Row>
            <Row>
              <Title style={S.CommErrorText}>
                {context.t("COMMUNICATION_ERROR_NOT_CHARGING")}
              </Title>
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default ScreenStarting;
