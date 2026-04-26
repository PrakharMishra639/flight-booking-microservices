import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import checkinService from '../services/checkinService';

export const fetchBookingByPNR = createAsyncThunk(
  'checkin/fetchBooking',
  async (pnr, { rejectWithValue }) => {
    try {
      const response = await checkinService.getBookingByPNR(pnr);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

export const confirmCheckin = createAsyncThunk(
  'checkin/confirm',
  async (pnr, { rejectWithValue }) => {
    try {
      const response = await checkinService.confirmCheckin(pnr);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Check-in failed');
    }
  }
);

const initialState = {
  booking: null,
  window: null,
  boardingPasses: [],
  loading: false,
  error: null,
  success: false
};

const checkinSlice = createSlice({
  name: 'checkin',
  initialState,
  reducers: {
    resetCheckinState: (state) => {
      state.booking = null;
      state.window = null;
      state.boardingPasses = [];
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Booking
      .addCase(fetchBookingByPNR.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingByPNR.fulfilled, (state, action) => {
        state.loading = false;
        state.booking = action.payload.booking;
        state.window = action.payload.window;
        state.boardingPasses = action.payload.booking?.BoardingPasses || [];
      })
      .addCase(fetchBookingByPNR.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Confirm Checkin
      .addCase(confirmCheckin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmCheckin.fulfilled, (state, action) => {
        state.loading = false;
        state.boardingPasses = action.payload.boardingPasses;
        state.success = true;
      })
      .addCase(confirmCheckin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetCheckinState } = checkinSlice.actions;
export default checkinSlice.reducer;
