const express = require('express');
const router = express.Router();
const c = require('../controllers/analyticsController');

router.get('/dashboard', c.dashboard);
router.get('/bookings', c.allBookings);
router.get('/payments', c.allPayments);
router.get('/users', c.allUsers);
router.patch('/users/:userId/role', c.updateUserRole);
router.get('/system-logs', c.systemLogs);
router.post('/track', c.trackResponseTime);

// Flight admin CRUD proxied
router.get('/airlines', c.getAirlines);
router.post('/airlines', c.createAirline);
router.put('/airlines/:id', c.updateAirline);
router.delete('/airlines/:id', c.deleteAirline);

router.get('/airports', c.getAirports);
router.post('/airports', c.createAirport);
router.put('/airports/:id', c.updateAirport);
router.delete('/airports/:id', c.deleteAirport);

router.get('/flights', c.getFlights);
router.post('/flights', c.createFlight);
router.put('/flights/:id', c.updateFlight);
router.delete('/flights/:id', c.deleteFlight);

router.get('/schedules', c.getSchedules);
router.post('/schedules', c.createSchedule);
router.put('/schedules/:id', c.updateSchedule);
router.delete('/schedules/:id', c.deleteSchedule);
router.patch('/schedules/:id/status', c.updateFlightStatus);

module.exports = router;
