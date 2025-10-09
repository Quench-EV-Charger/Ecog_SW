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
import { addOrUpdateSessionToDb, deleteSession } from "../localDb/dbActions";
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
import {ChargingMode} from "../screens/chargingmode"
import { startupApiCall } from "../apis/Queries";

const importAll = (r) => r.keys().map(r);

class ContextProvider extends Component {
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
    shouldDisplay:0,
    isGunOneSpinner: true,
    isGunTwoSpinner: true,
    setIsGunSpinnerTwo: (isGunTwoSpinner) => this.setState({isGunTwoSpinner}),
    setIsGunSpinnerOne: (isGunOneSpinner) => this.setState({isGunOneSpinner})
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
      this.state.changePath(`/session-result?user=${user}`);
    } else if (pathname === "/charging" && (evsestat === 5 || pilot === 7)) {
      this.state.changePath(`/session-result?user=${user}&iswentwrong=true`);
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
      !pathname.includes("/session-result") &&
      pathname === "/unplugev"
    ) {
      if (this.props.location?.search === "?isTimeout=true") {
        this.state.changePath("/");
      } else {
        this.state.changePath(`/session-result?user=${user}`);
      }
    } else if (
      !inStoppingProccess(selectedState) &&
      !isNeedUnplug(selectedState) &&
      !pathname.includes("/session-result") &&
      pathname === "/charging" &&
      pilot < 3 &&
      phs < 3
    ) {
      this.state.changePath(`/session-result?user=${user}`);
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
          shouldDisplay:this.displayVCCUPopup()
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
          ((chargerState[0].errorObj?.overVoltageErr)||(chargerState[0].errorObj?.underVoltageErr));
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
      } catch (error) {}
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

  async componentDidMount() {
    this.setupIpcMqtt();

    // fetch state every second
    this.pollStateInterval = setInterval(this.fetchState, 1000);
    setImmediate(this.fetchState);

    const config = await buildConfig();
    this.setState({ config });

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
    if (nowAuthenticatedOne) deleteSession(String(nowAuthenticatedOne?.outlet),String(nowAuthenticatedOne?.user));

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
            path === "/session-result" ||
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
      ((chargerState[0] && chargerState[0]?.errorObj?.overVoltageErr) ||(
         chargerState[0] && chargerState[0]?.errorObj?.underVoltageErr)) 
    );
    if (
      isSupplyVoltage) {
      // console.log(JSON.parse(this.state.errorEventObj?.data));
      // ErrorObj: put "overVoltageErr" or "underVoltageErr" in errorcode.
      if(chargerState[0] && chargerState[0]?.errorObj?.underVoltageErr){
        errorObjReturn = { showAlert: true, showEStop: false, errorCode: "ERR_UNDER_VOLTAGE" }; // prettier-ignore
        return errorObjReturn;
      }
      else if (chargerState[0] && chargerState[0]?.errorObj?.overVoltageErr){
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
    const { chargingMode ,config} = this.state;
    if (config?.comboMode){
      // Check if the mode is different from the current one
      if (chargingMode === String(mode)) {
        console.log("Mode is already set to", mode, "No need to publish.");
        return; // Skip publishing if the mode is the same
      }

      this.setState({
        chargingMode:String(mode)
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
    else{
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
  
  displayVCCUPopup = () => {
    if (this.state.chargerState.length !== 0 && Array.isArray(this.state.chargerState)) {
      if (this.state?.chargerState[1]) {
        if (this.state.chargingMode === "0") {
          return 0;
        }      
        else if (this.state.chargingMode === "1") {
          const chargerState = this.state.chargerState;

          if(chargerState[0].needsUnplug || chargerState[1].needsUnplug){
            return 0;
          }
          // Check if both guns have phs == 1 and pilot == 0
          else if ((chargerState[0]?.phs === 1 && chargerState[1]?.phs === 1)) {
            return 1;
          }
          else if((this.state.chargerState[0]?.phs == 1 && this.state.chargerState[1]?.phs == 2)||
          (this.state.chargerState[0]?.phs == 2 && this.state.chargerState[1]?.phs == 1)  ){
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
        <InterruptBoundary {...interruptProps}>
          {this.props.children}
          <this.HiddenPreload />
        </InterruptBoundary>
      </MainContext.Provider>
    );
  }
}

export default withTranslation()(withRouter(ContextProvider));
