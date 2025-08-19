import React, { Component } from "react";
import { Row, Typography, Icon } from "antd";

import MainContext from "../../providers/MainContext";
import Header from "../../components/Header";

import "../../styles/anims.css";
import * as S from "./styles";

const { Title } = Typography;

class ScreenInitializing extends Component {
  static contextType = MainContext;

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Header title={context.t("CHARGER_INITIALIZING")} theme="light" />
            <Row style={S.ScreenInitializingPage} data-testid="screen-initializing-page">
              <Row style={S.IconContainer}>
                <Icon
                  style={S.Icon}
                  className="flip-scale-up-hor"
                  type="clock-circle"
                />
              </Row>
              <Row style={S.TextContainer}>
                <Title style={S.Text}>{context.t("INITIALIZING")}</Title>
              </Row>
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default ScreenInitializing;
