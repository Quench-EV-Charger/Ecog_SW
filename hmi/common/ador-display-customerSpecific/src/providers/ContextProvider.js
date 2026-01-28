/* eslint eqeqeq: "off"*/
import React, { Component } from "react";
import mqtt from "mqtt";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import ReconnectingWebSocket from "reconnecting-websocket";
import moment from "moment-timezone";

import Animation from "../screens/animation";
import InterruptBoundary from "../components/InterruptBoundary";
import Spinner from "../components/Spinner";
import MainContext from "./MainContext";
import { RfidSuffix, ChargingModes } from "../constants/constants";
import AlertBox from "../components/AlertBox";
import RemoteStartPopup from "../components/RemoteStartPopup";
import SessionSummaryPopup from "../components/SessionSummaryPopup";

import {
  buildConfig,
  clearRfid,
  deAuthorize,
  findDifferentElementInArray,
  getAllOutletsAsOutOfOrder,
  getCleanedPreventAutoRouteOutlets,
  getFirstOutletIdToAllowAutoRoute,
  getPreparingOutletsIds,
  getReservedOutlets,
  getState,
  getStoppingOutlets,
  getTheOneAuthenticated,
  inStoppingProccess,
  isActive,
  isArrayOfStringsSame,
  isErrorStillValid,
  isHandshaking,
  isNeedUnplug,
  isOutletPreparing,
  isSomeActive,
  timeout,
} from "../utils";
import { addOrUpdateSessionToDb, deleteSession, fetchSessionByOutletAndUser } from "../localDb/dbActions";
import {
  fetchCombo,
  resetCombo,
  shouldResetCombo,
} from "../helpers/ComboHelpers";
import {
  getActiveOutlets,
  getAvailableOutlets,
  getBlockedOutlets,
  getFaultedOutlets,
  getFaultedOutletsTime,
  getHackedFaultedOutlets,
  getInoperativeOutlets,
} from "../helpers/ChargerStateHelpers";
import { handleOutletSelect, handleRfidFlow } from "../helpers/RfidFlowHelpers";
import { OneShotErrors } from "../constants/Errors";
import { ChargingMode } from "../screens/chargingmode"
import { startupApiCall } from "../apis/Queries";

const importAll = (r) => r.keys().map(r);

class ContextProvider extends Component {
  prevSelectedState = null;
  sessionSummaryPopupProcessing = false; // ✅ Sync flag to prevent re-entry
  displayedSessionHash = null; // ✅ Track hash of last displayed session to prevent re-rendering

  state = {
    t: this.props.t,
    chargerState: [],
    isCommunicationError: false,
    config: {},
    isChargeCableConnected: false,
    activeConnector: 0,
    SECCreachable: false,
    showAlert: false,
    errorCode: null,
    selectedState: {},
    setSelectedState: (selectedState) => this.setState({ selectedState }),
    faultedOutlets: [],
    faultedOutletsTime: {},
    blockedOutlets: [],
    availableOutlets: [],
    changePath: (path) => {
      if (this.props.history.location.pathname !== path) {
        // Hide remote start popup when navigating away from valid screens (home, charging, stopping, unplugev)
        const validScreens = ["/", "/charging", "/stopping", "/unplugev"];
        const isLeavingValidScreen = validScreens.includes(this.props.history.location.pathname) && !validScreens.includes(path);
        if (isLeavingValidScreen) {
          this.hideRemoteStartPopup(1);
          this.hideRemoteStartPopup(2);
        }
        this.props.history.push(path);
      }
    },
    ipcClient: mqtt.connect("ws://127.0.0.1:2000"),
    showEStop: false,
    eStopRoutingHandled: false,
    powerFailureRoutingHandled: false,
    outletToShowOnEStopRelease: null,
    activeOutlets: [],
    chargingMode: 0,
    setChargingMode: (chargingMode) => this.setState({ chargingMode }),
    preventAutoRoute: false,
    setPreventAutoRoute: (preventAutoRoute) =>
      this.setState({ preventAutoRoute }),
    stoppingOutlet: false,
    ocppOnline: false,
    networkAccess: false,
    errTogglingTimeout: false,
    seccTimeSynced: false,
    setSeccTimeSynced: (seccTimeSynced) => this.setState({ seccTimeSynced }),
    reservedOutlets: [],
    showBootingScreen: false,
    stoppingOutlets: [],
    preventAutoRouteOutlets: [],
    addPreventAutoRouteOutlets: (outletState) =>
      this.setState((prev) => ({
        preventAutoRouteOutlets: [...prev.preventAutoRouteOutlets, outletState],
      })),
    firstOutletIdToAllowAutoRoute: null,
    preparingOutletsIds: [],
    shouldGoHomeOnSessionStart: false,
    setShouldGoHomeOnSessionStart: (shouldGoHomeOnSessionStart) => this.setState({ shouldGoHomeOnSessionStart }), // prettier-ignore
    remoteAuthMode: null,
    allowToPublishNetworkAccess: false,
    showHandshakeErrorModal: false,
    setShowHandshakeErrorModal: (showHandshakeErrorModal) =>
      this.setState({ showHandshakeErrorModal }),
    publishChargingMode: (chargingMode) =>
      this.publishChargingMode(chargingMode),
    errorEventObj: {},
    errorObj: {},
    oneShotError: {},
    inoperativeOutlets: [],
    shouldDisplay: 0,
    isGunOneSpinner: true,
    isGunTwoSpinner: true,
    setIsGunSpinnerTwo: (isGunTwoSpinner) => this.setState({ isGunTwoSpinner }),
    setIsGunSpinnerOne: (isGunOneSpinner) => this.setState({ isGunOneSpinner }),
    // Remote Start Popup state
    remoteStartPopupGun1: false,
    remoteStartPopupGun2: false,
    connectionTimeOut: 60,
    showRemoteStartPopup: (gunNumber) => this.showRemoteStartPopup(gunNumber),
    hideRemoteStartPopup: (gunNumber) => this.hideRemoteStartPopup(gunNumber),
    // Session Summary Popup state
    showSessionSummaryPopup: false,
    sessionSummaryData: null,
    sessionSummaryPopupShown: false,
    sessionSummaryPopupShownForCurrentError: false,  // Track if already shown for this error
    lastSessionSummarySessionStart: null,
    hideSessionSummaryPopup: () => this.hideSessionSummaryPopup(),
    showSessionSummaryAfterCharging: (outletState, hasError) => this.showSessionSummaryAfterCharging(outletState, hasError),
  };

  setupCache = async () => {
    const { config } = this.state;
    const { chargingBackground } = config || {};
    const images = importAll(
      require?.context("../assets", false, /\.(png|jpe?g|svg)$/)
    );
    if (
      chargingBackground?.images &&
      Array.isArray(chargingBackground.images)
    ) {
      chargingBackground.images.forEach((background) => {
        images.push(`/backgrounds/${background}`);
      });
    }
    const lightThemeLogo = `/brandings/${config?.branding?.brandingLogo?.lightTheme}`;
    const darkThemeLogo = `/brandings/${config?.branding?.brandingLogo?.darkTheme}`;
    !images.includes(lightThemeLogo) && images.push(lightThemeLogo);
    !images.includes(darkThemeLogo) && images.push(darkThemeLogo);
    this.setState({ imagesToCache: images });
  };

