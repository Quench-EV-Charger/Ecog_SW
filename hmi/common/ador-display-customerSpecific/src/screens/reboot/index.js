import React from "react";
import { Row, Col, Icon, Typography } from "antd";

import MainContext from "../../providers/MainContext";
import Header from "../../components/Header";

import { max32BitInt } from "../../constants/constants";
import Animation from "../animation";

import * as S from "./styles";

const { Title } = Typography;

class Reboot extends React.Component {
  static contextType = MainContext;

  state = {
    seconds: null,
    showAnimation: false,
  };

  handleCountdown = () => {
    this.setState((prev) => ({ seconds: prev.seconds - 1 }));
  };

  goHomeAfterGivenTime = (rebootTimeMS) => {
    setTimeout(() => this.context.changePath("/"), rebootTimeMS);
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
    let rebootTimeSec = this.context.config?.rebootTimeSec;
    if (!rebootTimeSec || rebootTimeSec < 0 || rebootTimeSec > max32BitInt) {
      rebootTimeSec = 300;
    }
    const rebootTimeMS = rebootTimeSec * 1000;
    this.setState({ seconds: rebootTimeSec });
    this.goHomeAfterGivenTime(rebootTimeMS);
    this.interval = setInterval(this.handleCountdown, 1000);

    if (this.context.config?.isRfidFlow) {
      if (this.context.shouldGoHomeOnSessionStart)
        this.context.setShouldGoHomeOnSessionStart(false);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    if (this.state.showAnimation) {
      return <Animation useAnimation={this.context.config?.useAnimation} />;
    }

    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <Header title={context.t("REBOOT")} theme="light" />
            <Row style={S.RebootPage} data-testid="reboot-page">
              <Row style={S.IconContainer}>
                <Col span={24} align="middle" style={S.IconCol}>
                  <Icon className="reboot" style={S.SyncIcon} type="sync" data-testid="sync-icon" />
                  <Icon style={S.PoweroffIcon} type="poweroff" data-testid="power-off-icon" />
                </Col>
              </Row>
              <Row style={S.RebootingTextContainer}>
                <Title style={S.Text}>{context.t("SYSTEM_IS_REBOOTING")}</Title>
              </Row>
              <Row style={S.TimingInfoTextContainer}>
                <Title style={S.Text}>{context.t("REBOOT_ESTIMATION")}</Title>
              </Row>
              {/* <Title level={1}>{secondsToHms(this.state.seconds)}</Title> */}
            </Row>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default Reboot;
