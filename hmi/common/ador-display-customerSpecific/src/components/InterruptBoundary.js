import React from "react";

import ScreenStarting from "../screens/screenstarting";
import ConnectChargeCable from "../screens/connectchargecable";
import ScreenInitializing from "../screens/screeninitializing";
import AlertScreen from "../screens/alerts";
import Animation from "../screens/animation";

const InterruptBoundary = ({
  showAlert,
  SECCreachable,
  isChargeCableConnected,
  initializing,
  config,
  children,
  isCommunicationError,
}) => {
  const useAnimationEnabled = config?.useAnimation?.enableOnStartingPage;

  if (showAlert) {
    return (
      <div className="container">
        <AlertScreen />
      </div>
    );
  } else if (!SECCreachable && !useAnimationEnabled && !isCommunicationError) {
    /* !isCommunicationError -> prevent to see ScreenStarting just before communication error
    because SECCreachable affects render before than showAlert in communication error case */
    return (
      <div className="container">
        <ScreenStarting />
      </div>
    );
  } else if (!SECCreachable && useAnimationEnabled) {
    // if useAnimation is enabled, show it instead of Starting screen
    return (
      <div className="container">
        <Animation useAnimation={config?.useAnimation} />
      </div>
    );
  } else if (!isChargeCableConnected) {
    return (
      <div className="container">
        <ConnectChargeCable />
      </div>
    );
  } else if (initializing) {
    return (
      <div className="container">
        <ScreenInitializing />
      </div>
    );
  } else {
    return children;
  }
};

export default InterruptBoundary;
