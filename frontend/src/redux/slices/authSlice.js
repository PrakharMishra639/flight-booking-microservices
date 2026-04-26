import { createSlice } from '@reduxjs/toolkit';
import { LOCAL_STORAGE_KEYS } from '../../utils/constants';

const initialState = {
  user: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER)) || null,
  isAuthenticated: !!localStorage.getItem(LOCAL_STORAGE_KEYS.USER), // Assume authenticated if user data exists
  accessTokenExpiresAt: localStorage.getItem('accessTokenExpiresAt') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessTokenExpiresAt } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      
      if (accessTokenExpiresAt) {
        state.accessTokenExpiresAt = accessTokenExpiresAt;
        localStorage.setItem('accessTokenExpiresAt', accessTokenExpiresAt);
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessTokenExpiresAt = null;
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem('accessTokenExpiresAt');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(state.user));
    }
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
