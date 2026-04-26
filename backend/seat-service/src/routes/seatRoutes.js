const express = require('express');
const router = express.Router();
const c = require('../controllers/seatController');

// Public routes
router.get('/schedule/:scheduleId', c.getSeats);
router.post('/lock', c.lockSeat);
router.post('/unlock', c.unlockSeat);
router.get('/lock-status/:scheduleId/:seatId', c.getLockStatus);

// Internal routes (called by other services)
router.post('/internal/confirm', c.confirmSeats);
router.post('/internal/release', c.releaseSeats);
router.post('/internal/availability-count', c.availabilityCount);
router.post('/internal/get-flight-seat', c.getFlightSeat);
router.get('/internal/flight-seat/:flightSeatId', c.getFlightSeatById);
router.post('/internal/create-flight-seats', c.createFlightSeats);
router.delete('/internal/flight-seats/:scheduleId', c.deleteFlightSeats);

module.exports = router;
