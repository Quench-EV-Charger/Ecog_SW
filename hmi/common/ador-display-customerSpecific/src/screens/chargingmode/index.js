/* eslint eqeqeq: "off"*/
import React from "react";
import { Row, Icon } from "antd";
import MainContext from "../../providers/MainContext";
import ModeSelector from "../../components/ChargingMode/ModeSelector";
import { ChargingModes } from "../../constants/constants";
import * as S from "./styles";
import ModeChangeConfirmationModal from "../../components/ModeConfirmationModal";

// Utility function for local storage interactions
const setLocalStorageMode = (mode) => {
  localStorage.setItem("selectedMode", mode);
};

// Constants for timer durations
const REVERT_TIMEOUT = 20 * 1000; // 20 seconds

export class ChargingMode extends React.Component {
  static contextType = MainContext;

  state = {
    selectedMode: "0",
    showAlert: false,
    modalVisible: false,
    newMode: null,
    revertTimer: null,
  };

  handleModeSelection = (e) => {
    const { chargerState } = this.context;
    const buttonmode = e?.target?.getAttribute("buttonmode");

    if (this.state.selectedMode === this.handleChargingModeDecision(buttonmode)) {
      return; // Don't show confirmation if the mode hasn't changed
    }

    const shouldShowAlert = chargerState.some(
      (state) => state.phs !== 1 || state.pilot !== 0
    );

    if (shouldShowAlert) {
      this.showAlert();
    } else {
      this.setState({ modalVisible: true, newMode: buttonmode });
    }

    // Clear the previous timer if mode is changed
    clearTimeout(this.state.revertTimer);
  };

  handleConfirmModeChange = () => {
    const { newMode } = this.state;
    const chargingMode = this.handleChargingModeDecision(newMode);

    this.setState({ selectedMode: chargingMode, modalVisible: false });
    setLocalStorageMode(chargingMode);
    this.context.publishChargingMode(chargingMode);

    // Set a timer to revert to regular mode after 5 minutes if dual VCCU conditions are met
    if (chargingMode == 1) {
      this.startRevertTimer();
    }
  };

  startRevertTimer = () => {
    this.setState({
      revertTimer: setTimeout(() => {
        const { chargerState } = this.context;
        const isRevertConditionMet = chargerState.every(
          (state) => state.pilot === 0 && state.phs === 1
        );
  
        if (isRevertConditionMet && this.state.selectedMode === "1") {
          this.revertToRegularMode();
        }
      }, REVERT_TIMEOUT),
    });
  };
  

  revertToRegularMode = () => {
    if (this.state.selectedMode !== "0") {
      this.setState({ selectedMode: "0" });
      setLocalStorageMode("0");
      this.context.publishChargingMode("0");
      clearTimeout(this.state.revertTimer);
    }
  };

  handleCancelModeChange = () => {
    this.setState({ modalVisible: false });
  };

  handleChargingModeDecision = (buttonmode) => {
    const modeMapping = {
      [ChargingModes.R]: "0",
      [ChargingModes.DVCCU]: "1",
      [ChargingModes.SVCCU]: "2",
    };
    return modeMapping[buttonmode] || "0";
  };

  isSelected = (buttonmode) => {
    const { selectedMode } = this.state;
    return (
      (buttonmode === ChargingModes.R && selectedMode == "0") ||
      (buttonmode === ChargingModes.DVCCU && selectedMode == "1") ||
      (buttonmode === ChargingModes.SVCCU && selectedMode == "2")
    );
  };

  showAlert = () => {
    this.setState({ showAlert: true });
    setTimeout(() => {
      this.setState({ showAlert: false });
    }, 3000); // Hide after 3 seconds
  };

  componentDidMount() {
    const { publishChargingMode } = this.context;
    const storedMode = localStorage.getItem("selectedMode") || "0";

    if (this.state.selectedMode !== storedMode) {
      this.setState({ selectedMode: storedMode });
      publishChargingMode(storedMode);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { faultedOutlets, chargerState } = this.context;
  
    if (prevState.selectedMode !== this.state.selectedMode) {
      setLocalStorageMode(this.state.selectedMode);
      this.context.publishChargingMode(this.state.selectedMode);
    }
  
    if (faultedOutlets.length > 0 && this.state.selectedMode === "1") {
      if (prevState.selectedMode !== "0") {
        this.revertToRegularMode();
      }
    }

    // Extract `needsUnplug` states for both chargers
    const currentNeedsUnplug = [
      chargerState[0]?.needsUnplug,
      chargerState[1]?.needsUnplug,
    ];

    const prevNeedsUnplug = [
      prevState.chargerState?.[0]?.needsUnplug,
      prevState.chargerState?.[1]?.needsUnplug,
    ];

    // Check if any charger transitioned from `true` to `false`
    const isTransitionToFalse = currentNeedsUnplug.some(
      (current, index) => prevNeedsUnplug?.[index] === true && current === false
    );

    if (isTransitionToFalse) {
      // Transition detected, revert mode to regular
      this.revertToRegularMode();
    }

    // Update the state to track the latest chargerState
    if (prevState.chargerState !== chargerState) {
      this.setState({ chargerState });
    }
  }
  componentWillUnmount() {
    if (this.state.revertTimer) {
      clearTimeout(this.state.revertTimer);
    }
  }

  render() {
    const { showAlert, modalVisible } = this.state;
    const { faultedOutlets } = this.context;
  
    // Determine if faultedOutlets is empty or not
    const isFaultedOutletsEmpty = !faultedOutlets || faultedOutlets.length === 0;
  
    return (
      <MainContext.Consumer>
        {(context) => (
          <React.Fragment>
            {/* Show alert only when faultedOutlets is empty */}
            {showAlert && isFaultedOutletsEmpty && (
              <div style={alertStyles} data-testid="alert-prompt">
                <Icon
                  type="api"
                  style={{
                    fontSize: "7.813vw",
                    marginTop: "5.469vw",
                    marginBottom: "2.344vw",
                    color: "#E62518",
                  }}
                  data-testid="alert-icon"
                />
                <p style={{ fontFamily: "Inter", fontSize: "2vw" }}>ALERT</p>
                <p style={{ fontFamily: "Inter", fontSize: "1.5vw" }}>
                  Both chargers should be available
                </p>
              </div>
            )}
  
            <div data-testid="charging-mode-page">
              <Row style={S.ModeSelectorContainer}>
                <ModeSelector
                  isSelected={this.isSelected(ChargingModes.R)}
                  text={context.t("Regular Mode")}
                  buttonmode={ChargingModes.R}
                  onClick={this.handleModeSelection}
                />
                <ModeSelector
                  isSelected={this.isSelected(ChargingModes.DVCCU)}
                  text={context.t("Dual VCCU Mode")}
                  buttonmode={ChargingModes.DVCCU}
                  onClick={this.handleModeSelection}
                />
                <ModeSelector
                  isSelected={this.isSelected(ChargingModes.SVCCU)}
                  text={context.t("Single VCCU Mode")}
                  buttonmode={ChargingModes.SVCCU}
                  onClick={this.handleModeSelection}
                  isDisabled={true}
                />
              </Row>
            </div>
  
            <ModeChangeConfirmationModal
              visible={modalVisible}
              onConfirm={this.handleConfirmModeChange}
              onCancel={this.handleCancelModeChange}
            />
          </React.Fragment>
        )}
      </MainContext.Consumer>
    );
  }  
}

export default ChargingMode;

const alertStyles = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  zIndex: 1000,
  textAlign: "center",
};
