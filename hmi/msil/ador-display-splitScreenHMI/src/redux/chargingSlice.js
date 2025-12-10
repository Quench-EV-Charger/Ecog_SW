// chargingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import moment from 'moment-timezone';
import { buildConfig } from '../Utilis/UtilityFunction';

const initialState = {
  chargerState: [],
  isCommunicationError: false,
  config: {},
  isChargeCableConnected: false,
  activeConnector: 0,
  SECCreachable: false,
  showAlert: false,
  errorCode: null,
  selectedState: {},
  faultedOutlets: [],
  faultedOutletsTime: {},
  blockedOutlets: [],
  availableOutlets: [],
  showEStop: false,
  eStopRoutingHandled: false,
  powerFailureRoutingHandled: false,
  outletToShowOnEStopRelease: null,
  activeOutlets: [],
  chargingMode: 0,
  preventAutoRoute: false,
  stoppingOutlet: false,
  ocppOnline: false,
  networkAccess: false,
  errTogglingTimeout: false,
  seccTimeSynced: false,
  reservedOutlets: [],
  showBootingScreen: false,
  stoppingOutlets: [],
  preventAutoRouteOutlets: [],
  firstOutletIdToAllowAutoRoute: null,
  preparingOutletsIds: [],
  shouldGoHomeOnSessionStart: false,
  remoteAuthMode: null,
  allowToPublishNetworkAccess: false,
  showHandshakeErrorModal: false,
  errorEventObj: {},
  errorObj: {},
  oneShotError: {},
  inoperativeOutlets: [],
  shouldDisplay: 0,
  isGunOneSpinner: true,
  isGunTwoSpinner: true,
  ipcClientRoute: "ws://127.0.0.1:2000",
  isOutletNotActive: true
};

export const initializeConfig = createAsyncThunk('charging/initializeConfig', async (_, thunkAPI) => {
  const config = await buildConfig();
  if (moment?.tz?.setDefault) {
    const timezone = config?.timezone || 'Asia/Kolkata';
    moment.tz.setDefault(timezone);
  }
  return config;
});


const chargingSlice = createSlice({
  name: 'charging',
  initialState,
  reducers: {
    setChargerState: (state, action) => {
      Object.assign(state, action.payload);
    },
    setSelectedState: (state, action) => {
      state.selectedState = action.payload;
    },
    setChargingMode: (state, action) => {
      state.chargingMode = action.payload;
    },
    setPreventAutoRoute: (state, action) => {
      state.preventAutoRoute = action.payload;
    },
    setShowHandshakeErrorModal: (state, action) => {
      state.showHandshakeErrorModal = action.payload;
    },
    setShouldGoHomeOnSessionStart: (state, action) => {
      state.shouldGoHomeOnSessionStart = action.payload;
    },
    setSeccTimeSynced: (state, action) => {
      state.seccTimeSynced = action.payload;
    },
    setIsGunSpinnerOne: (state, action) => {
      state.isGunOneSpinner = action.payload;
    },
    setIsGunSpinnerTwo: (state, action) => {
      state.isGunTwoSpinner = action.payload;
    },
    addPreventAutoRouteOutlets: (state, action) => {
      state.preventAutoRouteOutlets.push(action.payload);
    },
    setIpcClient: (state, action) => {
      state.ipcClient = action.payload;
    },
    setErrTogglingTimeout: (state, action) => {
      state.errTogglingTimeout = action.payload;
    },
    setNetworkAccess: (state, action) => {
      state.networkAccess = action.payload;
    },
    setAllowToPublishNetworkAccess: (state, action) => {
      state.allowToPublishNetworkAccess = action.payload;
    },
    setErrorCode: (state, action) => {
      state.errorCode = action.payload;
    },
    setActiveConnector: (state, action) => {
      state.activeConnector = action.payload;
    },
    setSECCreachable: (state, action) => {
      state.SECCreachable = action.payload;
    },
    setOCPPOnline: (state, action) => {
      state.ocppOnline = action.payload
    },
    setPowerFailureRoutingHandled: (state, action) => {
      state.powerFailureRoutingHandled = action.payload
    },
    setEStopRoutingHandled : (state,action) => {
      state.eStopRoutingHandled = action.payload
    },
    setStoppingOutlet: (state, action) => {
      state.stoppingOutlet = action.payload
    },
    setRemoteAuthMode: (state, action) => {
      state.remoteAuthMode = action.payload
    },
    setIsCommunicationError: (state, action) => {
      state.isCommunicationError = action.payload
    },
    setIsOutletNotActive : (state, action) => {
      state.isOutletNotActive = action.payload
    }
  }, 
  extraReducers: (builder) => {
    builder
      .addCase(initializeConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      // .addCase(fetchChargerState.fulfilled, (state, action) => {
      //   // state.chargerState = action.payload;
      // });
  },
});

export const {
  setChargerState,
  setSelectedState,
  setChargingMode,
  setPreventAutoRoute,
  setShowHandshakeErrorModal,
  setShouldGoHomeOnSessionStart,
  setSeccTimeSynced,
  setIsGunSpinnerOne,
  setIsGunSpinnerTwo,
  addPreventAutoRouteOutlets,
  setIpcClient,
  setErrTogglingTimeout,
  setNetworkAccess,
  setAllowToPublishNetworkAccess,
  setErrorCode,
  setActiveConnector,
  setSECCreachable,
  setOCPPOnline,
  setPowerFailureRoutingHandled,
  setEStopRoutingHandled,
  setStoppingOutlet,
  setRemoteAuthMode,
  setIsCommunicationError,
  setIsOutletNotActive
} = chargingSlice.actions;

export default chargingSlice.reducer;
