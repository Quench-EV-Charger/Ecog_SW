import React from 'react';
import { HashRouter as Router } from "react-router-dom";

import { withTranslation } from "react-i18next";
import MainProvider from "./MainProvider";

jest.mock('../utils', () => {
  const originalModule = jest.requireActual('../utils');

  return {
    __esModule: true,
    ...originalModule,
    buildConfig: async () => ({
      "checkSECC": "10.20.27.100",
      "comboMode": true,
      "branding": {
        "enable": true,
        "brandingLogo": {
          "lightTheme": "ador_logo_black_text.png",
          "darkTheme": "ador_logo_white_text.png"
        }
      },
      "chargingBackground": {
        "images": [
          "india_1-min.jpg",
          "india_2-min.jpg",
          "india_3-min.jpg",
          "india_4-min.jpg",
          "india_5-min.jpg",
          "india_6-min.jpeg",
          "india_7-min.jpg"
        ],
        "changeFreqSec": 4,
        "changeRandomly": true
      },
      "languages": [
        {
          "key": "en",
          "displayValue": "English"
        }
      ],
      "rebootTimeSec": 300,
      "timeToGoHomeSec": 60,
      "timeToGoScreensaverSec": 120,
      "API": "http://localhost:3001",
      "socketUrl": "ws://localhost:3001",
      "useAnimation": {
        "enableOnBoot": false,
        "onBootTimeSec": 60,
        "enableOnStartingPage": false,
        "enableOnRebootScreen": false,
        "video": "quench-animation.mp4"
      },
      "useQAsOutletID": false,
      "isRfidFlow": false
    }),
    getState: async () => ({
      "auth": true,
      "bookedfor": "string",
      "BulkSOC": 0,
      "busy": true,
      "CCSCharging": true,
      "ChademoCharging": true,
      "ChargingComplete": true,
      "controller": "string",
      "conmaxc": 0,
      "curr_ses_secs": 0,
      "curr_ses_Wh": 0,
      "currBookingEnd": "string",
      "d1": true,
      "d2": true,
      "displayScreen": 0,
      "EndHour": 0,
      "EndMinute": 0,
      "EVCabinConditioning": "string",
      "EVCCID": "string",
      "EVEnergyCapacity": "string",
      "EVEnergyRequest": "string",
      "EVErrorCode": "string",
      "EVMAC": "string",
      "evmaxc": 0,
      "evmaxv": 0,
      "EVReady": "string",
      "EVRESSConditioning": "string",
      "EVRESSSOC": 0,
      "evsemaxc": 0,
      "evsemaxp": 0,
      "evsemaxv": 0,
      "evsestat": 0,
      "externalAuth": true,
      "externalChargeStop": true,
      "externalStop": true,
      "FullSOC": 0,
      "id": "string",
      "iso": 0,
      "j": true,
      "nextbooking": "string",
      "out_of_order": true,
      "outlet": "string",
      "phs": 0,
      "phsAuth": 0,
      "phsCC": 0,
      "phsCha": 0,
      "phsPD": 0,
      "phsPre": 0,
      "phsStart": 0,
      "phsStop": 0,
      "pilot": 0,
      "PowerCapW": 0,
      "pc": 0,
      "pp": 0,
      "pv": 0,
      "site": "string",
      "soc": 0,
      "startCCS": true,
      "tc": 0,
      "tenant": "string",
      "testEV": true,
      "timestamp": "string",
      "timeToBulk": 0,
      "timeToFull": 0,
      "tv": 0,
      "user": "string",
      "version": "string"
    }),
    clearRfid: async () => ({}),
    getReservedOutlets: async () => ([])
  };
});

jest.mock('../helpers/ComboHelpers', () => {
  const originalModule = jest.requireActual('../helpers/ComboHelpers');

  return {
    __esModule: true,
    ...originalModule,
    fetchCombo: async () => 1
  };
});

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    json: jest.fn().mockResolvedValue({}),
    text: () => '1'
  })
});

afterEach(() => {
  jest.restoreAllMocks();
});

const TestProvider = ({ children }) => {
  return (
    <Router>
      <MainProvider>
        {children}
      </MainProvider>
    </Router>
  )
}
export default withTranslation()(TestProvider);
