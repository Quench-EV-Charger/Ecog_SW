import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import mqtt from "mqtt";

import Navbar from "../navbar/Navbar.js";
import * as S from "./style";
import OutletCard from "../OutletCard/OutletCard.js";
import Footer from "../Footer/Footer";
import Startup from "../LoadingScreen/Startup";
import Info from "../InfoTab/Info.js";
import Setting from "../Setting/Setting.js";
import e_stop from "../../assets/images/e_stop.gif";
import warning_icon from "../../assets/icons/warning.png";
import { ThemeContext } from "../../components/ThemeContext/ThemeProvider.js";

import {
  setSECCreachable,
  setActiveConnector,
} from "../../redux/chargingSlice";
import { timeout } from "../../Utilis/UtilityFunction";
import { startupApiCall } from "../../services/servicesApi";
import ErrorOverlay from "../ErrorsScreen/ErrorOverlay.js";
import RfidDisconnectedPopup from "../OutletCard/GunAlerts/RfidDisconnectedPopup.js";
import EVChargerStatus from "../ErrorsScreen/EvChargerStatus.js";
import RebootScreen from "../LoadingScreen/RebootScreen.js";



const ERROR_OVERLAYS = [
  {
    condition: (code) => code === "powerloss",
    messages: ["POWER_FAILURE"],
  },
  {
    condition: (code) => code === "CHARGER_DOOR_OPEN",
    messages: ["INTERNAL_CABINET_EXCEPTION", "CHARGER_DOOR_OPEN"],
  },
  {
    condition: (code) => code === "OUTLET_TEMP",
    messages: ["INTERNAL_CABINET_EXCEPTION", "OUTLET_TEMP"],
  },
  {
    condition: (code) => code === "CAB_TEMP",
    messages: ["INTERNAL_CABINET_EXCEPTION", "CAB_TEMP"],
  },
  {
    condition: (code) => code === "ERR_OVER_VOLTAGE",
    messages: ["INTERNAL_CABINET_EXCEPTION", "ERR_OVER_VOLTAGE"],
  },
  {
    condition: (code) => code === "ERR_UNDER_VOLTAGE",
    messages: ["INTERNAL_CABINET_EXCEPTION", "ERR_UNDER_VOLTAGE"],
  },
  {
    condition: (code) => code === "ERR_POWER_MODULE_FAILURE",
    messages: ["INTERNAL_CABINET_EXCEPTION", "ERR_POWER_MODULE_FAILURE"],
  },
  {
    condition: (code) => code === "GROUND_FAULT",
    messages: ["INTERNAL_CABINET_EXCEPTION", "GROUND_FAULT"],
  },
];

