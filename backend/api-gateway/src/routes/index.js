const express = require('express');
const router = express.Router();
const services = require('../config/services');
const { authProxy, requireAdmin } = require('../middleware/authProxy');
const { authLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { createProxy } = require('../middleware/proxyMiddleware');

// ============================================
// AUTH ROUTES (No auth required for most)
// ============================================
const authProxy_ = createProxy(services.auth);
router.post('/api/auth/register', authLimiter, authProxy_);
router.post('/api/auth/login', authLimiter, authProxy_);
router.post('/api/auth/login-otp', authLimiter, authProxy_);
router.post('/api/auth/request-otp', authLimiter, authProxy_);
router.post('/api/auth/verify-otp', authLimiter, authProxy_);
router.post('/api/auth/reset-password', authLimiter, authProxy_);
router.post('/api/auth/refresh-token', authLimiter, authProxy_);
router.post('/api/auth/logout', authProxy, authProxy_);
router.post('/api/auth/logout-all', authProxy, authProxy_);
router.get('/api/auth/profile', authProxy, authProxy_);

// ============================================
// OAUTH ROUTES
// ============================================
router.get('/api/oauth/url/:provider', authProxy_);
router.post('/api/oauth/google/token', authProxy_);
router.get('/api/oauth/google/callback', authProxy_);
router.get('/api/oauth/google', authProxy_);

// ============================================
// USER ROUTES (Auth required)
// ============================================
const userProxy = createProxy(services.user);
router.get('/api/users/profile', authProxy, userProxy);
router.put('/api/users/profile', authProxy, userProxy);
router.patch('/api/users/change-password', authProxy, userProxy);

// ============================================
// SEARCH / FLIGHT ROUTES (Public for search, admin for CRUD)
// ============================================
const flightProxy = createProxy(services.flight);
router.get('/api/search/flights', searchLimiter, flightProxy);
router.get('/api/search/filters', searchLimiter, flightProxy);
router.get('/api/search/prices', flightProxy);
router.get('/api/search/airports', flightProxy);
router.get('/api/search/airports/nearby', flightProxy);
router.get('/api/search/airports/:code', flightProxy);

// ============================================
// SEAT ROUTES (Public for viewing, Auth for locking)
// ============================================
const seatProxy = createProxy(services.seat);
router.get('/api/seats/schedule/:scheduleId', seatProxy);
router.post('/api/seats/lock', authProxy, seatProxy);
router.post('/api/seats/unlock', authProxy, seatProxy);
router.get('/api/seats/lock-status/:scheduleId/:seatId', seatProxy);

// ============================================
// BOOKING ROUTES (Auth required)
// ============================================
const bookingProxy = createProxy(services.booking);
router.post('/api/booking/create', authProxy, bookingProxy);
router.get('/api/booking/user/bookings', authProxy, bookingProxy);
router.get('/api/booking/:bookingId', authProxy, bookingProxy);
router.post('/api/booking/confirm/:bookingId', authProxy, bookingProxy);
router.post('/api/booking/cancel/:bookingId', authProxy, bookingProxy);
router.post('/api/booking/extend-timeout', authProxy, bookingProxy);

// ============================================
// PAYMENT ROUTES (Auth required)
// ============================================
router.post('/api/payment/initiate', authProxy, bookingProxy);
router.post('/api/payment/manual-success', authProxy, bookingProxy);
router.get('/api/payment/:paymentId/status', authProxy, bookingProxy);

// ============================================
// WEBHOOK (No auth - called by Stripe)
// ============================================
router.post('/api/webhook', bookingProxy);

// ============================================
// CHECK-IN ROUTES (Public for lookup, auth optional)
// ============================================
router.post('/api/checkin/lookup', bookingProxy);
router.post('/api/checkin/confirm', bookingProxy);

// ============================================
// PRICING ROUTES (Internal/Public)
// ============================================
const pricingProxy = createProxy(services.pricing);
router.post('/api/pricing/calculate', pricingProxy);
router.get('/api/pricing/class-multiplier/:seatClass', pricingProxy);

// ============================================
// NOTIFICATION ROUTES (Admin only)
// ============================================
const notificationProxy = createProxy(services.notification);
router.get('/api/notifications/logs', authProxy, requireAdmin, notificationProxy);

// ============================================
// ADMIN ROUTES (Admin required)
// ============================================
const analyticsProxy = createProxy(services.analytics);
router.get('/api/admin/dashboard', authProxy, requireAdmin, analyticsProxy);
router.get('/api/admin/bookings', authProxy, requireAdmin, analyticsProxy);
router.get('/api/admin/payments', authProxy, requireAdmin, analyticsProxy);
router.get('/api/admin/users', authProxy, requireAdmin, analyticsProxy);
router.patch('/api/admin/users/:userId/role', authProxy, requireAdmin, analyticsProxy);
router.get('/api/admin/system-logs', authProxy, requireAdmin, analyticsProxy);

// Flight admin CRUD via analytics
router.get('/api/admin/airlines', authProxy, requireAdmin, analyticsProxy);
router.post('/api/admin/airlines', authProxy, requireAdmin, analyticsProxy);
router.put('/api/admin/airlines/:id', authProxy, requireAdmin, analyticsProxy);
router.delete('/api/admin/airlines/:id', authProxy, requireAdmin, analyticsProxy);

router.get('/api/admin/airports', authProxy, requireAdmin, analyticsProxy);
router.post('/api/admin/airports', authProxy, requireAdmin, analyticsProxy);
router.put('/api/admin/airports/:id', authProxy, requireAdmin, analyticsProxy);
router.delete('/api/admin/airports/:id', authProxy, requireAdmin, analyticsProxy);

router.get('/api/admin/flights', authProxy, requireAdmin, analyticsProxy);
router.post('/api/admin/flights', authProxy, requireAdmin, analyticsProxy);
router.put('/api/admin/flights/:id', authProxy, requireAdmin, analyticsProxy);
router.delete('/api/admin/flights/:id', authProxy, requireAdmin, analyticsProxy);

router.get('/api/admin/schedules', authProxy, requireAdmin, analyticsProxy);
router.post('/api/admin/schedules', authProxy, requireAdmin, analyticsProxy);
router.put('/api/admin/schedules/:id', authProxy, requireAdmin, analyticsProxy);
router.delete('/api/admin/schedules/:id', authProxy, requireAdmin, analyticsProxy);
router.patch('/api/admin/schedules/:id/status', authProxy, requireAdmin, analyticsProxy);

module.exports = router;
