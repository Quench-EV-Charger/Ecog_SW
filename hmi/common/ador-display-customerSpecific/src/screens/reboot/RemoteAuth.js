/* eslint eqeqeq: "off"*/
import React from "react";
import { Row, Col, Icon, Typography } from "antd";

import MainContext from "../../providers/MainContext";
import Header from "../../components/Header";

import Animation from "../animation";

import * as S from "./styles";
import { isNeedUnplug } from "../../utils";

const { Title } = Typography;

class RemoteAuth extends React.Component {
  static contextType = MainContext;

  state = {
    seconds: null,
    showAnimation: false,
  };

  handleCountdown = () => {
    this.setState((prev) => ({ seconds: prev.seconds - 1 }));
  };

  routeAfterGivenTime = (rebootTimeMS) => {
    const { selectedState, changePath } = this.context;
    const isPlugged = selectedState?.pilot > 0 && selectedState?.pilot !== 7;
    const isAuth = selectedState?.auth;
    const pathToRoute = isAuth && !isPlugged ? "/plugev" : "/";
    this.timeoutToRoute = setTimeout(
      () => changePath(pathToRoute),
      rebootTimeMS
    );
  };

  componentWillMount() {
    const { config } = this.context;
    const { useAnimation } = config || {};

    // if useAnimation is enabled, show it instead of Reboot screen
    if (useAnimation?.enableOnRebootScreen) {
      this.setState({ showAnimation: true });
    }
  }

  componentDidMount() {
    const authTimerSec = 60000;
    this.setState({ seconds: authTimerSec });
    // if charging started then go to cable check
    this.routeAfterGivenTime(authTimerSec);
    this.interval = setInterval(this.handleCountdown, 1000);
  }

  componentDidUpdate() {
    const { selectedState, changePath } = this.context;
    if (
      isNeedUnplug(selectedState) &&
      selectedState?.phs == 1 &&
      [1.2].includes(selectedState?.pilot)
    ) {
      changePath("/");
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearTimeout(this.timeoutToRoute);
  }

  render() {
    if (this.state.showAnimation) {
      return <Animation useAnimation={this.context.config?.useAnimation} />;
    }

    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Header title={context.t("PLEASE_WAIT")} theme="light" />
            <Row style={S.RebootPage}>
              <Row style={S.IconContainer}>
                <Col span={24} align="middle" style={S.IconCol}>
                  <Icon className="reboot" style={S.SyncIcon} type="sync" />
                </Col>
              </Row>
              <Row style={S.RebootingTextContainer}>
                <Title style={S.Text}>
                  {context.remoteAuthMode === "SF"
                    ? context.t("REMOTE_AUTH_WAIT_SF_TEXT")
                    : context.t("REMOTE_AUTH_WAIT_TEXT")}
                </Title>
              </Row>
              <Row style={S.TimingInfoTextContainer}>
                <Title style={S.Text}>
                  {context.t("MAKE_SURE_EV_CONNECTED")}
                </Title>
              </Row>
              <Row style={S.TimingInfoTextContainer}>
                <Title style={S.Text}>
                  {context.t("REMOTE_AUTH_WAIT_TIME_TEXT")}
                </Title>
              </Row>
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default RemoteAuth;
