/* eslint eqeqeq: "off" */
import React, { Component } from "react";
import { Row, Col, Button, Typography, Icon } from "antd";

import MainContext from "../../providers/MainContext";
import Navbar from "../../components/navbar";
import TimeoutRouter from "../../components/TimeoutRouter";
import Spinner from "../../components/Spinner";
import DateBox from "../../components/DateBox";

import { elapsedTime, msToReadableTime, timestampToTime } from "../../utils";
import { GunLetters, OutletType } from "../../constants/constants";

import QuenchSymbol from "../../assets/images/quench_symbol.png";
import ChargingMode, {state} from "../chargingmode";

import * as S from "./styles";

const { Title } = Typography;

class SessionResult extends Component {
  static contextType = MainContext;

  constructor(props) {
    super(props);
    this.state = {
      sessionDetails: null,
      isAC: true,
      iswentwrong: null,
    };
  }
  state = {
    transaction: null,
  };

  componentDidMount = () => {
    const search = this.props.location?.search;
    const params = new URLSearchParams(search);
    const iswentwrong = params.get("iswentwrong");
    this.isMountedFlag = true;
    this._pollTransaction(iswentwrong);
  };

  _pollTransaction = async (iswentwrong) => {
    const API = "http://127.0.0.1:3001";
    const myHeaders = new Headers();
    myHeaders.append("db-identifer", "sessions");
    const requestOptions = { method: "GET", headers: myHeaders };

    try {
      const response = await fetch(`${API}/db/items`, requestOptions);
      const data = await response.json();
      const transaction = data[data.length - 1];
      if (transaction && this.isMountedFlag) {
        this.setState({ transaction, iswentwrong });
        return;
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
    }

    if (this.isMountedFlag) {
      this._pollTimer = setTimeout(() => this._pollTransaction(iswentwrong), 2000);
    }
  };

  componentWillUnmount() {
    this.isMountedFlag = false;
    clearTimeout(this._pollTimer);
  }

  handleDoneClick = () => {
    console.log(this.context);
    this.setState({ selectedMode: "0" });
    localStorage.setItem("selectedMode", "0");
    this.context.publishChargingMode("0");
    console.log(this.context);
    clearTimeout(this.state.revertTimer);
    this.context.changePath("/");
  };

  render() {
    console.log(this.state)
    const { transaction } = this.state;

    console.log(transaction);
    let { sessionStart, sessionStop, meterStart, meterStop, startSoC, stopSoC } = transaction || {};
    const state = this.context.selectedState;

    const outletLetter =
      state && (state.outlet || state.outlet == 0) && GunLetters[state?.index];

    let energyConsumed = meterStop - meterStart;
    energyConsumed = energyConsumed / 1000;
    // if (!isAC) energyConsumed = energyConsumed / 1000;
    energyConsumed = energyConsumed?.toFixed(3);

    if (!transaction) {
      return <Spinner />;
    }

    const isInternalError =
      this.context.selectedState?.pilot === 7 ||
      this.context.selectedState?.evsestat === 5;

    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <TimeoutRouter />
            <Navbar heading={context.t("SESSION_OVERVIEW")} theme="light" />
            <Row style={S.SessionResultPage} data-testid="session-result-page">
              {this.state.iswentwrong && isInternalError && (
                <Row style={S.InternalFaultTextContainer}>
                  <Title style={S.InternalFaultText}>
                    {context.t("UNPLUG_FAULT")}
                  </Title>
                </Row>
              )}
              <Row style={S.ThankYouTextContainer}>
                <Title style={S.ThankYouText}>
                  {context.t("THANKS_FOR_CHARGING")}
                </Title>
              </Row>
              <Row style={S.IconContainer}>
                <Icon
                  type="check-circle"
                  style={S.Icon}
                  data-testid="check-circle-icon"
                />
              </Row>
              <Row style={{ height: "35vh" }}>
                <Col
                  span={4}
                  style={{ ...S.ContentCol, justifyContent: "center" }}
                >
                  <GunLetter
                    letter={outletLetter}
                    useQAsOutletID={context.config?.useQAsOutletID}
                  />
                </Col>
                <Col span={10} style={S.ContentCol}>
                  <ResultTable
                    // isAC={isAC}
                    labels={[
                      context.t("START_TIME"),
                      context.t("STOP_TIME"),
                      context.t("TIME_TAKEN"),
                    ]}
                    values={[
                      timestampToTime(sessionStart, this?.context?.config?.timezone),
                      timestampToTime(sessionStop, this?.context?.config?.timezone),
                      elapsedTime(sessionStart, sessionStop),
                    ]}
                    renderFor={["ACDC", "ACDC", "ACDC"]}
                  />
                </Col>
                <Col span={10} style={S.ContentCol}>
                  <ResultTable
                    // isAC={isAC}
                    labels={[
                      context.t("START_SOC"),
                      context.t("STOP_SOC"),
                      context.t("ENERGY_DELIVERED"),
                    ]}
                    values={[
                      `${startSoC}%`,
                      `${stopSoC}%`,
                      `${energyConsumed} kWh`,
                    ]}
                    renderFor={["DC", "DC", "ACDC"]}
                  />
                </Col>
              </Row>
              <Row style={S.ButtonContainer}>
                <Button
                  onClick={this.handleDoneClick}
                  style={S.Button}
                  data-testid="done-button"
                >
                  {context.t("DONE")}
                </Button>
              </Row>
            </Row>
            <DateBox color="dark" />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default SessionResult;

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
    }}
  >
    {useQAsOutletID ? "" : letter}
  </div>
);

export const ResultTable = ({ labels, values, isAC, renderFor }) => (
  <table style={{ width: "90%", color: "#E62518" }} data-testid="result-table">
    <tbody>
      {labels &&
        Array.isArray(labels) &&
        labels.map((label, idx) => {
          if (isAC && renderFor[idx] === "DC") return null;
          return (
            <tr key={label}>
              <td>{label}</td>
              <td>{values[idx]}</td>
            </tr>
          );
        })}
    </tbody>
  </table>
);
