const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login-otp', authController.loginWithOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAllDevices);
router.get('/profile', authController.getProfile);

// Internal endpoint for API Gateway JWT verification
router.post('/verify-token', authController.verifyTokenEndpoint);

module.exports = router;
