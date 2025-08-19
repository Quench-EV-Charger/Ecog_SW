import { Component } from "react";

import MainContext from "../providers/MainContext";

import { max32BitInt } from "../constants/constants";

class Timer extends Component {
  static contextType = MainContext;

  timer = null;
  events = ["load", "mousemove", "mousedown", "click", "scroll", "keypress"];

  routeToHome = () => {
    const { routeTo = "/" } = this.props;
    this.context.changePath(routeTo);
  };

  startTimer = () => {
    const { timeToGoHomeSec } = this.context.config || {};
    let { timeoutSec = timeToGoHomeSec } = this.props;
    if (!timeoutSec || timeoutSec < 0 || timeoutSec > max32BitInt) {
      timeoutSec = 60;
    }
    const timeoutMs = timeoutSec * 1000;
    this.timer = setTimeout(() => this.routeToHome(), timeoutMs);
  };

  clearTimer = () => {
    if (this.timer) clearTimeout(this.timer);
  };

  resetTimer = () => {
    this.clearTimer();
    this.startTimer();
  };

  componentDidMount() {
    for (const i in this.events) {
      window.addEventListener(this.events[i], this.resetTimer);
    }
    this.startTimer();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    for (const i in this.events) {
      window.removeEventListener(this.events[i], this.resetTimer);
    }
  }

  render() {
    return null;
  }
}

export default Timer;