  parseChargingState = async () => {
    if (!this.state.selectedState) return;

    const {
      selectedState,
      chargerState,
      changePath,
      firstOutletIdToAllowAutoRoute,
      config,
    } = this.state;
    const { pilot, auth, phs, user, evsestat } = selectedState;
    const { pathname } = this.props.location;

    const stoppingOutlet = chargerState.find((state) =>
      inStoppingProccess(state)
    );
    if (
      stoppingOutlet &&
      pathname !== "/stopping" &&
      firstOutletIdToAllowAutoRoute
    ) {
      const outletStateToSet = chargerState.find(
        (o) => o.outlet == firstOutletIdToAllowAutoRoute
      );
      addOrUpdateSessionToDb(
        outletStateToSet?.outlet,
        outletStateToSet?.user,
        outletStateToSet?.outletType,
        outletStateToSet?.timestamp,
        outletStateToSet?.sessionStart,
        outletStateToSet?.EVRESSSOC,
        outletStateToSet?.EVRESSSOC,
        Date.now(),
        outletStateToSet?.curr_ses_Wh,
      );
      localStorage.setItem("user", outletStateToSet?.user);
      localStorage.setItem("selectedOutlet", outletStateToSet?.outlet);
      this.setState({ selectedState: outletStateToSet });
      changePath("/stopping");
    }
    if (pathname === "/stopping" && !inStoppingProccess(selectedState)) {
      if (isNeedUnplug(selectedState)) {
        changePath("/unplugev");
      }
    }

    if (pathname === "/authorize" && pilot === 0) {
      this.state.changePath("/plugev");
    } else if (pathname === "/charging" && pilot === 0) {
      // Normal charging completion - show session summary popup
      this.showSessionSummaryAfterCharging(selectedState, false);
      this.state.changePath("/");
    } else if (pathname === "/charging" && (evsestat === 5 || pilot === 7)) {
      // Error during charging - already handled by handleSessionSummaryPopupLogic
      // Just navigate to home, popup will be shown by error handler
      this.state.changePath("/");
    } else if (
      !inStoppingProccess(selectedState) &&
      isNeedUnplug(selectedState) &&
      pathname !== "/unplugev"
    ) {
      if (pathname === "/authorize") {
        this.state.changePath(`/unplugev?isTimeout=${true}`);
        deAuthorize(config?.API, selectedState);
      } else if (pathname === "/plugev" || pathname === "/charging") {
        this.state.changePath("/unplugev");
      }
    } else if (
      !inStoppingProccess(selectedState) &&
      !isNeedUnplug(selectedState) &&
      pathname === "/unplugev"
    ) {
      if (this.props.location?.search === "?isTimeout=true") {
        this.state.changePath("/");
      } else {
        // After unplugging - show session summary popup
        this.showSessionSummaryAfterCharging(selectedState, false);
        this.state.changePath("/");
      }
    } else if (
      !inStoppingProccess(selectedState) &&
      !isNeedUnplug(selectedState) &&
      pathname === "/charging" &&
      pilot < 3 &&
      phs < 3
    ) {
      // Charging interrupted - show session summary popup
      this.showSessionSummaryAfterCharging(selectedState, false);
      this.state.changePath("/");
    } else if (pathname === "/plugev" && pilot >= 1 && pilot <= 4 && !auth) {
      this.state.changePath("/authorize");
    } else if (
      pathname === "/checkpoints" &&
      pilot >= 3 &&
      pilot <= 4 &&
      phs >= 7
    ) {
      if (
        this.state.shouldGoHomeOnSessionStart &&
        this.state.config?.isRfidFlow
      ) {
        this.state.changePath("/");
      } else {
        this.state.changePath("/charging");
      }
    } else if (pathname === "/authorize" && isHandshaking(selectedState)) {
      this.state.changePath("/checkpoints");
    } else if (pathname === "/remoteauth" && isHandshaking(selectedState)) {
      this.state.changePath("/checkpoints");
    }

    this.setState({ stoppingOutlet: !!stoppingOutlet });
  };

  fetchState = async () => {
    const isComboMode = this?.state?.config?.comboMode;
    const chargingMode = this?.state?.chargingMode;
    const API = this.state.config?.API;
    const pathname = this.props.location && this.props.location.pathname;
    if (pathname === "/reboot") return; // prevent to see "No Charge Outlet Active" while rebooting

    try {
      this.parseChargingState();
      let chargerState = await timeout(5000, getState(API));
      if (!chargerState) chargerState = [];
      if (!Array.isArray(chargerState)) chargerState = [chargerState];
      chargerState = chargerState.map((outletState, index) => ({
        ...outletState,
        index,
      }));

      const errorObj = this.checkErrors(chargerState, chargingMode, isComboMode); // prettier-ignore
      const { showAlert, showEStop, errorCode } = errorObj || {};
      const needsEStopRouting = showEStop && !this.state.eStopRoutingHandled;
      if (needsEStopRouting) {
        this.state.changePath("/");
        this.setState({ eStopRoutingHandled: true });
      }
      if (!showEStop && this.state.eStopRoutingHandled) {
        this.setState({ eStopRoutingHandled: false });
      }

      const needsPowerFailureRouting =
        errorCode === "powerloss" && !this.state.powerFailureRoutingHandled;
      if (needsPowerFailureRouting) {
        this.state.changePath("/");
        this.setState({ powerFailureRoutingHandled: true });
      }
      if (errorCode !== "powerloss" && this.state.powerFailureRoutingHandled) {
        this.setState({ powerFailureRoutingHandled: false });
      }

      if (errorCode === "powerloss" || errorCode === "emergency") {
        chargerState = getAllOutletsAsOutOfOrder(chargerState);
      }
      if (!chargerState.length) {
        this.setState({ isChargeCableConnected: false });
      } else {
        const selectedState = chargerState.find(
          (eachState) =>
            eachState?.outlet == localStorage.getItem("selectedOutlet")
        );

        this.setState({
          shouldDisplay: this.displayVCCUPopup()
        })

        let isVCCU = this.state.chargingMode;

        const chargingMode = isComboMode ? isVCCU : 0;
        // we want to skip showing a faulted outlet for first 3 sec. so we will handle that and use faultedOutlets instead of realFaultedOutlets
        const blockedOutlets = getBlockedOutlets(chargerState, chargingMode); // prettier-ignore
        const realFaultedOutlets = getFaultedOutlets(chargerState, blockedOutlets, this.state.errTogglingTimeout); // prettier-ignore
        const faultedOutletsTime = getFaultedOutletsTime(realFaultedOutlets, this.state.faultedOutletsTime); // prettier-ignore
        const faultedOutlets = getHackedFaultedOutlets(realFaultedOutlets, faultedOutletsTime); // prettier-ignore
        const availableOutlets = getAvailableOutlets(chargerState, faultedOutlets, blockedOutlets); // prettier-ignore
        const activeOutlets = getActiveOutlets(chargerState);
        const reservedOutlets = await getReservedOutlets(API);
        const stoppingOutlets = getStoppingOutlets(chargerState);
        const preventAutoRouteOutlets = getCleanedPreventAutoRouteOutlets(stoppingOutlets, this.state.preventAutoRouteOutlets); // prettier-ignore
        const firstOutletIdToAllowAutoRoute = getFirstOutletIdToAllowAutoRoute(chargerState, preventAutoRouteOutlets, stoppingOutlets); // prettier-ignore
        const preparingOutletsIds = getPreparingOutletsIds(chargerState);
        const inoperativeOutlets = getInoperativeOutlets(chargerState);

        // ErrorObj: substituted supply_voltage error by undervoltage or overvoltage flags
        const isSupplyVoltage =
          chargerState &&
          Array.isArray(chargerState) &&
          chargerState[0] &&
          ((chargerState[0].errorObj?.overVoltageErr) || (chargerState[0].errorObj?.underVoltageErr));
        const isPowerModuleFailure =
          chargerState &&
          Array.isArray(chargerState) &&
          chargerState[0] &&
          chargerState[0].errorObj?.powerModuleFailureErr;
        this.setState((prevState) => {
          return {
            availableOutlets,
            chargerState,
            isChargeCableConnected: true,
            selectedState,
            faultedOutlets,
            faultedOutletsTime,
            blockedOutlets,
            activeOutlets,
            chargingMode,
            showAlert,
            showEStop,
            errorCode,
            errorObj,
            errorEventObj:
              isSupplyVoltage || isPowerModuleFailure
                ? this.state.errorEventObj
                : {},
            outletToShowOnEStopRelease: showEStop
              ? this.state.activeOutlets[0]
              : null,
            reservedOutlets,
            stoppingOutlets,
            preventAutoRouteOutlets,
            firstOutletIdToAllowAutoRoute,
            preparingOutletsIds,
            inoperativeOutlets,
          };
        });
      }
      this.syncSessionToLocalDb(chargerState);

      // Check if remote start popup gun is now plugged
      this.checkRemoteStartGunPlugged();
    } catch (err) {
      console.error("Error on state polling:", err);
    }
  };

