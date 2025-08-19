import React, { Component } from "react";
import { Row, Col, Typography } from "antd";
import { withRouter } from "react-router-dom";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import AlertBox from "../../components/AlertBox";
import TimeoutRouter from "../../components/TimeoutRouter";
import DateBox from "../../components/DateBox";

import QuenchSymbol from "../../assets/images/quench_symbol.png";
import EcoGCarUnplug from "../../assets/images/ecog_car_unplug.png";
import { GunLetters } from "../../constants/constants";

import * as S from "./styles";

const { Title } = Typography;

const EmptyRow = () => <Row style={{height: "10vh"}}/>;

class UnplugEV extends Component {
  static contextType = MainContext;

  state = {
    isTimeout: null,
  };

  componentDidMount() {
    const search = this.props.location.search;
    const params = new URLSearchParams(search);
    const isTimeout = params.get("isTimeout");
    this.setState({ isTimeout });

    if (this.context.config?.isRfidFlow) {
      if (this.context.shouldGoHomeOnSessionStart)
        this.context.setShouldGoHomeOnSessionStart(false);
    }
  }

  render() {
    const { t, selectedState } = this.context;
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter />
            <Navbar
              heading={context.t("UNPLUG_EV")}
              theme="light"
              headerColor="#00B051"
            />
            <AlertBox
              iconType="warning"
              display={this.state.isTimeout}
              onClose={() => this.setState({ isTimeout: null })}
              errorMessage={context.t("UNPLUG_TIMEOUT")}
              width="55.859vw"
              height="32.813vw"
            />
            <Row style={S.UnplugEVPage} data-testid="unplug-ev-page">
              <EmptyRow />
              <Row style={S.GunLetter}>
                <GunLetter
                  letter={GunLetters[selectedState?.index]}
                  useQAsOutletID={context?.config?.useQAsOutletID}
                />
              </Row>
              <Row style={S.Content}>
                <Col style={S.FullHeight} span={1}/>
                <Col style={S.FullHeight} span={11}>
                  <img src={EcoGCarUnplug} alt="car" style={S.Img} data-testid="car-image"/>
                </Col>
                <Col style={{ ...S.FullHeight, ...S.TextCol }} span={11}>
                  <Title style={S.Text}>
                    {t("CHARGING_FINISHED")} {t("UNPLUG_EV_TXT")}
                  </Title>
                </Col>
                <Col style={S.FullHeight} span={1}/>
              </Row>
              <EmptyRow />
            </Row>
            <DateBox color="dark" />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default withRouter(UnplugEV);

const GunLetter = ({ letter, useQAsOutletID }) => (
  <div
    style={{
      backgroundColor: "#E62518",
      border: useQAsOutletID ? "none" : "0.156vw solid  #0070c0",
      boxShadow: "0.078vw 0.313vw 0.938vw rgba(0, 0, 0, 0.08)",
      borderRadius: "50%",
      color: "#FFFFFF",
      height: "12vh",
      width: "12vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "2.5vw",
      fontWeight: "bold",
      backgroundImage: useQAsOutletID ? `url(${QuenchSymbol})` : null,
      backgroundSize: useQAsOutletID ? "cover" : null,
      marginLeft: "37.5vh",
    }}
  >
    {useQAsOutletID ? "" : letter}
  </div>
);
