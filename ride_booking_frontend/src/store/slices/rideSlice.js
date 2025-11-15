import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pickup: '',
  dropoff: '',
  status: 'idle', // idle | searching | assigned | enroute | arrived | completed | cancelled
  driver: null,
  trip: null,
};

/**
 * PUBLIC_INTERFACE
 * rideSlice manages booking inputs and ride lifecycle states.
 */
const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    // PUBLIC_INTERFACE
    setPickup(state, action) {
      state.pickup = action.payload;
    },
    // PUBLIC_INTERFACE
    setDropoff(state, action) {
      state.dropoff = action.payload;
    },
    // PUBLIC_INTERFACE
    setStatus(state, action) {
      state.status = action.payload;
    },
    // PUBLIC_INTERFACE
    setDriver(state, action) {
      state.driver = action.payload;
    },
    // PUBLIC_INTERFACE
    setTrip(state, action) {
      state.trip = action.payload;
    },
    // PUBLIC_INTERFACE
    resetRide() {
      return initialState;
    },
  },
});

export const { setPickup, setDropoff, setStatus, setDriver, setTrip, resetRide } = rideSlice.actions;
export default rideSlice.reducer;
