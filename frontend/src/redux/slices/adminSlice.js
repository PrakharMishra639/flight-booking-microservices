import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: null,
  bookings: [],
  payments: [],
  airlines: [],
  airports: [],
  flights: [],
  schedules: [],
  users: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },
    setPayments: (state, action) => {
      state.payments = action.payload;
    },
    setAirlines: (state, action) => {
      state.airlines = action.payload;
    },
    setAirports: (state, action) => {
      state.airports = action.payload;
    },
    setFlights: (state, action) => {
      state.flights = action.payload;
    },
    setSchedules: (state, action) => {
      state.schedules = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    updateUserInState: (state, action) => {
      const index = state.users.findIndex(u => u.user_id === action.payload.user_id);
      if (index !== -1) state.users[index] = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setStats, 
  setBookings, 
  setPayments, 
  setAirlines, 
  setAirports, 
  setFlights, 
  setSchedules, 
  setUsers,
  updateUserInState,
  setLoading, 
  setError 
} = adminSlice.actions;

export default adminSlice.reducer;
