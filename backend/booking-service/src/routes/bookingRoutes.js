const express = require('express');
const router = express.Router();
const c = require('../controllers/bookingController');

// Booking routes
router.post('/create', c.createBooking);
router.get('/user/bookings', c.getUserBookings);
router.get('/:bookingId', c.getBooking);
router.post('/confirm/:bookingId', c.confirmBooking);
router.post('/cancel/:bookingId', c.cancelBooking);
router.post('/extend-timeout', c.extendTimeout);

// Payment routes
router.post('/initiate', c.initiatePayment);
router.post('/manual-success', c.manualPaymentSuccess);
router.get('/:paymentId/status', c.getPaymentStatus);

// Check-in routes
router.post('/lookup', c.checkinLookup);
router.post('/confirm', c.confirmCheckin);

// Webhook route
router.post('/webhook', c.webhook);
router.post('/manual-callback', c.manualPaymentSuccess); // Alias for safety

module.exports = router;
