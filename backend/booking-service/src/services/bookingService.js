const { Booking, BookingDetail, Payment, BoardingPass, sequelize } = require('../models');
const generatePNR = require('../utils/pnrGenerator');
const axios = require('axios');
const { Op } = require('sequelize');

const SEAT_SERVICE_URL = process.env.SEAT_SERVICE_URL || 'http://localhost:4004';
const PRICING_SERVICE_URL = process.env.PRICING_SERVICE_URL || 'http://localhost:4006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';
const FLIGHT_SERVICE_URL = process.env.FLIGHT_SERVICE_URL || 'http://localhost:4003';

const CLASS_MULTIPLIERS = { ECONOMY: 1.0, BUSINESS: 2.5, FIRST: 4.0 };

const createBooking = async (userId, bookingData) => {
  const t = await sequelize.transaction();
  try {
    const { legs, contactEmail, passengers } = bookingData;
    const pnr = await generatePNR();
    let totalPrice = 0;
    const detailsToCreate = [];
    const flightSeatIds = [];

    for (const leg of legs) {
      const scheduleResp = await axios.get(`${FLIGHT_SERVICE_URL}/internal/schedule/${leg.scheduleId}`);
      const schedule = scheduleResp.data;
      if (!schedule) throw Object.assign(new Error('Schedule not found'), { status: 404 });

      for (const pax of leg.passengers) {
        // Get flight seat from seat-service
        const seatResp = await axios.post(`${SEAT_SERVICE_URL}/internal/get-flight-seat`, {
          scheduleId: leg.scheduleId, seatId: pax.seatId
        });
        const flightSeat = seatResp.data;
        if (!flightSeat) throw Object.assign(new Error('Seat unavailable'), { status: 409 });

        const seatClass = flightSeat.Seat?.class || 'ECONOMY';
        const multiplier = CLASS_MULTIPLIERS[seatClass] || 1.0;
        const adjustedBasePrice = parseFloat(schedule.base_price) * multiplier;
        const bookingFee = adjustedBasePrice * 0.05;
        const seatFee = parseFloat(flightSeat.price) || 0;
        const pricePaid = adjustedBasePrice + bookingFee + seatFee;
        totalPrice += pricePaid;

        detailsToCreate.push({
          schedule_id: leg.scheduleId,
          flight_seat_id: flightSeat.flight_seat_id,
          passenger_name: pax.name,
          passenger_age: pax.age,
          passenger_gender: pax.gender,
          passenger_id_type: pax.idType || null,
          passenger_id_number: pax.idNumber || null,
          leg_order: leg.legOrder || 1,
          price_paid: Math.round(pricePaid * 100) / 100
        });
        flightSeatIds.push(flightSeat.flight_seat_id);
      }
    }

    const booking = await Booking.create({
      user_id: userId,
      total_price: Math.round(totalPrice * 100) / 100,
      status: 'PENDING',
      pnr,
      contact_email: contactEmail,
      passenger_count: passengers || detailsToCreate.length,
      expires_at: new Date(Date.now() + 10 * 60 * 1000)
    }, { transaction: t });

    for (const detail of detailsToCreate) {
      await BookingDetail.create({ ...detail, booking_id: booking.booking_id }, { transaction: t });
    }

    await t.commit();

    // Emit booking status via seat-service
    try {
      await axios.post(`${SEAT_SERVICE_URL}/emit/booking-status`, {
        bookingId: booking.booking_id, status: 'PENDING', data: { userId, pnr }
      });
    } catch (err) {}

    // Start expiration timer
    setTimeout(async () => {
      const b = await Booking.findByPk(booking.booking_id);
      if (b && b.status === 'PENDING') {
        await b.update({ status: 'EXPIRED' });
        try { await axios.post(`${SEAT_SERVICE_URL}/internal/release`, { flightSeatIds }); } catch (err) {}
        try { await axios.post(`${SEAT_SERVICE_URL}/emit/booking-status`, { bookingId: booking.booking_id, status: 'EXPIRED', data: { userId } }); } catch (err) {}
      }
    }, 10 * 60 * 1000);

    return { booking, pnr, totalPrice: booking.total_price };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getBookingById = async (bookingId) => {
  return await Booking.findByPk(bookingId, {
    include: [{ model: BookingDetail }, { model: Payment }, { model: BoardingPass }]
  });
};

const getUserBookings = async (userId) => {
  return await Booking.findAll({
    where: { user_id: userId },
    include: [{ model: BookingDetail }, { model: Payment }],
    order: [['booking_date', 'DESC']]
  });
};

const confirmBooking = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, { include: [BookingDetail] });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.status !== 'PENDING') throw Object.assign(new Error('Booking cannot be confirmed'), { status: 400 });

  const flightSeatIds = booking.BookingDetails.map(d => d.flight_seat_id);
  await booking.update({ status: 'CONFIRMED', confirmed_at: new Date() });

  // Confirm seats via seat-service
  try { await axios.post(`${SEAT_SERVICE_URL}/internal/confirm`, { flightSeatIds }); } catch (err) {}

  // Send notification
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/send`, {
      type: 'booking_confirmation', bookingId: booking.booking_id,
      email: booking.contact_email, pnr: booking.pnr, userId: booking.user_id
    });
  } catch (err) { console.warn('[booking-service] Notification failed:', err.message); }

  // Emit booking status
  try {
    await axios.post(`${SEAT_SERVICE_URL}/emit/booking-status`, {
      bookingId, status: 'CONFIRMED', data: { userId: booking.user_id, pnr: booking.pnr }
    });
  } catch (err) {}

  return booking;
};

const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findByPk(bookingId, { include: [BookingDetail, Payment] });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.user_id !== parseInt(userId)) throw Object.assign(new Error('Unauthorized'), { status: 403 });

  const flightSeatIds = booking.BookingDetails.map(d => d.flight_seat_id);
  await booking.update({ status: 'CANCELLED' });

  // Release seats
  try { await axios.post(`${SEAT_SERVICE_URL}/internal/release`, { flightSeatIds }); } catch (err) {}

  // Refund payment if exists
  const successPayment = booking.Payments?.find(p => p.status === 'SUCCESS');
  if (successPayment && successPayment.gateway_reference) {
    try {
      const { refundPayment } = require('../config/stripe');
      await refundPayment(successPayment.gateway_reference);
      await successPayment.update({ status: 'REFUNDED' });
    } catch (err) { console.warn('[booking-service] Refund failed:', err.message); }
  }

  // Send cancellation notification
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/send`, {
      type: 'booking_cancellation', bookingId, email: booking.contact_email, pnr: booking.pnr, userId
    });
  } catch (err) {}

  return booking;
};

