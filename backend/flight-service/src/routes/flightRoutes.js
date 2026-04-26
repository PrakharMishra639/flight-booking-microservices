const express = require('express');
const router = express.Router();
const c = require('../controllers/flightController');

// Search routes
router.get('/flights', c.searchFlights);
router.get('/filters', c.getFilters);
router.get('/prices', c.getDatePrices);
router.get('/airports', c.searchAirports);
router.get('/airports/nearby', c.nearbyAirports);
router.get('/airports/:code', c.getAirport);

// Internal routes
router.get('/internal/schedule/:scheduleId', c.getScheduleById);

// Admin CRUD routes
router.get('/admin/airlines', c.getAllAirlines);
router.post('/admin/airlines', c.createAirline);
router.put('/admin/airlines/:id', c.updateAirline);
router.delete('/admin/airlines/:id', c.deleteAirline);
router.patch('/admin/airlines/:id/logo', c.updateAirlineLogo);

router.get('/admin/airports', c.getAllAirports);
router.post('/admin/airports', c.createAirport);
router.put('/admin/airports/:id', c.updateAirport);
router.delete('/admin/airports/:id', c.deleteAirport);

router.get('/admin/flights', c.getAllFlights);
router.post('/admin/flights', c.createFlight);
router.put('/admin/flights/:id', c.updateFlight);
router.delete('/admin/flights/:id', c.deleteFlight);

router.get('/admin/schedules', c.getAllSchedules);
router.post('/admin/schedules', c.createSchedule);
router.put('/admin/schedules/:id', c.updateSchedule);
router.delete('/admin/schedules/:id', c.deleteSchedule);
router.patch('/admin/schedules/:id/status', c.updateFlightStatus);

module.exports = router;
