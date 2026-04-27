const client = require('prom-client');

// Initialize the default metrics (CPU, memory, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom business metrics
const requestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const requestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const errorCount = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP 5xx errors',
  labelNames: ['method', 'route', 'status_code']
});

const seatLockLatency = new client.Histogram({
  name: 'seat_lock_latency_seconds',
  help: 'Latency of seat locking operations',
});

const bookingSuccessRate = new client.Counter({
  name: 'booking_success_total',
  help: 'Total number of successful bookings'
});

const paymentProcessingTime = new client.Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Duration of payment processing',
  buckets: [0.5, 1, 2, 5, 10]
});

// Middleware to track request metrics
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    
    // Replace dynamic IDs in routes with a generic parameter indicator or just use base route if possible
    // For simplicity, we fallback to req.route?.path or req.path
    const route = req.route ? req.route.path : req.path;
    
    requestDuration.labels(req.method, route, res.statusCode).observe(duration);
    requestCount.labels(req.method, route, res.statusCode).inc();
    
    if (res.statusCode >= 500) {
      errorCount.labels(req.method, route, res.statusCode).inc();
    }
  });
  
  next();
};

const metricsRoute = async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
};

module.exports = {
  metricsMiddleware,
  metricsRoute,
  client,
  seatLockLatency,
  bookingSuccessRate,
  paymentProcessingTime
};
