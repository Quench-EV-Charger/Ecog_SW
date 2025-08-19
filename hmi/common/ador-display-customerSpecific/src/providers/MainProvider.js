import React, { Component } from 'react';
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

import ContextProvider from "./ContextProvider";

class MainProvider extends Component {
  render() {
    return (
      <ContextProvider>
        {this.props.children}
      </ContextProvider>
    )
  }
}

export default withTranslation()(withRouter(MainProvider));
