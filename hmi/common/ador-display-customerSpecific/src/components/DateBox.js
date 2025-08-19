import React, { Component } from "react";

import moment from "moment-timezone";

class DateBox extends Component {
  render() {
    const { color } = this.props;
    return (
      <p
        style={{
          margin: 0,
          right: 0,
          bottom: 0,
          padding: "0 1.15vw 1.15vw 0",
          position: "absolute",
          fontSize: "2vw",
          color: color === "dark" ? "rgba(230, 37, 24, 1)" : "white",
          // textShadow: color === "dark" ? "1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black" : "2px 2px 0 white, -2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white",

        }}
        data-testid="date-box"
      >
        {moment().format("HH:mm")} {moment().format("DD/MM/YYYY")}
      </p>
    );
  }
}

export default DateBox;