  fetchActiveConnector = async () => {
    const pathname = this.props.location && this.props.location?.pathname;
    if (pathname === "/reboot") return; // prevent to see "Charger is starting" while rebooting

    const { config } = this.state;
    const { checkSECC } = config;
    if (!checkSECC) return;

    try {
      const activeConnector = await timeout(
        5000,
        fetch(`http://${checkSECC}/api/`, { mode: "no-cors" })
          .then((res) => parseInt(res.text(), 10))
          .catch((err) => {
            throw err;
          })
      );
      this.setState({
        activeConnector,
        SECCreachable: true,
      });
    } catch (err) {
      console.error("Error on getting connector state:", err);
      this.setState({
        activeConnector: 0,
        SECCreachable: false,
      });
    }
  };

  syncSessionToLocalDb = async (chargerState) => {
    let currentlyChargingSessions = chargerState.filter((eachState) => {
      return eachState?.phs === 7;
    });
    currentlyChargingSessions.forEach((eachSession) => {
      addOrUpdateSessionToDb(
        eachSession.outlet,
        eachSession.user,
        eachSession.outletType,
        eachSession.timestamp,
        eachSession.sessionStart,
        eachSession.user,
        eachSession.EVRESSSOC,
        eachSession.EVRESSSOC,
        Date.now(),
        eachSession.curr_ses_Wh,

      );
    });
  };

  setupIpcMqtt = () => {
    this.state.ipcClient.on("connect", function () {
      console.log("connected to IPC MQTT broker...");
    });
    this.state.ipcClient.subscribe(["ocpp-client", "whitelist-service"]);
    this.state.ipcClient.on("message", (topic, payload) => {
      try {
        payload = JSON.parse(payload);
      } catch (error) { }

      // Capture OCPP StopTransaction data for session matching
      if (topic === "ocpp-client" && payload?.type === "StopTransaction") {
        const { transactionId, meterStop, connectorId } = payload;
        console.log(`[SessionSummaryPopup] Received OCPP StopTransaction: connectorId=${connectorId}, transactionId=${transactionId}, meterStop=${meterStop}`);

        // Store the stop transaction data in state for later use
        this.setState(prevState => {
          const updatedChargerState = prevState.chargerState.map(outlet => {
            if (String(outlet.outlet) === String(connectorId)) {
              return {
                ...outlet,
                transactionId: transactionId,
                ocppMeterStop: meterStop,
              };
            }
            return outlet;
          });
          return { chargerState: updatedChargerState };
        });
      }

      window.dispatchEvent(
        new CustomEvent("auth-res", { bubbles: true, detail: payload })
      );
      window.dispatchEvent(
        new CustomEvent("reset", { bubbles: true, detail: payload })
      );
      window.dispatchEvent(
        new CustomEvent("remoteauth", { bubbles: true, detail: payload })
      );
    });
  };

  publishNetworkAccess = (networkAccess) => {
    const { ipcClient } = this.state;
    const id = Date.now();
    const type = "internet";
    const status = networkAccess ? "connected" : "disconnected";
    const payload = { status };
    const message = JSON.stringify({ id, type, payload });
    ipcClient.publish("hmi", message);
    console.log("Internet(hmi) published:", networkAccess);
  };

  handlePublishNetworkAccessOnMount = async () => {
    const networkAccess = await this.checkNetworkAccess();
    console.log(
      "App.js mounted-10sec passed-publishing internet(hmi) access as",
      networkAccess
    );
    this.publishNetworkAccess(networkAccess);
    this.setState({ allowToPublishNetworkAccess: true, networkAccess });
  };

  setupRFIDFlowSocket = () => {
    // only for isRfidFlow
    const { config } = this.state || {};
    const { isRfidFlow, socketUrl } = config || {};
    if (!isRfidFlow) return;

    this.rfidFlowSocket = new ReconnectingWebSocket(
      `${socketUrl}/services/rfid/idTag`
    );
    this.rfidFlowSocket.onmessage = (event) => {
      handleRfidFlow(event, this.state, this.getPath());
    };
  };

  getPath = () => this.props?.location?.pathname;

  connectionTimeOutInterval = null;
  lastConnectionTimeOut = null;

