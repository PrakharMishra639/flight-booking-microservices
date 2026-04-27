const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const routes = require('./routes');
const services = require('./config/services');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const { metricsMiddleware, metricsRoute } = require('../../shared/middleware/metrics');
app.use(metricsMiddleware);
app.get('/metrics', metricsRoute);
const server = http.createServer(app);

// === Middleware ===
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-email']
}));

// Raw body for Stripe webhook
app.use('/api/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(generalLimiter);

// === Health Check ===
app.get('/health', async (req, res) => {
  const axios = require('axios');
  const serviceStatus = {};

  for (const [name, url] of Object.entries(services)) {
    try {
      const resp = await axios.get(`${url}/health`, { timeout: 2000 });
      serviceStatus[name] = { status: 'UP', port: url.split(':').pop() };
    } catch (e) {
      serviceStatus[name] = { status: 'DOWN', port: url.split(':').pop() };
    }
  }

  res.json({
    service: 'api-gateway',
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: serviceStatus
  });
});

// === WebSocket Proxy to seat-service ===
const wsProxy = createProxyMiddleware({
  target: services.seat,
  ws: true,
  changeOrigin: true,
  pathFilter: '/socket.io',
  logger: console
});
app.use('/socket.io', wsProxy);

// === API Routes ===
app.use(routes);

// === 404 Handler ===
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// === Error Handler ===
app.use((err, req, res, next) => {
  console.error('[api-gateway] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// === Upgrade WebSocket ===
server.on('upgrade', wsProxy.upgrade);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  🚀 API GATEWAY running on port ${PORT}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  📡 Service Registry:`);
  Object.entries(services).forEach(([name, url]) => {
    console.log(`     ${name.padEnd(15)} → ${url}`);
  });
  console.log(`  🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`  🔌 WebSocket:    ws://localhost:${PORT}/socket.io`);
  console.log(`${'='.repeat(60)}\n`);
});

module.exports = { app, server };
