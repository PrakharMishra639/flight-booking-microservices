const { Seat, FlightSeat } = require('../models');
const { lockSeat, unlockSeat, getSeatLock } = require('../utils/seatLock');
const { Op } = require('sequelize');

const getSeatsBySchedule = async (scheduleId) => {
  return await FlightSeat.findAll({
    where: { schedule_id: scheduleId },
    include: [{ model: Seat, attributes: ['seat_id', 'seat_number', 'class', 'row_number', 'column_letter', 'is_window', 'is_aisle', 'has_extra_legroom'] }]
  });
};

const getAvailabilityCount = async (scheduleIds, travelClass) => {
  const availability = {};
  const seats = await FlightSeat.findAll({
    where: { schedule_id: { [Op.in]: scheduleIds }, status: 'AVAILABLE' },
    include: [{ model: Seat, attributes: ['class'], where: { class: travelClass } }],
    attributes: ['schedule_id']
  });
  seats.forEach(s => { availability[s.schedule_id] = (availability[s.schedule_id] || 0) + 1; });
  return availability;
};

const lockSeatForBooking = async (scheduleId, seatId, userId) => {
  const locked = await lockSeat(scheduleId, seatId, userId);
  if (locked) {
    await FlightSeat.update(
      { status: 'LOCKED', locked_until: new Date(Date.now() + 120 * 1000) },
      { where: { schedule_id: scheduleId, seat_id: seatId } }
    );
  }
  return locked;
};

const unlockSeatForBooking = async (scheduleId, seatId, userId) => {
  const unlocked = await unlockSeat(scheduleId, seatId, userId);
  if (unlocked) {
    await FlightSeat.update(
      { status: 'AVAILABLE', locked_until: null },
      { where: { schedule_id: scheduleId, seat_id: seatId, status: 'LOCKED' } }
    );
  }
  return unlocked;
};

const confirmSeats = async (flightSeatIds) => {
  await FlightSeat.update(
    { status: 'BOOKED', locked_until: null },
    { where: { flight_seat_id: { [Op.in]: flightSeatIds } } }
  );
};

const releaseSeats = async (flightSeatIds) => {
  await FlightSeat.update(
    { status: 'AVAILABLE', locked_until: null },
    { where: { flight_seat_id: { [Op.in]: flightSeatIds } } }
  );
};

const getFlightSeatForBooking = async (scheduleId, seatId, transaction = null) => {
  const opts = {
    where: { schedule_id: scheduleId, seat_id: seatId, status: { [Op.in]: ['AVAILABLE', 'LOCKED'] } },
    include: [{ model: Seat }],
  };
  if (transaction) { opts.lock = transaction.LOCK.UPDATE; opts.transaction = transaction; }
  return await FlightSeat.findOne(opts);
};

const getFlightSeatById = async (flightSeatId, includesSeat = false) => {
  const opts = { where: { flight_seat_id: flightSeatId } };
  if (includesSeat) opts.include = [{ model: Seat }];
  return await FlightSeat.findOne(opts);
};

const createFlightSeats = async (scheduleId, basePrice) => {
  const seats = await Seat.findAll();
  const flightSeats = seats.map(seat => {
    const isMiddle = !seat.is_window && !seat.is_aisle;
    return {
      schedule_id: scheduleId,
      seat_id: seat.seat_id,
      price: isMiddle ? 0 : Math.round(basePrice * 0.10),
      status: 'AVAILABLE'
    };
  });
  await FlightSeat.bulkCreate(flightSeats);
  return flightSeats.length;
};

const deleteFlightSeats = async (scheduleId) => {
  await FlightSeat.destroy({ where: { schedule_id: scheduleId } });
};

// Cleanup expired locks
const cleanupExpiredLocks = async () => {
  const [count] = await FlightSeat.update(
    { status: 'AVAILABLE', locked_until: null },
    { where: { status: 'LOCKED', locked_until: { [Op.lt]: new Date() } } }
  );
  if (count > 0) console.log(`[seat-service] Cleaned up ${count} expired locks`);
};

module.exports = {
  getSeatsBySchedule, getAvailabilityCount, lockSeatForBooking, unlockSeatForBooking,
  confirmSeats, releaseSeats, getFlightSeatForBooking, getFlightSeatById,
  createFlightSeats, deleteFlightSeats, cleanupExpiredLocks
};
