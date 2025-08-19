// src/redux/slices/rfidSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  rfidAuthOwner: {
    outletId: null,
    timestamp: null,
  },
};

const rfidSlice = createSlice({
  name: "rfid",
  initialState,
  reducers: {
    setRfidAuthOwner(state, action) {
      state.rfidAuthOwner = action.payload;
    },
    clearRfidAuthOwner(state) {
      state.rfidAuthOwner = { outletId: null, timestamp: null };
    },
  },
});

export const { setRfidAuthOwner, clearRfidAuthOwner } = rfidSlice.actions;

export default rfidSlice.reducer;
