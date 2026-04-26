import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import flightReducer from './slices/flightSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/paymentSlice';
import adminReducer from './slices/adminSlice';
import checkinReducer from './slices/checkinSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flight: flightReducer,
    booking: bookingReducer,
    payment: paymentReducer,
    admin: adminReducer,
    checkin: checkinReducer,
  },
});