const extendBookingTimeout = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking || booking.status !== 'PENDING') return null;
  const newExpiry = new Date(Date.now() + 5 * 60 * 1000);
  await booking.update({ expires_at: newExpiry });
  return { expiresAt: newExpiry };
};

// Check-in
const checkinLookup = async (pnr, lastName) => {
  const booking = await Booking.findOne({
    where: { pnr: pnr.toUpperCase(), status: 'CONFIRMED' },
    include: [BookingDetail, BoardingPass]
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  return booking;
};

const confirmCheckin = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, { include: [BookingDetail] });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.status !== 'CONFIRMED') throw Object.assign(new Error('Booking not eligible for check-in'), { status: 400 });

  await booking.update({ checkin_status: 'COMPLETED', checked_in_at: new Date() });

  // Generate boarding passes
  for (const detail of booking.BookingDetails) {
    let seatNumber = 'N/A';
    try {
      const seatResp = await axios.get(`${SEAT_SERVICE_URL}/internal/flight-seat/${detail.flight_seat_id}`);
      seatNumber = seatResp.data?.Seat?.seat_number || 'N/A';
    } catch (err) {}

    let flightNo = 'N/A';
    try {
      const scheduleResp = await axios.get(`${FLIGHT_SERVICE_URL}/internal/schedule/${detail.schedule_id}`);
      flightNo = scheduleResp.data?.Flight?.flight_no || 'N/A';
    } catch (err) {}

    await BoardingPass.create({
      booking_id: bookingId,
      booking_detail_id: detail.booking_detail_id,
      passenger_name: detail.passenger_name,
      flight_no: flightNo,
      seat_number: seatNumber,
      gate: `G${Math.floor(Math.random() * 30) + 1}`,
      boarding_time: new Date(),
      download_token: require('crypto').randomBytes(32).toString('hex'),
      expiry_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  }

  // Send check-in notification
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/send`, {
      type: 'checkin_confirmation', bookingId, email: booking.contact_email, pnr: booking.pnr, userId: booking.user_id
    });
  } catch (err) {}

  return await Booking.findByPk(bookingId, { include: [BookingDetail, BoardingPass] });
};

module.exports = {
  createBooking, getBookingById, getUserBookings,
  confirmBooking, cancelBooking, extendBookingTimeout,
  checkinLookup, confirmCheckin
};
