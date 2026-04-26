import axiosInstance from '../../utils/axiosConfig';

const login = async (email, password) => {
  const response = await axiosInstance.post('/auth/login', { email, password });
  return response.data;
};

const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

const requestOtp = async (email, purpose) => {
  const response = await axiosInstance.post('/auth/request-otp', { email, purpose });
  return response.data;
};

const verifyOtp = async (email, otpCode) => {
  const response = await axiosInstance.post('/auth/verify-otp', { email, otpCode });
  return response.data;
};

const loginWithOtp = async (email, otpCode) => {
  const response = await axiosInstance.post('/auth/login-otp', { email, otpCode });
  return response.data;
};

const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

const getProfile = async () => {
  const response = await axiosInstance.get('/auth/profile');
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await axiosInstance.put('/auth/profile', profileData);
  return response.data;
};

const resetPassword = async (email, otpCode, newPassword) => {
  const response = await axiosInstance.post('/auth/reset-password', { email, otpCode, newPassword });
  return response.data;
};

const refreshAccessToken = async () => {
  const response = await axiosInstance.post('/auth/refresh-token');
  return response.data;
};

const logoutAllDevices = async () => {
  const response = await axiosInstance.post('/auth/logout-all');
  return response.data;
};

const changePassword = async (oldPassword, newPassword) => {
  const response = await axiosInstance.patch('/auth/change-password', { oldPassword, newPassword });
  return response.data;
};

const getGoogleOAuthUrl = async (code_challenge, state, redirect_uri) => {
  const response = await axiosInstance.get('/oauth/url/google', {
    params: { code_challenge, state, redirect_uri }
  });
  return response.data;
};

const exchangeGoogleToken = async (code, code_verifier, redirect_uri, state) => {
  const response = await axiosInstance.post('/oauth/google/token', {
    code,
    code_verifier,
    redirect_uri,
    state
  });
  return response.data;
};

const authService = {
  login,
  register,
  requestOtp,
  verifyOtp,
  loginWithOtp,
  resetPassword,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  getProfile,
  updateProfile,
  changePassword,
  getGoogleOAuthUrl,
  exchangeGoogleToken,
};

export default authService;