  fetchConnectionTimeOut = async () => {
    const { config } = this.state;

    if (!config?.API) return;

    try {
      const response = await fetch(`${config.API}/ocpp-client/config`);
      const data = await response.json();

      if (data?.standard?.ConnectionTimeOut !== undefined) {
        // Check if ConnectionTimeOut has changed
        if (this.lastConnectionTimeOut !== data.standard.ConnectionTimeOut) {
          this.lastConnectionTimeOut = data.standard.ConnectionTimeOut;
          this.setState({ connectionTimeOut: data.standard.ConnectionTimeOut });
          console.log("[ContextProvider] ConnectionTimeOut updated:", data.standard.ConnectionTimeOut);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch ConnectionTimeOut:", err);
    }
  };

  async componentDidMount() {
    this.setupIpcMqtt();

    // fetch state every second
    this.pollStateInterval = setInterval(this.fetchState, 1000);
    setImmediate(this.fetchState);

    const config = await buildConfig();
    const connectionTimeOut = config?.standard?.ConnectionTimeOut || 60;
    this.lastConnectionTimeOut = connectionTimeOut;
    console.log("[ContextProvider] Full config object:", config);
    console.log("[ContextProvider] config.standard:", config?.standard);
    console.log("[ContextProvider] ConnectionTimeOut extracted:", connectionTimeOut);
    this.setState({ config, connectionTimeOut });

    // Execute startup API call
    try {
      await startupApiCall(config);
    } catch (error) {
      // Startup API call failed, but don't block application initialization
      console.log("Startup API call failed, continuing with application initialization");
    }

    if (moment?.tz?.setDefault) {
      const timezone = config?.timezone || "Asia/Kolkata";
      moment.tz.setDefault(timezone);
    }

    this.checkOCPPStatus(config?.API);
    this.checkNetworkAccess();
    this.ocppOnlineInterval = setInterval(() => this.checkOCPPStatus(config?.API), 10000); // prettier-ignore
    this.networkAccessInterval = setInterval(this.checkNetworkAccess, 10000);

    // Start polling for ConnectionTimeOut changes every 5 seconds
    this.connectionTimeOutInterval = setInterval(() => this.fetchConnectionTimeOut(), 5000);

    this.pollConnectorInterval = setInterval(this.fetchActiveConnector, 1000);
    setImmediate(this.fetchActiveConnector);
    // setImmediate(this.setupCache);

    window.addEventListener("reset", this.handleReset, false);
    window.addEventListener("remoteauth", this.handleRemoteAuth, false);

    this.handleBootingScreen();
    this.setupRFIDFlowSocket();
    clearRfid(config?.API); // reset rfid when application started, maybe we already have it in openapi
    this.networkAccessPublishTimer = setTimeout(async () => this.handlePublishNetworkAccessOnMount(), 10000); // prettier-ignore
    await this.setupEventWS(config);
  }

  async componentDidUpdate(prevProps, prevState) {
    const prevPath = prevProps.location.pathname;
    const path = this.props.location.pathname;
    const { chargerState } = this.state;
    const API = this.state.config?.API;

    // if one of the outlets was active but there is a communication error
    const prevSECCreachable = prevState.SECCreachable;
    const SECCreachable = this.state.SECCreachable;
    this.handleCommunicationError(prevSECCreachable, SECCreachable);

    if (
      this?.state?.config?.comboMode &&
      shouldResetCombo(prevPath, path, chargerState)
    ) {
      resetCombo(API);
    }

    // prevent showing charger blocker errors just after estop released --mainly for input under voltage
    const prevErrorCode = prevState.errorCode;
    const currentErrorCode = this.state.errorCode;
    if (
      (prevErrorCode === "emergency" && currentErrorCode !== "emergency") ||
      (prevErrorCode === "powerloss" && currentErrorCode !== "powerloss")
    ) {
      this.setState({ errTogglingTimeout: true });
      setTimeout(() => this.setState({ errTogglingTimeout: false }), 10000);
    }

    // check if there is an outlet just authenticated now and if so clear the previous session for that user
    const nowAuthenticatedOne = getTheOneAuthenticated(prevState.chargerState, chargerState); // prettier-ignore
    if (nowAuthenticatedOne) deleteSession(String(nowAuthenticatedOne?.outlet), String(nowAuthenticatedOne?.user));

    // Remote Start Popup: Detect when outlet becomes authorized but gun is not plugged
    // This handles RemoteStartTransaction from OCPP
    // Only show popup if user is at home, charging, stopping, or unplugev screen and no error exists
    if (nowAuthenticatedOne) {
      const isGunPlugged = nowAuthenticatedOne.pilot > 0 && nowAuthenticatedOne.pilot !== 7;
      const validScreens = ["/", "/charging", "/stopping", "/unplugev"];
      const isAtValidScreen = validScreens.includes(path);
      const errorObj = nowAuthenticatedOne?.errorObj || {};
      const hasError = Object.values(errorObj).some(value => value === true);
      if (!isGunPlugged && isAtValidScreen && !hasError) {
        // Gun not plugged, user is at valid screen, and no error exists - show remote start popup
        console.log("Remote start detected - showing popup for outlet:", nowAuthenticatedOne.outlet);
        this.showRemoteStartPopup(nowAuthenticatedOne.outlet);
      }
    }

    // ✅ SESSION SUMMARY POPUP: Show when error occurs during charging and vehicle needs unplug
    // State-driven logic: depends on needsUnplug, not transitions
    // Works for single-gun and dual-gun scenarios
    this.handleSessionSummaryPopupLogic(chargerState, prevState.chargerState);

    if (this.state.config?.isRfidFlow) {
      const prevPreparingOutletsIds = prevState.preparingOutletsIds;
      const preparingOutletsIds = this.state.preparingOutletsIds;
      if (!isArrayOfStringsSame(prevPreparingOutletsIds, preparingOutletsIds)) {
        const newChangedId = findDifferentElementInArray(
          prevPreparingOutletsIds,
          preparingOutletsIds
        );
        let newChangedState = this.state.chargerState.find(
          (o) => o.outlet == newChangedId
        );
        if (!isOutletPreparing(newChangedState)) newChangedState = null;
        if (
          newChangedState &&
          (path === "/" ||
            path === "/screensaver" ||
            path === "/charging" ||
            path === "/unplugev" ||
            path === "/stopping")
        ) {
          handleOutletSelect(newChangedState, this.state.setSelectedState);
          this.state.changePath("/authorize");
        }
      }
    }

    // publish event if internet connection changed
    const prevNetworkAccess = prevState.networkAccess;
    const networkAccess = this.state.networkAccess;
    const allowToPublishNetworkAccess = this.state.allowToPublishNetworkAccess;
    if (prevNetworkAccess !== networkAccess && allowToPublishNetworkAccess) {
      console.log(
        `Internet access was ${prevNetworkAccess}, but now ${networkAccess}. Publishing network access`
      );
      this.publishNetworkAccess(networkAccess);
    }

    // if charging has not started properly, we need to show a modal
    this.handleToShowModalOnHandshakeError(prevPath, path);

    const prevChargerState = prevState?.chargerState;
    this.handlePowerModuleCommErr(prevChargerState, chargerState);
  }

  componentWillUnmount() {
    clearInterval(this.pollStateInterval);
    clearInterval(this.pollConnectorInterval);
    clearInterval(this.connectionTimeOutInterval);
    clearInterval(this.ocppOnlineInterval);
    clearInterval(this.networkAccessInterval);
    window.removeEventListener("reset", this.handleReset, false);
    window.removeEventListener("remoteauth", this.handleRemoteAuth, false);
    this.state.ipcClient.end(true);
    clearTimeout(this.networkAccessPublishTimer);
  }

  handleReset = (data) => {
    data = data.detail;
    if (data.type === "reset") {
      if (data.payload.reboot) {
        this.state.changePath("/reboot");
      }
    }
  };

  handleRemoteAuth = (data) => {
    data = data.detail;
    if (data.type === "remoteauth") {
      if (data.payload?.mode === "SF") {
        this.setState({ remoteAuthMode: data.payload.mode });
      } else {
        this.setState({ remoteAuthMode: null });
      }

      if (data.payload.remoteauth) {
        const outletID = data.payload.outledID;
        const outletState = this.state.chargerState.find(
          (o) => o.outlet == outletID && o.online
        );
        if (outletState) {
          localStorage.setItem("user", outletState.user);
          localStorage.setItem("selectedOutlet", outletState.outlet);
          this.state.setSelectedState(outletState);
        }
        this.state.changePath("/remoteauth");
      }
    }
  };

  HiddenPreload = () => (
    <div style={{ display: "none" }}>
      {this.state.imagesToCache &&
        this.state.imagesToCache.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
    </div>
  );

  // ErrorObj: substituted to powerlossErr
  checkPowerFailure = (chargerState) => {
    if (chargerState && Array.isArray(chargerState) && chargerState[0]) {
      const state = chargerState[0];
      const { errorObj } = state || {};
      return (
        (errorObj && errorObj?.powerLossErr)
      );
    }
  };

  //ErrorObj: Ground fault
  checkGroundFault = (chargerState) => {
    if (chargerState && Array.isArray(chargerState) && chargerState[0]) {
      const state = chargerState[0];
      const { errorObj } = state || {};
      return (
        (errorObj && errorObj?.groundFault)
      );
    }
  };

  checkOCPPStatus = async (API) => {
    const endpoint = `${API}/services/ocpp/status`;
    const ocppOnline = await fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        return data?.connectionStatus === "connected";
      })
      .catch((error) => {
        console.log("Getting /services/ocpp/status failed!!");
      });
    this.setState({ ocppOnline });
    return ocppOnline;
  };

  fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 8000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  };

  checkNetworkAccess = async () => {
    let networkAccess = null;
    try {
      await this.fetchWithTimeout("https://api.ipify.org/", {
        method: "GET",
        mode: "no-cors",
        cache: "no-cache",
        timeout: 2000,
      });
      networkAccess = true;
    } catch (error) {
      networkAccess = false;
    }
    this.setState({ networkAccess });
    return networkAccess;
  };

