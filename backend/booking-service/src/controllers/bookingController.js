const bookingService = require('../services/bookingService');
const paymentService = require('../services/paymentService');

// Booking endpoints
const createBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const result = await bookingService.createBooking(parseInt(userId), req.body);
    res.status(201).json({ success: true, ...result });
  } catch (e) { next(e); }
};

const getBooking = async (req, res, next) => {
  try { res.json(await bookingService.getBookingById(req.params.bookingId)); }
  catch (e) { next(e); }
};

const getUserBookings = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    res.json(await bookingService.getUserBookings(parseInt(userId)));
  } catch (e) { next(e); }
};

const confirmBooking = async (req, res, next) => {
  try { res.json(await bookingService.confirmBooking(req.params.bookingId)); }
  catch (e) { next(e); }
};

const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    res.json(await bookingService.cancelBooking(req.params.bookingId, userId));
  } catch (e) { next(e); }
};

const extendTimeout = async (req, res, next) => {
  try { res.json(await bookingService.extendBookingTimeout(req.body.bookingId)); }
  catch (e) { next(e); }
};

// Payment endpoints
const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, currency, paymentMethodTypes } = req.body;
    res.json(await paymentService.initiatePayment(bookingId, currency, paymentMethodTypes));
  } catch (e) { next(e); }
};

const webhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await paymentService.handleWebhook(req.body, sig);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

const manualPaymentSuccess = async (req, res, next) => {
  try { res.json(await paymentService.manualPaymentSuccess(req.body.bookingId)); }
  catch (e) { next(e); }
};

const getPaymentStatus = async (req, res, next) => {
  try { res.json(await paymentService.getPaymentStatus(req.params.paymentId)); }
  catch (e) { next(e); }
};

// Checkin endpoints
const checkinLookup = async (req, res, next) => {
  try {
    const { pnr, lastName } = req.body;
    res.json(await bookingService.checkinLookup(pnr, lastName));
  } catch (e) { next(e); }
};

const confirmCheckin = async (req, res, next) => {
  try { res.json(await bookingService.confirmCheckin(req.body.bookingId)); }
  catch (e) { next(e); }
};

module.exports = {
  createBooking, getBooking, getUserBookings, confirmBooking, cancelBooking, extendTimeout,
  initiatePayment, webhook, manualPaymentSuccess, getPaymentStatus,
  checkinLookup, confirmCheckin
};
