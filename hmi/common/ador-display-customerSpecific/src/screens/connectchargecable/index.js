import React, { Component } from "react";
import { Row, Typography, Icon } from "antd";

import MainContext from "../../providers/MainContext";
import Header from "../../components/Header";

import * as S from "./styles";

const { Title } = Typography;

class ScreenNoCable extends Component {
  static contextType = MainContext;

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Header title={context.t("INSTALL_CHARGE_CABLE")} theme="light" />
            <Row style={S.ConnectChargeCablePage} data-testid="screen-no-cable">
              <Row style={S.IconContainer}>
                <Icon style={S.Icon} type="pause-circle" data-testid="pause-circle-icon"/>
              </Row>
              <Row style={S.TextContainer}>
                <Title style={S.Text}>{context.t("INSTALL_CHARGE_CABLE")}</Title>
              </Row>
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default ScreenNoCable;
