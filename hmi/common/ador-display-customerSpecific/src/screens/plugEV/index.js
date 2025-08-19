import React, { Component } from "react";
import { Row, Col } from "antd";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import Navigation from "../../components/Navigation";
import DateBox from "../../components/DateBox";
import TimeoutRouter from "../../components/TimeoutRouter";
import Spinner from "../../components/Spinner";

import EcoGCar from "../../assets/images/ecog_car.svg";
import { isHandshaking } from "../../utils";

import * as S from "./styles";

class PlugEV extends Component {
  static contextType = MainContext;

  componentDidMount() {
    if (this.context.config?.isRfidFlow) {
      if (this.context.shouldGoHomeOnSessionStart)
        this.context.setShouldGoHomeOnSessionStart(false);
    }
  }

  componentDidUpdate = () => {
    const { changePath, selectedState, faultedOutlets, config, chargingMode } =
      this.context;
    if (isHandshaking(selectedState)) {
      changePath("/checkpoints");
    }

    // Go back to the home screen if outlet became faulted ONLY IF it is not in combo mode
    if (
      faultedOutlets &&
      Array.isArray(faultedOutlets) &&
      faultedOutlets.includes(selectedState?.outlet)
    ) {
      if (config?.comboMode && chargingMode > 0) {
        // do nothing: if combo mode is selected and faulted, stack may be restarting. so do not go to home screen
      } else {
        changePath("/");
      }
    }
  };

  render() {
    const { selectedState } = this.context;
    // for remote start
    const isAuthorized = selectedState && selectedState.auth;
    const spinnerShown = isAuthorized && selectedState.pilot >= 1;

    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter />
            {spinnerShown && <Spinner />}
            <Navbar heading={context.t("PLUG_EV")} theme="light" />
            <Row style={S.PlugEvPage} data-testid="plug-ev-page">
              <Row style={S.NavigationContainer}>
                <Navigation selectedState={context.selectedState} />
              </Row>
              <Row style={S.TextContainer}>
                <span style={S.Text}>{context.t("PLUG_YOUR_EV")}</span>
              </Row>
              <Row style={S.ImgContainer}>
                <EmptyCol span={7} />
                <Col span={10}>
                  <img
                    src={EcoGCar}
                    alt="car"
                    style={S.Img}
                    data-testid="car-image"
                  />
                </Col>
                <EmptyCol span={7} />
              </Row>
            </Row>
            <DateBox color="dark" />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default PlugEV;

const EmptyCol = ({ span }) => <Col span={span} />;