  checkErrors = (chargerState, chargingMode, isComboMode) => {
    if (this.state.errTogglingTimeout) {
      return {
        showAlert: false,
        showEStop: false,
        errorCode: null,
      };
    }

    if (this.state.isCommunicationError) {
      return {
        showAlert: true,
        errorCode: "communication_error",
      };
    }

    const outletState =
      chargerState &&
      Array.isArray(chargerState) &&
      chargerState.length > 0 &&
      chargerState[0];

    // if there is an already active error -except emergency or powerloss-
    // ErrorObj: added eStopErr & powerLossErr to substitute safety_tipped_io and supply_voltage
    if (
      this.state.showAlert &&
      this.state.errorCode &&
      (outletState?.errorObj?.eStopErr ||
        outletState?.errorObj?.powerLossErr
      ) &&
      isErrorStillValid(
        chargerState,
        this.state.errorCode,
        this.state.errorEventObj,
        this.state.config
      )
    ) {
      return this.state.errorObj;
    }

    // there is no error yet
    const config = this.state.config;
    const API = this.state.config?.API;
    const { errorObj } = outletState || {};
    let errorObjReturn = {
      showAlert: false,
      showEStop: false,
      errorCode: null,
      errorEventObj: {},
    };

    // ErrorObj: added estop errObj
    const isEStop =
      (errorObj && errorObj.eStopErr);

    if (isEStop) {
      errorObjReturn = { showAlert: false, showEStop: true, errorCode: "emergency" }; // prettier-ignore
      isComboMode && chargingMode > 0 && resetCombo(API);
      return errorObjReturn;
    }

    // ErrorObj: added doorOpenCheck
    const isDoorOpen =
      (chargerState &&
        Array.isArray(chargerState) &&
        chargerState[0] &&
        chargerState[0].errorObj?.doorOpenErr);

    if (isDoorOpen) {
      errorObjReturn = { showAlert: true, showEStop: false, errorCode: "CHARGER_DOOR_OPEN" }; // prettier-ignore
      isComboMode && chargingMode > 0 && resetCombo(API);
      return errorObjReturn;
    }

    //Ground fault
    const isGroundFaulted = this.checkGroundFault(chargerState);
    if (isGroundFaulted) {
      errorObjReturn = { showAlert: true, showEStop: false, errorCode: "GROUND_FAULT" };
      return errorObjReturn;
    }

    const isPowerFailured = this.checkPowerFailure(chargerState);
    if (isPowerFailured) {
      errorObjReturn = { showAlert: false, showEStop: false, errorCode: "powerloss" }; // prettier-ignore
      isComboMode && chargingMode > 0 && resetCombo(API);
      return errorObjReturn;
    }

    // ErrorObj: Added under/over voltage
    const isSupplyVoltage =
      (chargerState &&
        Array.isArray(chargerState) &&
        ((chargerState[0] && chargerState[0]?.errorObj?.overVoltageErr) || (
          chargerState[0] && chargerState[0]?.errorObj?.underVoltageErr))
      );
    if (
      isSupplyVoltage) {
      // console.log(JSON.parse(this.state.errorEventObj?.data));
      // ErrorObj: put "overVoltageErr" or "underVoltageErr" in errorcode.
      if (chargerState[0] && chargerState[0]?.errorObj?.underVoltageErr) {
        errorObjReturn = { showAlert: true, showEStop: false, errorCode: "ERR_UNDER_VOLTAGE" }; // prettier-ignore
        return errorObjReturn;
      }
      else if (chargerState[0] && chargerState[0]?.errorObj?.overVoltageErr) {
        errorObjReturn = { showAlert: true, showEStop: false, errorCode: "ERR_OVER_VOLTAGE" }; // prettier-ignore
        return errorObjReturn;
      }
    }
    const isPowerModuleFailure =
      (chargerState &&
        Array.isArray(chargerState) &&
        chargerState[0] &&
        chargerState[0].errorObj?.powerModuleFailureErr);
    if (
      isPowerModuleFailure &&
      this.state.errorEventObj &&
      this.state.errorEventObj?.data &&
      JSON.parse(this.state.errorEventObj?.data)
    ) {
      const code = JSON.parse(this.state.errorEventObj?.data)?.payload?.code;
      const errorCode = config?.errorCodes[code]?.localizationCode,
        errorObjReturn = { showAlert: true, showEStop: false, errorCode: errorCode }; // prettier-ignore
      return errorObjReturn;
    }

    // ErrorObj: added outletTempCheck
    const outletTempCheck =
      (chargerState &&
        Array.isArray(chargerState) &&
        chargerState[0] &&
        chargerState[0].errorObj?.outletTemperatureErr);

    if (outletTempCheck) {
      errorObjReturn = { showAlert: true, showEStop: false, errorCode: "OUTLET_TEMP" }; // prettier-ignore
      isComboMode && chargingMode > 0 && resetCombo(API);
      return errorObjReturn;
    }

    // ErrorObj: added cabinetTempCheck
    const cabinetTempCheck =
      (chargerState &&
        Array.isArray(chargerState) &&
        chargerState[0] &&
        chargerState[0].errorObj?.cabinetTemperatureErr);

    if (cabinetTempCheck) {
      errorObjReturn = { showAlert: true, showEStop: false, errorCode: "CAB_TEMP" }; // prettier-ignore
      isComboMode && chargingMode > 0 && resetCombo(API);
      return errorObjReturn;
    }

    // ErrorObj: added IMD Faulty Error Controller 1 check
    const isImdFaultyErr_1 =
      chargerState &&
      Array.isArray(chargerState) &&
      chargerState[0] &&
      chargerState[0].errorObj?.imdFaultyErr_controller1;

    if (isImdFaultyErr_1) {
      this.setState({ imdFaultyErr_controller1: true });
    } else {
      this.setState({ imdFaultyErr_controller1: false });
    }

    // ErrorObj: added IMD Faulty Error Controller 2 check
    const isImdFaultyErr_2 =
      chargerState &&
      Array.isArray(chargerState) &&
      chargerState[1] &&
      chargerState[1].errorObj?.imdFaultyErr_controller2;

    if (isImdFaultyErr_2) {
      this.setState({ imdFaultyErr_controller2: true });
    } else {
      this.setState({ imdFaultyErr_controller2: false });
    }

    // ErrorObj: added AC Energy Meter Failure check for both outlets
    const isAcEnergyMeterFailure =
      chargerState &&
      Array.isArray(chargerState) &&
      (
        (chargerState[0] && chargerState[0].errorObj?.ac_em_fail) ||
        (chargerState[1] && chargerState[1].errorObj?.ac_em_fail)
      );

    if (isAcEnergyMeterFailure) {
      this.setState({ acEnergyMeterFailure: true });
    } else {
      this.setState({ acEnergyMeterFailure: false });
    }
    return errorObjReturn;
  };

  isInitializing = () => {
    let initializing = this.state.selectedState?.initializing;
    const isComboRunning = this.state.config?.comboMode;
    const initializingShouldBypassed = isComboRunning || this.state.errorCode;
    if (initializingShouldBypassed) initializing = false;
    return initializing;
  };

  handleBootingScreen = () => {
    this.setState({ showBootingScreen: true });
    const onBootTimeMs = this.state.config?.useAnimation?.onBootTimeSec || 60;
    const onBootTimeSec = onBootTimeMs * 1000;
    setTimeout(
      () => this.setState({ showBootingScreen: false }),
      onBootTimeSec
    );
  };

  // ErrorObj: substitute safety_tripped_io with errorObj
  handleToShowModalOnHandshakeError = (prevPath, path) => {
    if (
      (prevPath === "/remoteauth" || prevPath === "/checkpoints") &&
      path === "/"
    ) {
      setTimeout(() => {
        const chargerState = this.state.chargerState;
        const state =
          chargerState &&
          Array.isArray(chargerState) &&
          chargerState.length > 0 &&
          chargerState[0];
        if (
          (state?.errorObj?.eStopErr ||
            state?.errorObj?.powerLossErr
          )
        ) {
          return;
        } else {
          if (isActive(this.state.selectedState)) {
            return;
          } else {
            if (isNeedUnplug(this.state.selectedState)) {
              console.log(
                `${prevPath} ---> ${path} -- will show modal and state is `,
                this.state.selectedState
              );
              this.setState({ showHandshakeErrorModal: true });
            }
          }
        }
      }, 500);
    }
  };

  publishChargingMode = (mode) => {
    const { chargingMode, config } = this.state;
    if (config?.comboMode) {
      // Check if the mode is different from the current one
      if (chargingMode === String(mode)) {
        console.log("Mode is already set to", mode, "No need to publish.");
        return; // Skip publishing if the mode is the same
      }

      this.setState({
        chargingMode: String(mode)
      })
      mode = String(RfidSuffix[mode]);  // This modifies 'mode' to a string from the 'RfidSuffix' mapping
      if (mode === ChargingModes.R || mode === ChargingModes.DVCCU || mode === ChargingModes.SVCCU) {
        const { ipcClient } = this.state;
        const id = Date.now();
        const type = "charging-mode";
        const payload = { mode };
        const message = JSON.stringify({ id, type, payload });
        //console.log(message);
        ipcClient.publish("hmi", message);
        console.log("Charging mode published:", mode);

      }
    }
    else {
      return;
    }

  };

