import React from "react";

import MainContext from "../providers/MainContext";

class Spinner extends React.Component {
  static context = MainContext;

  render() {
    return (
      <MainContext.Consumer>
        {(context) => (
          <div style={{ position: "relative" }} data-testid="spinner">
            <div className="loading">Loading&#8230;</div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                position: "absolute",
              }}
            >
              <span
                style={{
                  margin: "5em 0 0 0.5em",
                  fontSize: "2em",
                  zIndex: "999",
                  color: "white",
                }}
              >
                {this.props.text || context?.t("PLEASE_WAIT")}
              </span>
            </div>
          </div>
        )}
      </MainContext.Consumer>
    );
  }
}

export default Spinner;
