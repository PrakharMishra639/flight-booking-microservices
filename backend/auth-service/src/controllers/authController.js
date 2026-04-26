const authService = require('../services/authService');
const tokenService = require('../services/tokenService');

const setTokensCookies = (res, accessToken, refreshToken) => {
  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth'
    });
  }
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req);
    setTokensCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json({ success: true, message: 'Registration successful', user: result.user, accessTokenExpiresAt: tokenService.getAccessTokenExpiry() });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req);
    setTokensCookies(res, result.accessToken, result.refreshToken);
    res.json({ success: true, message: 'Login successful', user: result.user, accessTokenExpiresAt: tokenService.getAccessTokenExpiry() });
  } catch (error) { next(error); }
};

const loginWithOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const result = await authService.loginWithOtp(email, otpCode, req);
    setTokensCookies(res, result.accessToken, result.refreshToken);
    res.json({ success: true, message: 'Login successful', user: result.user, accessTokenExpiresAt: tokenService.getAccessTokenExpiry() });
  } catch (error) { next(error); }
};

const requestOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    const result = await authService.requestOtp(email, purpose || 'login');
    res.json({ success: true, message: 'OTP sent successfully', ...result });
  } catch (error) { next(error); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const result = await authService.verifyOtp(email, otpCode);
    res.json({ success: result.valid, message: result.valid ? 'OTP verified' : 'Invalid or expired OTP' });
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    const result = await authService.resetPassword(email, otpCode, newPassword);
    res.json(result);
  } catch (error) {
    if (error.isPasswordMatchError) return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshTokenStr = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshTokenStr) throw Object.assign(new Error('Refresh token required'), { status: 401 });
    const result = await authService.refreshAccessToken(refreshTokenStr);
    setTokensCookies(res, result.accessToken, result.refreshToken);
    res.json({ success: true, user: result.user, accessTokenExpiresAt: tokenService.getAccessTokenExpiry() });
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    const refreshTokenStr = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshTokenStr) await authService.logout(refreshTokenStr);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) { next(error); }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    await authService.logoutAllDevices(userId);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) { next(error); }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const axios = require('axios');
    const response = await axios.get(`${process.env.USER_SERVICE_URL || 'http://localhost:4002'}/internal/${userId}`);
    const user = response.data;
    res.json({
      id: user.user_id, name: user.name, email: user.email, role: user.role,
      is_oauth_user: user.is_oauth_user, has_password: !!user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD'
    });
  } catch (error) { next(error); }
};

// Internal endpoint: verify token for API Gateway
const verifyTokenEndpoint = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: 'Token required' });
  const result = authService.verifyToken(token);
  res.json(result);
};

module.exports = {
  register, login, loginWithOtp, requestOtp, verifyOtp, resetPassword,
  refreshToken, logout, logoutAllDevices, getProfile, verifyTokenEndpoint
};
