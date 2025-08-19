import React, { Component } from "react";

import MainContext from "../providers/MainContext";

import EcoGHoriLogoImage from "../assets/images/ecog_hori_logo.png";

class FooterView extends Component {
  static contextType = MainContext;

  render() {
    const { title } = this.props;

    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            <div className="footer" data-testid="footer">
              <span className="footer-txt">
                {title || context.t("POWERED_BY")}
              </span>
              <img
                style={{ maxHeight: 40, marginTop: "5px", marginBottom: "5px" }}
                id="logo"
                data-testid="logo-img"
                alt="EcoG Logo"
                responsive="true"
                src={EcoGHoriLogoImage}
              />
            </div>
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }
}

export default FooterView;
