/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import { Typography } from "antd";
import { Trans } from "react-i18next";

import MainContext from "../providers/MainContext";

import { GunLetters } from "../constants/constants";

const { Title } = Typography;

class Navigation extends Component {
  static contextType = MainContext;

  state = {
    outlet: this.props.selectedState?.outlet,
    shouldUseQAsOutletID: false,
  };

  componentDidMount() {
    const shouldUseQAsOutletID =
      this.context?.chargerState?.length === 1 ||
      this.context?.config?.useQAsOutletID;
    this.setState({ shouldUseQAsOutletID });
  }

  componentDidUpdate(prevProps) {
    const prevOutlet = prevProps.selectedState?.outlet;
    const outlet = this.props.selectedState?.outlet;
    if (prevOutlet != outlet && (outlet || outlet == 0)) {
      this.setState({ outlet });
    }
  }

  render() {
    const isEVConnected =
      this.context.selectedState &&
      this.context.selectedState.pilot &&
      (this.context.selectedState.pilot === 1 ||
        this.context.selectedState.pilot === 2 ||
        this.context.selectedState.phs > 1);

    const isAuthorized =
      this.context.selectedState && this.context.selectedState.auth;

    const isSFForCurrentOutlet =
      this.context.chargingMode > 0 &&
      this.context.chargingMode == this.context.selectedState?.index + 1;

    return (
      <MainContext.Consumer>
        {(context) => (
          <div
            style={{ display: "flex", flexDirection: "column" }}
            data-testid="navigation"
          >
            <div style={{ marginLeft: "1.6vw" }}>
              {!this.state.shouldUseQAsOutletID && (
                context.chargingMode==0?
                <NavigationTab
                  text={
                    <Trans
                      i18nKey="OUTLET_SELECTED"
                      values={{
                        outletType: GunLetters[this.props.selectedState?.index],
                      }}
                    />
                    
                  }
                />
                :
                <NavigationTab
                text="Dual VCCU"
              />
                
              )}
              <NavigationTab
                text={
                  isEVConnected
                    ? context.t("EV_CONNECTED")
                    : context.t("EV_NOT_CONNECTED")
                }
                additionalStyles={{
                  color: isEVConnected ? "black" : "white",
                  background: isEVConnected ? "#00FF02" : "#E62518",
                }}
              />
              <NavigationTab
                text={
                  isAuthorized
                    ? context.t("AUTHORIZED")
                    : context.t("NOT_AUTHORIZED")
                }
                additionalStyles={{
                  color: isAuthorized ? "black" : "white",
                  background: isAuthorized ? "#00FF02" : "#E62518",
                  borderTopRightRadius: "1.55vw",
                  borderBottomRightRadius: "1.55vw",
                  borderRight: "0.16vw solid black",
                }}
              />
            </div>
            {isSFForCurrentOutlet && (
              <Title
                style={{
                  fontWeight: "600",
                  fontSize: "2.25vw",
                  lineHeight: "3.2vw",
                  color: "rgba(0, 0, 0, 0.65)",
                  position: "absolute",
                  top: "5.5vw",
                  left: "1.6vw",
                }}
              >
                {context.t("Dual VCCU Mode selected")}
              </Title>
            )}
          </div>
        )}
      </MainContext.Consumer>
    );
  }
}

export default Navigation;

const NavigationTab = ({ text, additionalStyles }) => (
  <div
    style={{
      border: "0.16vw solid black",
      borderRight: "0",
      height: "3.85vw",
      fontSize: "2.2vw",
      display: "inline",
      padding: "0.395vw",
      background: "#00FF02",
      color: "black",
      ...additionalStyles,
    }}
    data-testid="navigation-tab"
  >
    {text}
  </div>
);
