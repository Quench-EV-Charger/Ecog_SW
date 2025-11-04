/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import { Col, Row, Typography } from "antd";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

import MainContext from "../../providers/MainContext";
import NavbarButton from "./NavbarButton";
import LanguageDropdown from "./LanguageDropdown";

const { Title } = Typography;

class Navbar extends Component {
  static contextType = MainContext;

  handleInfoClick = () => {
    const { changePath } = this.context;
    changePath("/Info");
  }

  handleHomeClick = () => {
    const { changePath } = this.context;
    changePath("/");
  };

  handleLanguageClick = (language) => {
    this.props.i18n.changeLanguage(language.key);
  };

  handleSettingsClick = () => {
    const { changePath } = this.context;
    changePath("/settings");
  };

  getLogo = () => {
    const { theme } = this.props;
    const { config } = this.context;
    let lightThemeLogo = config?.branding?.brandingLogo?.lightTheme || "";
    let darkThemeLogo = config?.branding?.brandingLogo?.darkTheme || "";
    if (!lightThemeLogo) lightThemeLogo = darkThemeLogo;
    if (!darkThemeLogo) darkThemeLogo = lightThemeLogo;
    if (theme === "light") return lightThemeLogo;
    return darkThemeLogo;
  };

  shouldHomeBtnDisabled = () => {
    return (
      this.context.showAlert || this.props.location?.pathname === "/checkpoints"
    );
  };

  render() {
    const { theme, transparent, heading, headerColor } = this.props;
    const headingColor = headerColor
      ? headerColor
      : theme === "dark"
      ? "white"
      : "#373744";

    return (
      <MainContext.Consumer>
        {(context) => (
          <Row
            style={{
              padding: "15px",
              minHeight: "15vh",
              maxHeight: "15vh",
              opacity: transparent ? "0.7" : "1",
              backgroundColor: theme === "dark" ? "#373744" : "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            data-testid="navbar"
          >
            <Col
              span={7}
              style={{ height: "15vh", display: "flex", alignItems: "center" }}
            >
              {context.config?.branding?.enable && (
                <img
                  src={`/brandings/${this.getLogo()}`}
                  alt="Brand logo"
                  style={{
                    width: "auto",
                    height: "auto",
                    maxHeight: "60%",
                    maxWidth: "60%",
                  }}
                />
              )}
            </Col>
            <Col
              span={10}
              style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Title
                style={{
                  color: headingColor,
                  fontSize: "4.5vh",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                {heading}
              </Title>
            </Col>
            <Col
              span={7}
              style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Row
                style={{
                  width: "90%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <NavbarButton
                  iconSize="2.5vw"
                  disabled={true}
                  theme={theme}
                  iconType="wifi"
                  strikethrough={!context.networkAccess}
                  additionalStyles={{
                    boxShadow: "none",
                    border: "none",
                  }}
                />
                <NavbarButton
                  iconSize="2.5vw"
                  disabled={true}
                  theme={theme}
                  iconType="cloud-upload"
                  strikethrough={!context.ocppOnline}
                  additionalStyles={{
                    boxShadow: "none",
                    border: "none",
                  }}
                />

                <NavbarButton
                  disabled={this.shouldHomeBtnDisabled()}
                  theme={theme}
                  onClick={this.handleHomeClick}
                  iconType="home"
                  additionalStyles={{
                    opacity: this.shouldHomeBtnDisabled() ? "0.35" : "1",
                  }}
                />
                <NavbarButton
                  theme={theme}
                  onClick={this.handleSettingsClick}
                  iconType="setting"
                />
                <NavbarButton theme={theme}>
                  <LanguageDropdown
                    theme={theme}
                    onClick={this.handleLanguageClick}
                    language={this.props.i18n?.language}
                    languages={context?.config?.languages}
                  />
                </NavbarButton>

                <NavbarButton
                  // iconSize="2.5vw"
                  disabled={this.shouldHomeBtnDisabled()}
                  theme={theme}
                  iconType="info-circle"
                  onClick={this.handleInfoClick}
                  additionalStyles={{
                    opacity: this.shouldHomeBtnDisabled() ? "0.35" : "1",
                  }}

                />
              </Row>
            </Col>
          </Row>
        )}
      </MainContext.Consumer>
    );
  }
}

export default withTranslation()(withRouter(Navbar));
