import React, { Component } from "react";
import { Button, Typography, Row } from "antd";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import DateBox from "../../components/DateBox";

import CarImg from "../../assets/images/car_img.png";

import * as S from "./styles";

const { Title } = Typography;

class Screensaver extends Component {
  static contextType = MainContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  handleBackClick = () => {
    this.context.changePath("/");
  };

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Navbar heading={context.t("WELCOME")} theme="dark" />
            <Row style={S.ScreensaverPage} data-testid="screen-saver">
              <Row style={S.ImageRow}>
                <img style={S.Image} src={CarImg} alt="Car" data-testid="car-image" />
              </Row>
              <Row style={S.TextRow}>
                <Title style={S.Text}>{context.t("CHARGING_IN_PROGRESS")}</Title>
              </Row>
              <Row style={S.ButtonRow}>
                <Button
                  onClick={this.handleBackClick}
                  style={S.Button}
                  type="danger"
                  data-testid="back-button"
                >
                  {context.t("BACK")}
                </Button>
              </Row>
            </Row>
            <DateBox />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default Screensaver;
