const analyticsService = require('../services/analyticsService');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';
const FLIGHT_SERVICE_URL = process.env.FLIGHT_SERVICE_URL || 'http://localhost:4003';

const dashboard = async (req, res, next) => {
  try { res.json(await analyticsService.getDashboardStats()); }
  catch (e) { next(e); }
};

const allBookings = async (req, res, next) => {
  try { res.json(await analyticsService.getAllBookings(req.query.page, req.query.limit, req.query.status)); }
  catch (e) { next(e); }
};

const allPayments = async (req, res, next) => {
  try { res.json(await analyticsService.getAllPayments(req.query.page, req.query.limit)); }
  catch (e) { next(e); }
};

const allUsers = async (req, res, next) => {
  try {
    const resp = await axios.get(`${USER_SERVICE_URL}/admin/all`);
    res.json(resp.data);
  } catch (e) { next(e); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const resp = await axios.patch(`${USER_SERVICE_URL}/admin/${req.params.userId}/role`, req.body);
    res.json(resp.data);
  } catch (e) { next(e); }
};

const systemLogs = async (req, res, next) => {
  try { res.json(await analyticsService.getSystemLogs(req.query.page, req.query.limit, req.query.category)); }
  catch (e) { next(e); }
};

const trackResponseTime = async (req, res, next) => {
  try { res.json(await analyticsService.trackResponseTime(req.body)); }
  catch (e) { next(e); }
};

// Proxy flight admin routes
const getAirlines = async (req, res, next) => { try { const r = await axios.get(`${FLIGHT_SERVICE_URL}/admin/airlines`); res.json(r.data); } catch (e) { next(e); } };
const createAirline = async (req, res, next) => { try { const r = await axios.post(`${FLIGHT_SERVICE_URL}/admin/airlines`, req.body); res.status(201).json(r.data); } catch (e) { next(e); } };
const updateAirline = async (req, res, next) => { try { const r = await axios.put(`${FLIGHT_SERVICE_URL}/admin/airlines/${req.params.id}`, req.body); res.json(r.data); } catch (e) { next(e); } };
const deleteAirline = async (req, res, next) => { try { await axios.delete(`${FLIGHT_SERVICE_URL}/admin/airlines/${req.params.id}`); res.json({ success: true }); } catch (e) { next(e); } };

const getAirports = async (req, res, next) => { try { const r = await axios.get(`${FLIGHT_SERVICE_URL}/admin/airports`, { params: req.query }); res.json(r.data); } catch (e) { next(e); } };
const createAirport = async (req, res, next) => { try { const r = await axios.post(`${FLIGHT_SERVICE_URL}/admin/airports`, req.body); res.status(201).json(r.data); } catch (e) { next(e); } };
const updateAirport = async (req, res, next) => { try { const r = await axios.put(`${FLIGHT_SERVICE_URL}/admin/airports/${req.params.id}`, req.body); res.json(r.data); } catch (e) { next(e); } };
const deleteAirport = async (req, res, next) => { try { await axios.delete(`${FLIGHT_SERVICE_URL}/admin/airports/${req.params.id}`); res.json({ success: true }); } catch (e) { next(e); } };

const getFlights = async (req, res, next) => { try { const r = await axios.get(`${FLIGHT_SERVICE_URL}/admin/flights`, { params: req.query }); res.json(r.data); } catch (e) { next(e); } };
const createFlight = async (req, res, next) => { try { const r = await axios.post(`${FLIGHT_SERVICE_URL}/admin/flights`, req.body); res.status(201).json(r.data); } catch (e) { next(e); } };
const updateFlight = async (req, res, next) => { try { const r = await axios.put(`${FLIGHT_SERVICE_URL}/admin/flights/${req.params.id}`, req.body); res.json(r.data); } catch (e) { next(e); } };
const deleteFlight = async (req, res, next) => { try { await axios.delete(`${FLIGHT_SERVICE_URL}/admin/flights/${req.params.id}`); res.json({ success: true }); } catch (e) { next(e); } };

const getSchedules = async (req, res, next) => { try { const r = await axios.get(`${FLIGHT_SERVICE_URL}/admin/schedules`, { params: req.query }); res.json(r.data); } catch (e) { next(e); } };
const createSchedule = async (req, res, next) => { try { const r = await axios.post(`${FLIGHT_SERVICE_URL}/admin/schedules`, req.body); res.status(201).json(r.data); } catch (e) { next(e); } };
const updateSchedule = async (req, res, next) => { try { const r = await axios.put(`${FLIGHT_SERVICE_URL}/admin/schedules/${req.params.id}`, req.body); res.json(r.data); } catch (e) { next(e); } };
const deleteSchedule = async (req, res, next) => { try { await axios.delete(`${FLIGHT_SERVICE_URL}/admin/schedules/${req.params.id}`); res.json({ success: true }); } catch (e) { next(e); } };
const updateFlightStatus = async (req, res, next) => { try { const r = await axios.patch(`${FLIGHT_SERVICE_URL}/admin/schedules/${req.params.id}/status`, req.body); res.json(r.data); } catch (e) { next(e); } };

module.exports = {
  dashboard, allBookings, allPayments, allUsers, updateUserRole, systemLogs, trackResponseTime,
  getAirlines, createAirline, updateAirline, deleteAirline,
  getAirports, createAirport, updateAirport, deleteAirport,
  getFlights, createFlight, updateFlight, deleteFlight,
  getSchedules, createSchedule, updateSchedule, deleteSchedule, updateFlightStatus
};
