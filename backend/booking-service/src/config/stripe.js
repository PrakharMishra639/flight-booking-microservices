const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, currency, metadata, paymentMethodTypes) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    payment_method_types: paymentMethodTypes
  });
};

const refundPayment = async (paymentIntentId) => {
  return await stripe.refunds.create({ payment_intent: paymentIntentId });
};

const constructWebhookEvent = (body, sig, secret) => {
  return stripe.webhooks.constructEvent(body, sig, secret);
};

module.exports = { createPaymentIntent, refundPayment, constructWebhookEvent };
