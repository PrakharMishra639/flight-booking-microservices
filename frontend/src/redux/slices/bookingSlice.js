import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedSchedule: null,
  selectedSeatsBySchedule: {}, // { scheduleId: [ { flight_seat_id, ... } ] }
  passengers: [],
  contactEmail: '',
  currentBooking: null, 
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setScheduleSelection: (state, action) => {
      state.selectedSchedule = action.payload;
      state.selectedSeatsBySchedule = {}; // reset seats on new flight
    },
    toggleSeatSelection: (state, action) => {
      const { scheduleId, seat } = action.payload;
      if (!state.selectedSeatsBySchedule[scheduleId]) {
        state.selectedSeatsBySchedule[scheduleId] = [];
      }
      
      const seatsList = state.selectedSeatsBySchedule[scheduleId];
      const index = seatsList.findIndex(s => s.flight_seat_id === seat.flight_seat_id);
      
      if (index >= 0) {
        seatsList.splice(index, 1);
      } else {
        seatsList.push(seat);
      }
    },
    setPassengers: (state, action) => {
      state.passengers = action.payload;
    },
    setContactEmail: (state, action) => {
      state.contactEmail = action.payload;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearBookingFlow: (state) => {
      state.selectedSchedule = null;
      state.selectedSeatsBySchedule = {};
      state.passengers = [];
      state.currentBooking = null;
      state.error = null;
    }
  },
});

export const { 
  setScheduleSelection, 
  toggleSeatSelection, 
  setPassengers, 
  setContactEmail,
  setCurrentBooking,
  setLoading, 
  setError, 
  clearBookingFlow 
} = bookingSlice.actions;
export default bookingSlice.reducer;
