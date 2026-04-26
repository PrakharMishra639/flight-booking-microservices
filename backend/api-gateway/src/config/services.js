const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  flight: process.env.FLIGHT_SERVICE_URL || 'http://localhost:4003',
  seat: process.env.SEAT_SERVICE_URL || 'http://localhost:4004',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:4005',
  pricing: process.env.PRICING_SERVICE_URL || 'http://localhost:4006',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4008'
};

module.exports = services;
