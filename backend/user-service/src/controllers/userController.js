const userService = require('../services/userService');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await userService.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_oauth_user: user.is_oauth_user,
      has_password: !!user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD'
    });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const allowedUpdates = ['name'];
    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const user = await userService.updateUser(userId, updates);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'Profile updated', user: { id: user.user_id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { oldPassword, newPassword } = req.body;
    const user = await userService.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.password_hash && user.password_hash !== 'OAUTH_NO_PASSWORD') {
      const isValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });
      const isSame = await bcrypt.compare(newPassword, user.password_hash);
      if (isSame) return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userService.changePassword(userId, hashedPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
};

// Internal endpoints (called by other services)
const getById = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) { next(error); }
};

const getByEmail = async (req, res, next) => {
  try {
    const user = await userService.findUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) { next(error); }
};

const findByEmailOrPhone = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const user = await userService.findUserByEmailOrPhone(email, phone);
    res.json({ exists: !!user, user: user || null });
  } catch (error) { next(error); }
};

const findOrCreateOAuth = async (req, res, next) => {
  try {
    const user = await userService.findOrCreateOAuthUser(req.body);
    res.json(user);
  } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole(req.params.userId, req.body.role);
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

module.exports = {
  getProfile, updateProfile, changePassword,
  getById, getByEmail, create, findByEmailOrPhone, findOrCreateOAuth,
  getAllUsers, updateUserRole
};
