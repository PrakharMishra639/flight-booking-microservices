const { Payment, Booking } = require('../models');
const { createPaymentIntent, constructWebhookEvent } = require('../config/stripe');
const axios = require('axios');

const SEAT_SERVICE_URL = process.env.SEAT_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';

const initiatePayment = async (bookingId, currency = 'inr', paymentMethodTypes = ['card']) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.status !== 'PENDING') throw Object.assign(new Error('Booking is not in pending state'), { status: 400 });

  const existingPayment = await Payment.findOne({ where: { booking_id: bookingId, status: 'SUCCESS' } });
  if (existingPayment) throw Object.assign(new Error('Payment already completed'), { status: 400 });

  const idempotencyKey = `booking_${bookingId}_${Date.now()}`;
  const paymentIntent = await createPaymentIntent(
    parseFloat(booking.total_price),
    currency,
    { bookingId: bookingId.toString(), pnr: booking.pnr },
    paymentMethodTypes
  );

  const payment = await Payment.create({
    booking_id: bookingId,
    amount: booking.total_price,
    status: 'INITIATED',
    gateway_reference: paymentIntent.id,
    payment_method: paymentMethodTypes.join(','),
    idempotency_key: idempotencyKey,
    currency
  });

  try {
    await axios.post(`${SEAT_SERVICE_URL}/emit/payment-status`, {
      bookingId, status: 'INITIATED', transactionId: paymentIntent.id
    });
  } catch (err) {}

  return { clientSecret: paymentIntent.client_secret, paymentId: payment.payment_id, paymentIntentId: paymentIntent.id };
};

const handleWebhook = async (payload, sig) => {
  const event = constructWebhookEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = parseInt(paymentIntent.metadata.bookingId);
    const payment = await Payment.findOne({ where: { gateway_reference: paymentIntent.id } });
    if (payment) {
      await payment.update({ status: 'SUCCESS', payment_time: new Date() });
      // Auto-confirm booking
      const bookingService = require('./bookingService');
      await bookingService.confirmBooking(bookingId);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const payment = await Payment.findOne({ where: { gateway_reference: paymentIntent.id } });
    if (payment) {
      await payment.update({ status: 'FAILED' });
      try {
        await axios.post(`${SEAT_SERVICE_URL}/emit/payment-status`, {
          bookingId: parseInt(paymentIntent.metadata.bookingId), status: 'FAILED', transactionId: paymentIntent.id
        });
      } catch (err) {}
    }
  }

  return { received: true };
};

const manualPaymentSuccess = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  let payment = await Payment.findOne({ where: { booking_id: bookingId, status: { [require('sequelize').Op.ne]: 'SUCCESS' } } });
  if (!payment) {
    payment = await Payment.create({
      booking_id: bookingId, amount: booking.total_price, status: 'SUCCESS',
      gateway_reference: `manual_${Date.now()}`, payment_method: 'MANUAL', payment_time: new Date()
    });
  } else {
    await payment.update({ status: 'SUCCESS', payment_time: new Date() });
  }

  const bookingService = require('./bookingService');
  await bookingService.confirmBooking(bookingId);
  return payment;
};

const getPaymentStatus = async (paymentId) => {
  const payment = await Payment.findByPk(paymentId, { include: [Booking] });
  if (!payment) throw Object.assign(new Error('Payment not found'), { status: 404 });
  return payment;
};

module.exports = { initiatePayment, handleWebhook, manualPaymentSuccess, getPaymentStatus };
