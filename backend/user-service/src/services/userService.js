const bcrypt = require('bcryptjs');
const User = require('../models/User');

const findUserById = async (userId, includeBookings = false) => {
  return await User.findByPk(userId);
};

const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email: email.toLowerCase().trim() } });
};

const findUserByEmailOrPhone = async (email, phone) => {
  const { Op } = require('sequelize');
  const where = { [Op.or]: [{ email }] };
  if (phone) where[Op.or].push({ phone });
  return await User.findOne({ where });
};

const createUser = async (userData) => {
  return await User.create(userData);
};

const updateUser = async (userId, updates) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  await user.update(updates);
  return user;
};

const changePassword = async (userId, hashedPassword) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  // Set directly because password is already hashed by caller
  await User.update({ password_hash: hashedPassword }, { where: { user_id: userId }, individualHooks: false });
  return true;
};

const getAllUsers = async () => {
  return await User.findAll({
    attributes: ['user_id', 'name', 'email', 'phone', 'role', 'status', 'created_at'],
    order: [['created_at', 'DESC']]
  });
};

const updateUserRole = async (userId, role) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) throw new Error('Invalid role');
  await user.update({ role });
  return user;
};

const findOrCreateOAuthUser = async (profile) => {
  let user = await User.findOne({
    where: { email: profile.email.toLowerCase().trim() }
  });

  if (user) {
    if (!user.is_oauth_user) {
      await user.update({ is_oauth_user: true, oauth_provider: profile.provider, oauth_id: profile.id });
    }
    return user;
  }

  user = await User.create({
    name: profile.name,
    email: profile.email.toLowerCase().trim(),
    password_hash: 'OAUTH_NO_PASSWORD',
    is_oauth_user: true,
    oauth_provider: profile.provider,
    oauth_id: profile.id,
    role: 'USER',
    status: 'ACTIVE'
  });

  return user;
};

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByEmailOrPhone,
  createUser,
  updateUser,
  changePassword,
  getAllUsers,
  updateUserRole,
  findOrCreateOAuthUser
};
