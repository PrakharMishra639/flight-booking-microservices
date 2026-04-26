const flightService = require('../services/flightService');

const searchFlights = async (req, res, next) => {
  try { const results = await flightService.searchFlights(req.query); res.json({ success: true, results }); }
  catch (error) { next(error); }
};
const getFilters = async (req, res, next) => {
  try { const { source, destination, date } = req.query; res.json(await flightService.getAvailableFilters(source, destination, date)); }
  catch (error) { next(error); }
};
const getDatePrices = async (req, res, next) => {
  try { const { source, destination, startDate, endDate } = req.query; res.json(await flightService.getDatePrices(source, destination, startDate, endDate)); }
  catch (error) { next(error); }
};
const searchAirports = async (req, res, next) => {
  try { res.json(await flightService.searchAirports(req.query.q)); }
  catch (error) { next(error); }
};
const nearbyAirports = async (req, res, next) => {
  try { const { lat, lng, radius } = req.query; res.json(await flightService.searchNearbyAirports(parseFloat(lat), parseFloat(lng), parseFloat(radius))); }
  catch (error) { next(error); }
};
const getAirport = async (req, res, next) => {
  try { res.json(await flightService.getAirportByCode(req.params.code)); }
  catch (error) { next(error); }
};
const getScheduleById = async (req, res, next) => {
  try { const schedule = await flightService.getScheduleById(req.params.scheduleId); if (!schedule) return res.status(404).json({ error: 'Schedule not found' }); res.json(schedule); }
  catch (error) { next(error); }
};

// Admin CRUD
const createAirline = async (req, res, next) => { try { res.status(201).json(await flightService.createAirline(req.body)); } catch (e) { next(e); } };
const updateAirline = async (req, res, next) => { try { res.json(await flightService.updateAirline(req.params.id, req.body)); } catch (e) { next(e); } };
const deleteAirline = async (req, res, next) => { try { await flightService.deleteAirline(req.params.id); res.json({ success: true }); } catch (e) { next(e); } };
const getAllAirlines = async (req, res, next) => { try { res.json(await flightService.getAllAirlines()); } catch (e) { next(e); } };
const updateAirlineLogo = async (req, res, next) => { try { res.json(await flightService.updateAirlineLogo(req.params.id, req.body.logo_url || `/uploads/${req.file?.filename}`)); } catch (e) { next(e); } };

const createAirport = async (req, res, next) => { try { res.status(201).json(await flightService.createAirport(req.body)); } catch (e) { next(e); } };
const updateAirport = async (req, res, next) => { try { res.json(await flightService.updateAirport(req.params.id, req.body)); } catch (e) { next(e); } };
const deleteAirport = async (req, res, next) => { try { await flightService.deleteAirport(req.params.id); res.json({ success: true }); } catch (e) { next(e); } };
const getAllAirports = async (req, res, next) => { try { res.json(await flightService.getAllAirports(req.query.page, req.query.limit, req.query.search)); } catch (e) { next(e); } };

const createFlight = async (req, res, next) => { try { res.status(201).json(await flightService.createFlight(req.body)); } catch (e) { next(e); } };
const updateFlight = async (req, res, next) => { try { res.json(await flightService.updateFlight(req.params.id, req.body)); } catch (e) { next(e); } };
const deleteFlight = async (req, res, next) => { try { await flightService.deleteFlight(req.params.id); res.json({ success: true }); } catch (e) { next(e); } };
const getAllFlights = async (req, res, next) => { try { res.json(await flightService.getAllFlights(req.query.page, req.query.limit, req.query.search)); } catch (e) { next(e); } };

const createSchedule = async (req, res, next) => { try { res.status(201).json(await flightService.createSchedule(req.body)); } catch (e) { next(e); } };
const updateSchedule = async (req, res, next) => { try { res.json(await flightService.updateSchedule(req.params.id, req.body)); } catch (e) { next(e); } };
const deleteSchedule = async (req, res, next) => { try { await flightService.deleteSchedule(req.params.id); res.json({ success: true }); } catch (e) { next(e); } };
const getAllSchedules = async (req, res, next) => { try { res.json(await flightService.getAllSchedules(req.query.page, req.query.limit, req.query.search)); } catch (e) { next(e); } };
const updateFlightStatus = async (req, res, next) => { try { res.json(await flightService.updateFlightStatus(req.params.id, req.body.status, req.body.delayMinutes)); } catch (e) { next(e); } };

module.exports = {
  searchFlights, getFilters, getDatePrices, nearbyAirports, getAirport, getScheduleById, searchAirports,
  createAirline, updateAirline, deleteAirline, getAllAirlines, updateAirlineLogo,
  createAirport, updateAirport, deleteAirport, getAllAirports,
  createFlight, updateFlight, deleteFlight, getAllFlights,
  createSchedule, updateSchedule, deleteSchedule, getAllSchedules, updateFlightStatus
};
