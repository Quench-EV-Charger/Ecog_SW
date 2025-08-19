/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import { Col, Row, Typography } from "antd";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

import MainContext from "../providers/MainContext";

const { Title } = Typography;

class Navbar extends Component {
  static contextType = MainContext;

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

  render() {
    const { theme, transparent, title, headerColor } = this.props;
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
            data-testid="header"
          >
            <Col
              span={7}
              style={{
                height: "15vh",
                display: "flex",
                alignItems: "center",
              }}
            />
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
                {title}
              </Title>
            </Col>
            <Col
              span={7}
              style={{
                height: "15vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
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
          </Row>
        )}
      </MainContext.Consumer>
    );
  }
}

export default withTranslation()(withRouter(Navbar));
