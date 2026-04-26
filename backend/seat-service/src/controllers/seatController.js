const seatService = require('../services/seatService');
const { getSeatLock } = require('../utils/seatLock');

const getSeats = async (req, res, next) => {
  try { res.json(await seatService.getSeatsBySchedule(req.params.scheduleId)); }
  catch (e) { next(e); }
};

const lockSeat = async (req, res, next) => {
  try {
    const { scheduleId, seatId } = req.body;
    const userId = req.headers['x-user-id'];
    const locked = await seatService.lockSeatForBooking(scheduleId, seatId, userId);
    res.json({ success: locked, message: locked ? 'Seat locked' : 'Seat unavailable' });
  } catch (e) { next(e); }
};

const unlockSeat = async (req, res, next) => {
  try {
    const { scheduleId, seatId } = req.body;
    const userId = req.headers['x-user-id'];
    const unlocked = await seatService.unlockSeatForBooking(scheduleId, seatId, userId);
    res.json({ success: unlocked });
  } catch (e) { next(e); }
};

const getLockStatus = async (req, res, next) => {
  try {
    const lock = await getSeatLock(req.params.scheduleId, req.params.seatId);
    res.json({ locked: !!lock, lockedBy: lock || null });
  } catch (e) { next(e); }
};

// Internal endpoints
const confirmSeats = async (req, res, next) => {
  try { await seatService.confirmSeats(req.body.flightSeatIds); res.json({ success: true }); }
  catch (e) { next(e); }
};

const releaseSeats = async (req, res, next) => {
  try { await seatService.releaseSeats(req.body.flightSeatIds); res.json({ success: true }); }
  catch (e) { next(e); }
};

const availabilityCount = async (req, res, next) => {
  try {
    const { scheduleIds, travelClass } = req.body;
    const availability = await seatService.getAvailabilityCount(scheduleIds, travelClass);
    res.json({ availability });
  } catch (e) { next(e); }
};

const getFlightSeat = async (req, res, next) => {
  try {
    const { scheduleId, seatId } = req.body;
    const seat = await seatService.getFlightSeatForBooking(scheduleId, seatId);
    if (!seat) return res.status(404).json({ error: 'Seat not found or unavailable' });
    res.json(seat);
  } catch (e) { next(e); }
};

const getFlightSeatById = async (req, res, next) => {
  try {
    const seat = await seatService.getFlightSeatById(req.params.flightSeatId, true);
    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    res.json(seat);
  } catch (e) { next(e); }
};

const createFlightSeats = async (req, res, next) => {
  try {
    const count = await seatService.createFlightSeats(req.body.scheduleId, req.body.basePrice);
    res.json({ success: true, seatsCreated: count });
  } catch (e) { next(e); }
};

const deleteFlightSeats = async (req, res, next) => {
  try { await seatService.deleteFlightSeats(req.params.scheduleId); res.json({ success: true }); }
  catch (e) { next(e); }
};

module.exports = {
  getSeats, lockSeat, unlockSeat, getLockStatus,
  confirmSeats, releaseSeats, availabilityCount,
  getFlightSeat, getFlightSeatById, createFlightSeats, deleteFlightSeats
};
