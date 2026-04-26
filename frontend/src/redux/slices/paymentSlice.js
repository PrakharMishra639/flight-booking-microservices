import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentPayment: null,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearPayment: (state) => {
      state.currentPayment = null;
      state.error = null;
    }
  },
});

export const { setCurrentPayment, setLoading, setError, clearPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
