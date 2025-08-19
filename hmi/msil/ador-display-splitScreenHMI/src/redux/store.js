import { configureStore } from "@reduxjs/toolkit";
import chargingReducer from "./chargingSlice";
import languageReducer from './languageSlice';
import rfidReducer from "./rfidSlice"

const store = configureStore({
  reducer: {
    charging: chargingReducer,
    language: languageReducer,
    rfid: rfidReducer
  },
})

export default store;