  setupEventWS = async (config) => {
    if (!config?.errorCodes) return;

    const eventWsEndpoint = `${config?.socketUrl}/events/stream`;
    this.eventWs = new ReconnectingWebSocket(eventWsEndpoint);

    this.eventWs.onopen = () => {
      console.log(`ws onopen ${eventWsEndpoint}`);
    };
    this.eventWs.onerror = (error) => {
      console.log(`ws onerror ${eventWsEndpoint} ${error}`);
    };
    this.eventWs.onclose = () => {
      console.log(`ws onclose ${eventWsEndpoint}`);
    };
    this.eventWs.onmessage = (data) => {
      let errorObjCode = data && JSON.parse(data?.data)?.payload?.code;
      const eventType = data && JSON.parse(data?.data)?.type;
      if (eventType !== "alert") return;

      if (errorObjCode) errorObjCode = String(errorObjCode);

      let errorObjOutlet = data && JSON.parse(data?.data)?.payload?.outlet;
      if (!errorObjOutlet) {
        // it may be inside or outside of payload. so trying both
        errorObjOutlet = data && JSON.parse(data?.data)?.outlet;
      }
      if (errorObjOutlet) errorObjOutlet = String(errorObjOutlet);

      // dont store if it is a one shot error
      if (Object.keys(OneShotErrors).includes(errorObjCode)) {
        this.handleOneShotErrors(errorObjCode, errorObjOutlet);
      } else {
        this.setState({ errorEventObj: data });
      }
    };
  };

  handleCommunicationError = (prevSECCreachable, SECCreachable) => {
    if (
      prevSECCreachable &&
      !SECCreachable &&
      isSomeActive(this.state.chargerState)
    ) {
      this.setState({
        isCommunicationError: true,
      });
    } else if (!prevSECCreachable && SECCreachable) {
      this.setState({ isCommunicationError: false });
    }
  };

  handleOneShotErrors = (errorObjCode, errorObjOutlet) => {
    const localizationCode = OneShotErrors[errorObjCode]?.localizationCode;
    this.setState({
      oneShotError: {
        show: true,
        code: localizationCode,
        outlet: errorObjOutlet,
      },
    });
    setTimeout(() => this.setState({ oneShotError: {} }), 5000);
    return;
  };

  // Remote Start Popup methods
  showRemoteStartPopup = (gunNumber) => {
    console.log(`Showing remote start popup for gun ${gunNumber}`);
    if (gunNumber === 1 || gunNumber === "1") {
      this.setState({ remoteStartPopupGun1: true });
    } else if (gunNumber === 2 || gunNumber === "2") {
      this.setState({ remoteStartPopupGun2: true });
    }
  };

  hideRemoteStartPopup = (gunNumber) => {
    console.log(`Hiding remote start popup for gun ${gunNumber}`);
    if (gunNumber === 1 || gunNumber === "1") {
      this.setState({ remoteStartPopupGun1: false });
    } else if (gunNumber === 2 || gunNumber === "2") {
      this.setState({ remoteStartPopupGun2: false });
    }
  };

  // Check if gun is plugged and handle routing for remote start
  checkRemoteStartGunPlugged = () => {
    const { chargerState, remoteStartPopupGun1, remoteStartPopupGun2, changePath } = this.state;

    // Check Gun 1
    if (remoteStartPopupGun1) {
      const gun1State = chargerState.find((o) => o.outlet == "1" || o.outlet == 1);
      if (gun1State && gun1State.pilot > 0 && gun1State.pilot !== 7) {
        // Gun is plugged, hide popup and route to authorize/checkpoints
        this.hideRemoteStartPopup(1);
        localStorage.setItem("selectedOutlet", gun1State.outlet);
        localStorage.setItem("user", gun1State.user);
        this.setState({ selectedState: gun1State });
        if (isHandshaking(gun1State)) {
          changePath("/checkpoints");
        } else if (gun1State.auth) {
          changePath("/authorize");
        }
      }
    }

    // Check Gun 2
    if (remoteStartPopupGun2) {
      const gun2State = chargerState.find((o) => o.outlet == "2" || o.outlet == 2);
      if (gun2State && gun2State.pilot > 0 && gun2State.pilot !== 7) {
        // Gun is plugged, hide popup and route to authorize/checkpoints
        this.hideRemoteStartPopup(2);
        localStorage.setItem("selectedOutlet", gun2State.outlet);
        localStorage.setItem("user", gun2State.user);
        this.setState({ selectedState: gun2State });
        if (isHandshaking(gun2State)) {
          changePath("/checkpoints");
        } else if (gun2State.auth) {
          changePath("/authorize");
        }
      }
    }
  };

