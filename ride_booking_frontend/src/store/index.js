import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';

/**
 * PUBLIC_INTERFACE
 * Redux store for the application combining auth and ride slices.
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
    ride: rideReducer,
  },
});

export default store;
