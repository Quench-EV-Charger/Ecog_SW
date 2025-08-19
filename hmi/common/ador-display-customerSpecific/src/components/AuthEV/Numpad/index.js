import React from "react";
import { Button } from "antd";

import MainContext from "../../../providers/MainContext";

import * as S from "./styles";

class Numpad extends React.Component {
  static contextType = MainContext;

  state = {
    isButtonDisabled: false,
  };

  handlePINClick = (numpad) => {
    const { setCurrentPIN, currentPIN, onPINSubmit, waitingForOcppMsg } =
      this.props;
    if (this.state.isButtonDisabled) return;

    let newPIN = currentPIN?.slice() || "";
    if (typeof numpad.value === "number" && currentPIN.length < 4) {
      newPIN = `${newPIN}${numpad.value}`;
      this.setState({ isButtonDisabled: true });
      setTimeout(() => this.setState({ isButtonDisabled: false }), 250);
    } else if (numpad.isBack) {
      newPIN = newPIN.slice(0, newPIN.length - 1);
    } else if (
      numpad.isEnter &&
      currentPIN.length === 4 &&
      !waitingForOcppMsg
    ) {
      onPINSubmit();
    }
    setCurrentPIN(newPIN);
  };

  render() {
    const { currentPIN, waitingForOcppMsg } = this.props;

    return (
      <div data-testid="numpad">
        <input
          type="password"
          placeholder={this.context.t("ENTER_OTP")}
          defaultValue={currentPIN}
          style={S.Input}
          data-testid="otp-input"
        />
        <div>
          {Object.values(numpads).map((numpad) => (
            <Button
              disabled={isDisabled(numpad, currentPIN, waitingForOcppMsg)}
              onClick={() => this.handlePINClick(numpad)}
              key={numpad.value}
              type="default"
              style={NumpadS(numpad, currentPIN, waitingForOcppMsg)}
            >
              <span style={NumpadValueS}>{this.context.t(numpad.value)}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }
}
export default Numpad;

const numpads = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
  { value: 8 },
  { value: 9 },
  { value: "BACK", isBack: true },
  { value: 0 },
  { value: "ENTER", isEnter: true },
];

const NumpadS = (numpad, currentPIN, waitingForOcppMsg) => ({
  borderRadius: "2.1875vw",
  width: "7.74vw",
  height: "4.53vw",
  margin: "0.775vw",
  fontSize: "2.025vw",
  fontWeight: "bold",
  boxShadow: getBoxShadow(numpad, currentPIN, waitingForOcppMsg),
  background: getButtonBackground(numpad, currentPIN, waitingForOcppMsg),
  color: getColor(numpad, currentPIN, waitingForOcppMsg),
});

const NumpadValueS = {
  display: "flex",
  justifyContent: "center",
};

const getBoxShadow = (numpad, currentPIN, waitingForOcppMsg) => {
  if (numpad.isEnter && currentPIN.length === 4 && !waitingForOcppMsg) {
    return "rgba(0,0,0,85) 0.313vw 0.313vw 0 0";
  } else {
    return "0 0.156vw 0.7vw rgba(0, 0, 0, 0.3)";
  }
};

const getButtonBackground = (numpad, currentPIN, waitingForOcppMsg) => {
  if (numpad.isEnter && currentPIN.length === 4 && !waitingForOcppMsg)
    return "rgb(230, 37, 24)";
};

const getColor = (numpad, currentPIN, waitingForOcppMsg) => {
  if (numpad.isEnter && currentPIN.length === 4 && !waitingForOcppMsg)
    return "#FFFFFF";
};

const isDisabled = (numpad, currentPIN, waitingForOcppMsg) => {
  return !!((numpad.isEnter && currentPIN.length !== 4) ||
    (numpad.isEnter && waitingForOcppMsg));
};
