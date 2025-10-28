/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import "antd/dist/antd.css";
import "./styles/default.css";

import MainProvider from "./providers/MainProvider";
import Routing from "./components/Routing";
import "./styles/index.css";
import "./i18n.js";

class App extends Component {
  render() {
    return (
      <MainProvider>
        <Routing />
      </MainProvider>
    );
  }
}

export default withTranslation()(withRouter(App));
