const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { Op } = require('sequelize');

const generateAccessToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

const getAccessTokenExpiry = () => {
  return Date.now() + 15 * 60 * 1000;
};

const generateRefreshToken = async (user, deviceInfo = null, ipAddress = null, userAgent = null) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || 7));

  const refreshToken = await RefreshToken.create({
    user_id: user.user_id,
    token,
    expires_at: expiresAt,
    ip_address: ipAddress,
    user_agent: userAgent
  });

  return refreshToken;
};

const findRefreshToken = async (tokenString) => {
  return await RefreshToken.findOne({
    where: {
      token: tokenString,
      is_revoked: false,
      expires_at: { [Op.gt]: new Date() }
    }
  });
};

const revokeRefreshToken = async (tokenString) => {
  const refreshToken = await RefreshToken.findOne({ where: { token: tokenString } });
  if (refreshToken) {
    await refreshToken.update({ is_revoked: true });
  }
  return true;
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.update(
    { is_revoked: true },
    { where: { user_id: userId, is_revoked: false } }
  );
  return true;
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  generateAccessToken,
  getAccessTokenExpiry,
  generateRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  verifyAccessToken
};