  // Fetch finalized sessions from backend database
  fetchSessionsFromBackend = async () => {
    try {
      const response = await fetch("http://10.20.27.50:3001/db/items", {
        method: "GET",
        headers: {
          "db-identifer": "sessions",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Data should be an array of session records
      if (!Array.isArray(data)) {
        console.warn("[SessionSummaryPopup] Backend returned non-array data:", data);
        return [];
      }

      // Log first record to see actual structure
      if (data.length > 0) {
        console.log("[SessionSummaryPopup] Backend response structure (first record):", data[0]);
      }

      return data;
    } catch (err) {
      console.error("[SessionSummaryPopup] Error fetching sessions from backend:", err);
      return [];
    }
  };

  // ✅ Generate a hash of session data to identify unique sessions and prevent re-rendering
  generateSessionHash = (popupData) => {
    if (!popupData || !popupData.sessions) return null;

    const sessionIdentifiers = popupData.sessions
      .map((s) => `${s.outlet}-${s.sessionStart}-${s.gunLetter}`)
      .sort()
      .join("|");

    return sessionIdentifiers;
  };

  // ✅ Session Summary Popup Logic: State-driven, idempotent, works with polling
  handleSessionSummaryPopupLogic = async (chargerState, prevChargerState) => {
    if (!chargerState || !Array.isArray(chargerState) || chargerState.length === 0) {
      // No charger state → hide popup
      if (this.state.sessionSummaryPopupShown) {
        console.log("[SessionSummaryPopup] No charger state, hiding popup");
        this.clearSessionSummaryTimer();
        this.hideSessionSummaryPopup();
      }
      return;
    }

    // Find all outlets that need unplugging (session ended)
    // This catches both normal completion and error cases
    // If errorObj has errors, we'll show error message; otherwise show normal summary
    const outletsWithError = chargerState.filter((outlet) => {
      // Primary check: needsUnplug indicates session has ended
      const needsUnplug = outlet?.needsUnplug === true;
      if (!needsUnplug) return false;


      // Additional check: session should not be pending
      const sessionPending = outlet?.sessionPending === true;
      if (sessionPending) {
        console.log(`[SessionSummaryPopup] Outlet ${outlet.outlet} - needsUnplug=true but sessionPending=true, skipping popup`);
        return false;
      }

      // Check if any error in errorObj is true (for error message display)
      const errorObj = outlet?.errorObj || {};
      const hasErrorInErrorObj = Object.values(errorObj).some((err) => err === true);

      console.log(`[SessionSummaryPopup] Outlet ${outlet.outlet} - needsUnplug=${needsUnplug}, sessionPending=${sessionPending}, hasErrorInErrorObj=${hasErrorInErrorObj}, user="${outlet.user}", curr_ses_secs=${outlet.curr_ses_secs}`);

      // Show popup for any outlet that needs unplugging (with or without error)
      // The popup component will show error message only if errorObj has errors
      return true;
    });

    console.log("[SessionSummaryPopup] Outlets with error:", outletsWithError.length);

    // No outlets with error → hide popup immediately and reset flag for next error
    if (outletsWithError.length === 0) {
      if (this.state.sessionSummaryPopupShown) {
        console.log("[SessionSummaryPopup] No outlets with error, hiding popup");
        this.clearSessionSummaryTimer();
        this.hideSessionSummaryPopup();
      }
      // Reset BOTH flags when error clears so next error will trigger new popup
      this.sessionSummaryPopupProcessing = false;
      if (this.state.sessionSummaryPopupShownForCurrentError) {
        this.setState({ sessionSummaryPopupShownForCurrentError: false });
      }
      return;
    }

    // At least one outlet has error → show session summary popup
    console.log(
      `[SessionSummaryPopup] Outlets with error: ${outletsWithError.map((o) => o.outlet).join(", ")}`
    );

    // ✅ Use SYNC flag to prevent re-entry during async operations
    if (this.sessionSummaryPopupProcessing) {
      console.log("[SessionSummaryPopup] Already processing popup for current error, skipping");
      return;
    }

    // Mark that we're NOW processing (synchronously, not async setState)
    this.sessionSummaryPopupProcessing = true;

    // Fetch and prepare session data for all outlets with error
    const sessionsData = [];

    // Show loading state first (5 seconds to allow DB to populate)
    const countdownStartTime = Date.now();
    const popupLoadingData = {
      mode: "loading",
      sessions: [],
      countdownStartTime: countdownStartTime,
    };

    console.log("[SessionSummaryPopup] Showing loading popup for 8 seconds");
    this.setState({
      sessionSummaryPopupShown: true,
      sessionSummaryData: popupLoadingData,
    });

    // Wait 8 seconds for DB to populate and errorObj to update
    await new Promise(resolve => setTimeout(resolve, 8000));

    // ✅ CRITICAL: Re-read charger state AFTER delay to get updated errorObj
    // The errorObj captured earlier may not have errors yet, need fresh data
    const updatedChargerState = this.state.chargerState || [];
    console.log("[SessionSummaryPopup] Re-reading charger state after delay to get updated errorObj");

    // Fetch all sessions from backend database (same as SessionResult screen)
    const backendSessions = await this.fetchSessionsFromBackend();

    console.log(`[SessionSummaryPopup] Backend returned ${backendSessions.length} sessions`);
    console.log(`[SessionSummaryPopup] Outlets with error:`, outletsWithError.map(o => ({ outlet: o.outlet, index: o.index })));

    if (!backendSessions || backendSessions.length === 0) {
      console.warn("[SessionSummaryPopup] No sessions available from backend");
      this.sessionSummaryPopupProcessing = false;
      return;
    }

    // Filter sessions per outlet by connectorID
    for (const outlet of outletsWithError) {
      try {
        // Convert outlet to number for comparison with connectorID (which is a number in backend)
        const outletNumber = parseInt(outlet.outlet);
        console.log(`[SessionSummaryPopup] Filtering for outletNumber=${outletNumber} (outlet.outlet=${outlet.outlet})`);

        const connectorSessions = backendSessions.filter(
          s => s.connectorID === outletNumber
        );

        console.log(`[SessionSummaryPopup] Found ${connectorSessions.length} sessions for outlet ${outletNumber}`);
        console.log(`[SessionSummaryPopup] Available connectorIDs in backend:`, backendSessions.map(s => s.connectorID).slice(0, 10));

        if (connectorSessions.length === 0) {
          console.warn(`[SessionSummaryPopup] ❌ No sessions found for outlet ${outletNumber}`);
          continue;
        }

        // Take the LAST (most recent) session for this outlet
        const session = connectorSessions[connectorSessions.length - 1];

        console.log(`[SessionSummaryPopup] ✅ Using LAST session for outlet ${outletNumber}:`, session);

        const { GunLetters } = require("../constants/constants");

        // ✅ CRITICAL FIX: Find UPDATED outlet data from fresh charger state
        const updatedOutlet = updatedChargerState.find(o => parseInt(o.outlet) === outletNumber);
        const currentErrorObj = updatedOutlet?.errorObj || {};

        console.log(`[SessionSummaryPopup] Outlet ${outletNumber} - OLD errorObj:`, outlet.errorObj);
        console.log(`[SessionSummaryPopup] Outlet ${outletNumber} - UPDATED errorObj:`, currentErrorObj);

        // Map backend fields directly - use outlet.index which corresponds to gun position
        // NOTE: Do NOT use DB reason field - error message comes from errorObj mapping in popup
        const sessionData = {
          outlet: outletNumber,
          sessionStart: session.sessionStart,
          sessionStop: session.sessionStop,
          sessionDuration: session.sessionDuration,
          startSoC: session.startSoC,
          stopSoC: session.stopSoC,
          energyConsumed: (session.consumption / 1000).toFixed(3),
          gunLetter: GunLetters[outlet.index],  // ✅ Use outlet.index not outlet.outlet
          useQAsOutletID: this.state.config?.useQAsOutletID,
          errorObj: currentErrorObj,  // ✅ Use UPDATED errorObj from re-read charger state
          currSesError: updatedOutlet?.curr_ses_error || 0,  // ✅ Pass session error code for error-only screen
        };

        console.log(`[SessionSummaryPopup] Session data for outlet ${outletNumber}:`, sessionData);
        sessionsData.push(sessionData);
      } catch (err) {
        console.error(
          `[SessionSummaryPopup] Error processing session for outlet ${outlet.outlet}:`,
          err
        );
      }
    }

    // If we have no valid sessions, don't show popup
    if (sessionsData.length === 0) {
      console.warn("[SessionSummaryPopup] No valid sessions found");
      this.sessionSummaryPopupProcessing = false;
      return;
    }

    // Show popup with single or dual session data
    const popupData = {
      mode: sessionsData.length === 1 ? "single" : "dual",
      sessions: sessionsData,
      countdownStartTime: countdownStartTime,  // Pass to component for countdown circle
    };

    // ✅ Generate hash of current session and check if we've already displayed it
    const currentSessionHash = this.generateSessionHash(popupData);

    // If this is the SAME session as the last one displayed, don't show it again
    if (currentSessionHash && this.displayedSessionHash === currentSessionHash) {
      console.log("[SessionSummaryPopup] Same session already displayed, skipping re-render");
      this.sessionSummaryPopupProcessing = false;
      return;
    }

    // ✅ Mark this session as displayed
    this.displayedSessionHash = currentSessionHash;

    console.log("[SessionSummaryPopup] Showing popup for 45 seconds:", popupData);
    this.setState({
      sessionSummaryPopupShown: true,
      sessionSummaryPopupShownForCurrentError: true,  // Mark that we've shown it for this error
      sessionSummaryData: popupData,
    });

    // ⚠️ DO NOT reset sync flag yet - keep it true until error clears from charger state
    // This prevents re-rendering even if popup times out while error is still present
    // The flag will be reset in handleSessionSummaryPopupLogic when outletsWithError.length === 0

    // Auto-hide popup after 45 seconds
    this.clearSessionSummaryTimer();
    this.sessionSummaryTimer = setTimeout(() => {
      console.log("[SessionSummaryPopup] 45 seconds elapsed, hiding popup (but keeping processing flag true to prevent re-render)");
      this.hideSessionSummaryPopup();
      // ✅ DO NOT reset the flag here - let it stay true
      // It will only reset when the error actually clears in handleSessionSummaryPopupLogic
    }, 45000); // 45 seconds
  };

  clearSessionSummaryTimer = () => {
    if (this.sessionSummaryTimer) {
      clearTimeout(this.sessionSummaryTimer);
      this.sessionSummaryTimer = null;
    }
  };

  // Session Summary Popup methods
  showSessionSummaryPopup = async (sessionData) => {
    console.log("Showing session summary popup with data:", sessionData);
    this.setState({
      sessionSummaryPopupShown: true,
      sessionSummaryData: sessionData,
    });
  };

  hideSessionSummaryPopup = () => {
    console.log("Hiding session summary popup");
    // ✅ Reset the displayed session hash so a new session can be shown
    this.displayedSessionHash = null;
    this.setState({
      sessionSummaryPopupShown: false,
      sessionSummaryData: null,
    });
  };

  // Show session summary after normal charging completion (non-error case)
  showSessionSummaryAfterCharging = async (outletState, hasError = false) => {
    if (!outletState) {
      console.warn("[SessionSummary] No outlet state provided");
      this.state.changePath("/");
      return;
    }

    const countdownStartTime = Date.now();

    // Show loading popup
    console.log("[SessionSummary] Showing loading popup for normal charging completion");
    this.setState({
      sessionSummaryPopupShown: true,
      sessionSummaryData: {
        mode: "loading",
        sessions: [],
        countdownStartTime: countdownStartTime,
      },
    });

    // Wait 5 seconds for DB to populate and errorObj to update
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch all sessions from backend database
    const backendSessions = await this.fetchSessionsFromBackend();
    const outletNumber = parseInt(outletState.outlet);

    if (!backendSessions || backendSessions.length === 0) {
      console.warn("[SessionSummary] No sessions available from backend");
      this.hideSessionSummaryPopup();
      this.state.changePath("/");
      return;
    }

    // Filter sessions for this outlet
    const connectorSessions = backendSessions.filter(s => s.connectorID === outletNumber);

    if (connectorSessions.length === 0) {
      console.warn(`[SessionSummary] No session found for outlet ${outletNumber}`);
      this.hideSessionSummaryPopup();
      this.state.changePath("/");
      return;
    }

    // Get the most recent session
    const session = connectorSessions[connectorSessions.length - 1];
    console.log(`[SessionSummary] Using session for outlet ${outletNumber}:`, session);

    const { GunLetters } = require("../constants/constants");

    const sessionData = {
      outlet: outletNumber,
      sessionStart: session.sessionStart,
      sessionStop: session.sessionStop,
      startSoC: session.startSoC,
      stopSoC: session.stopSoC,
      energyConsumed: (session.consumption / 1000).toFixed(3),
      gunLetter: GunLetters[outletState.index],
      useQAsOutletID: this.state.config?.useQAsOutletID,
      errorObj: hasError ? outletState.errorObj : null,  // null for normal completion
      currSesError: hasError ? outletState.curr_ses_error || 0 : 0,  // ✅ Pass session error code for error-only screen
    };

    const popupData = {
      mode: "single",
      sessions: [sessionData],
      countdownStartTime: countdownStartTime,
    };

    console.log("[SessionSummary] Showing popup for normal charging completion:", popupData);
    this.setState({
      sessionSummaryPopupShown: true,
      sessionSummaryData: popupData,
    });

    // Auto-hide after 45 seconds and navigate home
    this.clearSessionSummaryTimer();
    this.sessionSummaryTimer = setTimeout(() => {
      console.log("[SessionSummary] 45 seconds elapsed, hiding popup and navigating home");
      this.hideSessionSummaryPopup();
      this.state.changePath("/");
    }, 45000);
  };

  fetchAndShowSessionSummary = async (selectedState) => {
    try {
      const session = await fetchSessionByOutletAndUser(
        selectedState.outlet,
        selectedState.user
      );

      if (!session) return;

      let energyConsumed = session.curr_ses_Wh;
      if (selectedState.outletType !== "AC" && energyConsumed !== undefined) {
        energyConsumed = energyConsumed / 1000;
      }
      energyConsumed = energyConsumed?.toFixed(3);

      const { GunLetters } = require("../constants/constants");

      const sessionData = {
        sessionStart: session.sessionStart,
        sessionStop: session.sessionStop || Date.now(),
        startSoC: session.startPercentage || 0,
        stopSoC: selectedState.EVRESSSOC || 0,
        energyConsumed,
        gunLetter: GunLetters[selectedState.index],
        useQAsOutletID: this.state.config?.useQAsOutletID,
      };

      this.showSessionSummaryPopup(sessionData);
    } catch (err) {
      console.error("Session summary popup error:", err);
    }
  };


  displayVCCUPopup = () => {
    if (this.state.chargerState.length !== 0 && Array.isArray(this.state.chargerState)) {
      if (this.state?.chargerState[1]) {
        if (this.state.chargingMode === "0") {
          return 0;
        }
        else if (this.state.chargingMode === "1") {
          const chargerState = this.state.chargerState;

          if (chargerState[0].needsUnplug || chargerState[1].needsUnplug) {
            return 0;
          }
          // Check if both guns have phs == 1 and pilot == 0
          else if ((chargerState[0]?.phs === 1 && chargerState[1]?.phs === 1)) {
            return 1;
          }
          else if ((this.state.chargerState[0]?.phs == 1 && this.state.chargerState[1]?.phs == 2) ||
            (this.state.chargerState[0]?.phs == 2 && this.state.chargerState[1]?.phs == 1)) {
            return 2;
          }
        } else {
          return 0;
        }
      }
    } else {
      return 0;
    }
  };
  handlePowerModuleCommErr = (prevChargerState, chargerState) => {
    const prevOutletState_1 = prevChargerState && Array.isArray(prevChargerState) && prevChargerState.length > 0 && prevChargerState[0]; // prettier-ignore
    const outletState_1 = chargerState && Array.isArray(chargerState) && chargerState.length > 0 && chargerState[0]; // prettier-ignore
    const prevOutletState_2 = prevChargerState && Array.isArray(prevChargerState) && prevChargerState.length > 1 && prevChargerState[1]; // prettier-ignore
    const outletState_2 = chargerState && Array.isArray(chargerState) && chargerState.length > 1 && chargerState[1]; // prettier-ignore

    // ErrorObj: edited powerModuleCommErr1
    if (
      (!prevOutletState_1?.errorObj?.powerModuleCommErr_1 &&
        outletState_1?.errorObj?.powerModuleCommErr_1)
    ) {
      this.setState({
        oneShotError: {
          show: true,
          code: "POWER_MODULE_COMM_GUN_A",
          outlet: "1",
        },
      });
      setTimeout(() => this.setState({ oneShotError: {} }), 5000);
      return;
    }

    // ErrorObj: added gun1 temp check
    if (
      (!prevOutletState_1?.errorObj?.gunTemperatureErr_1 &&
        outletState_1?.errorObj?.gunTemperatureErr_1)
    ) {
      this.setState({
        oneShotError: {
          show: true,
          code: "GUN_A_TEMP_ERR",
          outlet: "1",
        },
      });
      setTimeout(() => this.setState({ oneShotError: {} }), 5000);
      return;
    }

    // ErrorObj: edited powerModuleCommErr2
    if (
      (!prevOutletState_2?.errorObj?.powerModuleCommErr_2 &&
        outletState_2?.errorObj?.powerModuleCommErr_2)
    ) {
      this.setState({
        oneShotError: {
          show: true,
          code: "POWER_MODULE_COMM_GUN_B",
          outlet: "2",
        },
      });
      setTimeout(() => this.setState({ oneShotError: {} }), 5000);
      return;
    }

    // ErrorObj: added gun2 temp check
    if (
      (!prevOutletState_2?.errorObj?.gunTemperatureErr_2 &&
        outletState_2?.errorObj?.gunTemperatureErr_2)
    ) {
      this.setState({
        oneShotError: {
          show: true,
          code: "GUN_B_TEMP_ERR",
          outlet: "2",
        },
      });
      setTimeout(() => this.setState({ oneShotError: {} }), 5000);
      return;
    }
  };
  render() {
    const initializing = this.isInitializing();
    const interruptProps = { ...this.state, initializing };

    const { config, showBootingScreen } = this.state;

    // Wait for getting the config.json
    if (!config || Object.keys(config).length <= 0) {
      return <Spinner />;
    }

    if (showBootingScreen && config?.useAnimation?.enableOnBoot) {
      return (
        <div className="container">
          <Animation useAnimation={this.state.config?.useAnimation} />
        </div>
      );
    }




    return (
      <MainContext.Provider value={this.state}>
        <AlertBox
          isOneshotError={true}
          iconType="warning"
          display={
            this.state.oneShotError?.show &&
            !this.state.showAlert &&
            !this.state.showEStop &&
            !this.state.errorCode &&
            !this.state.errTogglingTimeout
          }
          onClose={() => this.setState({ oneShotError: {} })}
        />
        <RemoteStartPopup
          gun1Shown={this.state.remoteStartPopupGun1}
          gun2Shown={this.state.remoteStartPopupGun2}
        />
        <SessionSummaryPopup
          popupShown={this.state.sessionSummaryPopupShown}
          sessionData={this.state.sessionSummaryData}
          onClose={this.hideSessionSummaryPopup}
        />
        <InterruptBoundary {...interruptProps}>
          {this.props.children}
          <this.HiddenPreload />
        </InterruptBoundary>
      </MainContext.Provider>
    );
  }
}

export default withTranslation()(withRouter(ContextProvider));
