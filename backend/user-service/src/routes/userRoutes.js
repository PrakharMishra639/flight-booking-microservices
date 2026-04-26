const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Public routes (called via gateway with auth)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.patch('/change-password', userController.changePassword);

// Internal routes (called by other services directly)
router.get('/internal/:userId', userController.getById);
router.get('/internal/email/:email', userController.getByEmail);
router.post('/internal/create', userController.create);
router.post('/internal/find-by-email-or-phone', userController.findByEmailOrPhone);
router.post('/internal/oauth', userController.findOrCreateOAuth);

// Admin routes
router.get('/admin/all', userController.getAllUsers);
router.patch('/admin/:userId/role', userController.updateUserRole);

module.exports = router;
