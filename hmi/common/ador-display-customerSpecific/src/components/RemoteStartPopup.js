import React from "react";
import { Progress } from "antd";
import MainContext from "../providers/MainContext";
import plugEvImage from "../assets/images/plug-ev.png";

class RemoteStartPopup extends React.Component {
  static contextType = MainContext;

  state = {
    gun1SecondsRemaining: null,
    gun2SecondsRemaining: null,
    totalSeconds: null,
  };

  componentDidMount() {
    const { connectionTimeOut } = this.context;
    const timeout = connectionTimeOut || 60;
    this.setState({ totalSeconds: timeout });
  }

  componentDidUpdate(prevProps) {
    const { connectionTimeOut } = this.context;
    const timeout = connectionTimeOut || 60;

    // Gun 1: Start timer when popup becomes visible
    if (!prevProps.gun1Shown && this.props.gun1Shown) {
      this.setState({ gun1SecondsRemaining: timeout, totalSeconds: timeout });
      this.startGun1Countdown();
    }
    // Gun 1: Clear timer when popup is hidden
    if (prevProps.gun1Shown && !this.props.gun1Shown) {
      this.clearGun1Countdown();
      this.setState({ gun1SecondsRemaining: null });
    }

    // Gun 2: Start timer when popup becomes visible
    if (!prevProps.gun2Shown && this.props.gun2Shown) {
      this.setState({ gun2SecondsRemaining: timeout, totalSeconds: timeout });
      this.startGun2Countdown();
    }
    // Gun 2: Clear timer when popup is hidden
    if (prevProps.gun2Shown && !this.props.gun2Shown) {
      this.clearGun2Countdown();
      this.setState({ gun2SecondsRemaining: null });
    }
  }

  componentWillUnmount() {
    this.clearGun1Countdown();
    this.clearGun2Countdown();
  }

  startGun1Countdown = () => {
    this.clearGun1Countdown();
    this.gun1CountdownInterval = setInterval(() => {
      this.setState((prev) => {
        if (prev.gun1SecondsRemaining <= 1) {
          this.clearGun1Countdown();
          this.context.hideRemoteStartPopup(1);
          return { gun1SecondsRemaining: 0 };
        }
        return { gun1SecondsRemaining: prev.gun1SecondsRemaining - 1 };
      });
    }, 1000);
  };

  clearGun1Countdown = () => {
    if (this.gun1CountdownInterval) {
      clearInterval(this.gun1CountdownInterval);
      this.gun1CountdownInterval = null;
    }
  };

  startGun2Countdown = () => {
    this.clearGun2Countdown();
    this.gun2CountdownInterval = setInterval(() => {
      this.setState((prev) => {
        if (prev.gun2SecondsRemaining <= 1) {
          this.clearGun2Countdown();
          this.context.hideRemoteStartPopup(2);
          return { gun2SecondsRemaining: 0 };
        }
        return { gun2SecondsRemaining: prev.gun2SecondsRemaining - 1 };
      });
    }, 1000);
  };

  clearGun2Countdown = () => {
    if (this.gun2CountdownInterval) {
      clearInterval(this.gun2CountdownInterval);
      this.gun2CountdownInterval = null;
    }
  };

  renderGunPopup = (gunNumber, secondsRemaining, position) => {
    const { totalSeconds } = this.state;
    const { t } = this.context;
    const percent = totalSeconds ? ((secondsRemaining / totalSeconds) * 100) : 100;

    // Position the card based on gun number - left for gun 1, right for gun 2
    const isLeftSide = position === "left";

    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: isLeftSide ? "22%" : "78%",
          transform: "translate(-50%, -50%)",
          zIndex: "1000",
          pointerEvents: "auto",
        }}
        data-testid={`remote-start-popup-gun${gunNumber}`}
      >
        {/* White Card with border */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            padding: "50px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
            border: "4px solid #99B7E6",
            width: "480px",          // ⬅️ increased width
            maxWidth: "48vw",   
            height: "600px",
            marginTop: "60px",        // ⬅️ optional, larger max width
          }}

        >
          {/* Success Message */}
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <span
              style={{
                color: "#99B7E6",
                fontSize: "26px",
                fontWeight: "bold",
                display: "block",
              }}
            >
              {t ? t("AUTHORIZATION_SUCCESSFUL") : "Authorization Successful"}
            </span>
          </div>

          {/* Plug EV Image */}
          <img
            src={plugEvImage}
            alt="Plug EV"
            style={{
              width: "100%",
              height: "auto",
              marginBottom: "20px",
            }}
          />

          {/* Instruction Message */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{ color: "#333333", fontSize: "20px" }}>
              {t ? t("PLEASE_CONNECT_VEHICLE") : "Please connect your Vehicle"}
            </span>
          </div>

          {/* Circular Timer */}
          <Progress
            type="circle"
            percent={percent}
            strokeWidth={10}
            strokeColor="#ff0000ff"
            trailColor="rgba(255, 0, 0, 0.1)"
            width={100}
            format={() => (
              <span style={{ color: "#333333", fontSize: "20px", fontWeight: "bold" }}>
                {secondsRemaining}s
              </span>
            )}
          />
        </div>
      </div>
    );
  };

  render() {
    const { gun1Shown, gun2Shown } = this.props;
    const { gun1SecondsRemaining, gun2SecondsRemaining } = this.state;

    return (
      <>
        {gun1Shown && this.renderGunPopup(1, gun1SecondsRemaining, "left")}
        {gun2Shown && this.renderGunPopup(2, gun2SecondsRemaining, "right")}
      </>
    );
  }
}

export default RemoteStartPopup;
