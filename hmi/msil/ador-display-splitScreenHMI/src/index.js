import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import store from "./redux/store";
import { initializeConfig } from "./redux/chargingSlice";
import { fetchChargerState } from "./redux/chargerAction";
import { checkNetworkAccess, checkOCPPStatus } from "./Utilis/UtilityFunction";
import ThemeProvider from "./components/ThemeContext/ThemeProvider";

// Initialize config
store
  .dispatch(initializeConfig())
  .then(() => {
    // Fetch charger state once initially
    store.dispatch(fetchChargerState());

    // Then fetch charger state every second
    setInterval(() => {
      store.dispatch(fetchChargerState());
    }, 1000);

    // Start OCPP and Network Access checks
    setInterval(() => checkOCPPStatus(), 10000); // prettier-ignore
    setInterval(checkNetworkAccess, 10000);
  })
  .catch((err) => {
    console.error("Error initializing config:", err);
  });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