function Dashboard() {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const DASHBOARD_STYLE = {
    display: "flex",
    flexDirection: "row",
    gap: "25px",
    justifyContent: "center",
    margin: "10px 25px 0 25px",
    background:
      theme === "dark"
        ? "linear-gradient(180deg, #000000 25%, #2A2A3A 100%)"
        : "white",
  };
  const {
    SECCreachable,
    chargerState,
    config,
    ipcClientRoute,
    activeConnector,
    showEStop,
    errorCode,
  } = useSelector((state) => state.charging);

  const [spinner, setSpinner] = useState(!SECCreachable);
  const [selectedTab, setSelectedTab] = useState("home");
  const [isRebooting, setIsRebooting] = useState(false)
  const [statusMap, setStatusMap] = useState({});
  const [showChargerDisconnected, setShowChargerDisconnected] = useState(false);
  const prevSECCReachableRef = useRef(SECCreachable);
  const intervalIdRef = useRef(null);

  const fetchConnectorState = useCallback(async () => {
    if (!config?.checkSECC) return;

    try {
      const active = await timeout(
        5000,
        fetch(`http://${config.checkSECC}/api/`, { mode: "no-cors" }).then(
          (res) => parseInt(res.text(), 10)
        )
      );

      if (active !== activeConnector) {
        dispatch(setActiveConnector(active));
      }

      if (!SECCreachable) {
        dispatch(setSECCreachable(true));
      }
      // const err = "error"
      // throw err
    } catch (err) {
      console.error("Error getting connector state:", err);
      dispatch(setActiveConnector(0));
      dispatch(setSECCreachable(false)); // Important: Mark as unreachable
    }
  }, [config?.checkSECC, activeConnector, dispatch, SECCreachable]);

  // Startup API call - executes once when component mounts
  useEffect(() => {
    const executeStartupApiCall = async () => {
      if (config && config.API) {
        try {
          // Use the API endpoint from config, or fallback to a default endpoint
          const apiEndpoint = `${config.API}/store/charger-config`;
          await startupApiCall(config, apiEndpoint);
        } catch (error) {
          // Error is already logged in the startupApiCall function
          console.log("Startup API call failed, continuing with application startup");
        }
      }
    };

    // Only execute if config is available
    if (config) {
      executeStartupApiCall();
    }
  }, [config]); // Depend on config to ensure it's loaded before API call

  useEffect(() => {
    if (config?.checkSECC && !intervalIdRef.current) {
      intervalIdRef.current = setInterval(fetchConnectorState, 1000);
    }

    return () => {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    };
  }, [config, fetchConnectorState]);

  useEffect(() => {
    setSpinner(!SECCreachable);
  }, [SECCreachable]);

  // Detect SECC lost after being reachable
  useEffect(() => {
    if (prevSECCReachableRef.current && !SECCreachable) {
      setShowChargerDisconnected(true);
    }
    prevSECCReachableRef.current = SECCreachable;
  }, [SECCreachable]);

  useEffect(() => {
    const ipcClient = mqtt.connect(ipcClientRoute);

    ipcClient.on("connect", () => {
      console.log("Connected to IPC MQTT broker...");
      ipcClient.subscribe(["ocpp-client", "whitelist-service"]);
    });

    ipcClient.on("message", (_, payload) => {
      try {
        const parsed = JSON.parse(payload);
        ["auth-res", "reset", "remoteauth"].forEach((eventType) =>
          window.dispatchEvent(new CustomEvent(eventType, { detail: parsed }))
        );
      } catch (err) {
        console.error("Invalid MQTT payload:", err);
      }
    });

    const handleReset = (e) => {
      const data = e.detail;
      if (data.type === "reset" && data.payload?.reboot) {
        setIsRebooting(true)      
      }
    };

    window.addEventListener("reset", handleReset);

    return () => {
      ipcClient.end();
      window.removeEventListener("reset", handleReset);
    };
  }, [ipcClientRoute]);

  const handleStatusChange = (outletId, newStatus) => {
    setStatusMap((prev) => ({ ...prev, [outletId]: newStatus }));
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "home":
        return (
          <div style={DASHBOARD_STYLE}>
            {chargerState.map((outlet, index) => (
              <OutletCard
                key={index}
                eachOutlet={outlet}
                status={statusMap[outlet.outlet] || "initial"}
                onStatusChange={(newStatus) =>
                  handleStatusChange(outlet.outlet, newStatus)
                }
              />
            ))}
          </div>
        );
      case "info":
        return <Info />;
      case "setting":
        return <Setting />;
      default:
        return null;
    }
  };

  return (
    <>
      {isRebooting ? (
        <RebootScreen />
      ) : (
        <>
          <div style={S.getDashBackground(theme)}>
            {spinner ? (
              <Startup message={
                showChargerDisconnected
                  ? "INTERNAL ERROR (ERROR CODE:9) OCCURRED"
                  : undefined
              } />
            ) : !chargerState[0] ? (
              <EVChargerStatus/>
            ) : (
              <>
                <Navbar onTabChange={setSelectedTab} />
                {renderContent()}
                <Footer />
                {chargerState[0] && (
                  <RfidDisconnectedPopup
                    isDisconnected={!chargerState[0]?.RFIDConnected}
                  />
                )}
              </>
            )}
          </div>
          <ErrorOverlay
            shown={showEStop}
            image={e_stop}
            altText="Emergency stop"
            messages={["EMERGENCY_PRESSED", "EMERGENCY_RELEASE"]}
          />
  
          {ERROR_OVERLAYS.map(({ condition, messages }, i) =>
            condition(errorCode) ? (
              <ErrorOverlay
                key={i}
                shown
                image={warning_icon}
                altText="Warning"
                messages={messages}
              />
            ) : null
          )}
        </>
      )}
    </>
  );
}

export default Dashboard;
