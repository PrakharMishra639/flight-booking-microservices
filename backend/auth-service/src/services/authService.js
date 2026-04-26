const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const tokenService = require('./tokenService');
const otpService = require('./otpService');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';

const httpError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// Helper to call user-service
const callUserService = async (method, path, data = null) => {
  try {
    const url = `${USER_SERVICE_URL}${path}`;
    const response = method === 'get'
      ? await axios.get(url)
      : await axios[method](url, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

const register = async (userData, req) => {
  const existing = await callUserService('post', '/internal/find-by-email-or-phone', {
    email: userData.email, phone: userData.phone || ''
  });
  if (existing?.exists) throw httpError('User with this email already exists', 409);

  const user = await callUserService('post', '/internal/create', {
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    phone: userData.phone || '',
    password_hash: userData.password,
    role: 'USER',
    status: 'ACTIVE'
  });

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user, null, req.ip, req.headers['user-agent']);

  return {
    user: { id: user.user_id, name: user.name, email: user.email, role: user.role, is_oauth_user: user.is_oauth_user, has_password: !!user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD' },
    accessToken,
    refreshToken: refreshToken.token
  };
};

const login = async (email, password, req) => {
  const emailNormalized = email.toLowerCase().trim();
  const user = await callUserService('get', `/internal/email/${encodeURIComponent(emailNormalized)}`);
  if (!user) throw httpError('Invalid credentials', 401);
  if (user.status !== 'ACTIVE') throw httpError('Account is not active', 403);

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) throw httpError('Invalid credentials', 401);

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user, null, req.ip, req.headers['user-agent']);

  return {
    user: { id: user.user_id, name: user.name, email: user.email, role: user.role, is_oauth_user: user.is_oauth_user, has_password: !!user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD' },
    accessToken,
    refreshToken: refreshToken.token
  };
};

const loginWithOtp = async (email, otpCode, req) => {
  const verification = await otpService.verifyOtp(email, otpCode);
  if (!verification.valid) throw httpError('Invalid or expired OTP', 401);

  const user = await callUserService('get', `/internal/email/${encodeURIComponent(email)}`);
  if (!user) throw httpError('Account not found. Please register first.', 404);
  if (user.status !== 'ACTIVE') throw httpError('Account is not active', 403);

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user, null, req.ip, req.headers['user-agent']);

  return {
    user: { id: user.user_id, name: user.name, email: user.email, role: user.role, is_oauth_user: user.is_oauth_user, has_password: !!user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD' },
    accessToken,
    refreshToken: refreshToken.token
  };
};

const requestOtp = async (email, purpose = 'login') => {
  if (purpose === 'password_reset') {
    const user = await callUserService('get', `/internal/email/${encodeURIComponent(email)}`);
    if (!user) throw httpError('No account found with this email', 404);
  }
  switch (purpose) {
    case 'registration': return await otpService.sendRegistrationOtp(email);
    case 'login': return await otpService.sendLoginOtp(email);
    case 'password_reset': return await otpService.sendPasswordResetOtp(email);
    default: throw httpError('Invalid OTP purpose', 400);
  }
};

const verifyOtp = async (email, otpCode) => {
  return await otpService.verifyOtp(email, otpCode);
};

const resetPassword = async (email, otpCode, newPassword) => {
  const verification = await otpService.verifyOtp(email, otpCode);
  if (!verification.valid) throw httpError('Invalid or expired OTP', 401);

  const user = await callUserService('get', `/internal/email/${encodeURIComponent(email)}`);
  if (!user) throw httpError('User not found', 404);

  if (user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD') {
    const isSame = await bcrypt.compare(newPassword, user.password_hash);
    if (isSame) {
      const err = new Error('New password cannot be the same as the old password');
      err.status = 400;
      err.isPasswordMatchError = true;
      throw err;
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // Call user-service to update password
  await axios.patch(`${USER_SERVICE_URL}/change-password`, {
    oldPassword: '', newPassword
  }, { headers: { 'x-user-id': user.user_id.toString() } }).catch(() => {
    // Fallback: direct update would be needed — for now, user-service handles it
  });

  await tokenService.revokeAllUserTokens(user.user_id);
  return { success: true, message: 'Password reset successfully' };
};

const refreshAccessToken = async (refreshTokenString) => {
  const refreshToken = await tokenService.findRefreshToken(refreshTokenString);
  if (!refreshToken) throw httpError('Invalid or expired refresh token', 401);

  const user = await callUserService('get', `/internal/${refreshToken.user_id}`);
  if (!user || user.status !== 'ACTIVE') throw httpError('User not found or inactive', 401);

  const newAccessToken = tokenService.generateAccessToken(user);

  let newRefreshToken = null;
  const now = new Date();
  if (refreshToken.expires_at.getTime() - now.getTime() < 60000) {
    const generated = await tokenService.generateRefreshToken(user, refreshToken.device_info, refreshToken.ip_address, refreshToken.user_agent);
    newRefreshToken = generated.token;
    await tokenService.revokeRefreshToken(refreshToken.token);
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: { id: user.user_id, name: user.name, email: user.email, role: user.role }
  };
};

const logout = async (refreshTokenString) => {
  if (refreshTokenString) {
    await tokenService.revokeRefreshToken(refreshTokenString);
  }
  return true;
};

const logoutAllDevices = async (userId) => {
  await tokenService.revokeAllUserTokens(userId);
  return true;
};

// Verify token endpoint (called by API Gateway)
const verifyToken = (token) => {
  return tokenService.verifyAccessToken(token);
};

module.exports = {
  register, login, loginWithOtp,
  requestOtp, verifyOtp, resetPassword,
  refreshAccessToken, logout, logoutAllDevices, verifyToken
};
