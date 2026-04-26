const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
const { initializeSocket } = require('./config/socket');
const seatRoutes = require('./routes/seatRoutes');
const { cleanupExpiredLocks } = require('./services/seatService');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'seat-service', status: 'OK', websocket: io ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
});

// Emit endpoints (called by other services via HTTP)
app.post('/emit/seat-availability', (req, res) => {
  const { emitSeatAvailabilityUpdate } = require('./config/socket');
  emitSeatAvailabilityUpdate(req.body.scheduleId, req.body.seatId, req.body.status);
  res.json({ success: true });
});
app.post('/emit/booking-status', (req, res) => {
  const { emitBookingStatusUpdate } = require('./config/socket');
  emitBookingStatusUpdate(req.body.bookingId, req.body.status, req.body.data);
  res.json({ success: true });
});
app.post('/emit/payment-status', (req, res) => {
  const { emitPaymentStatusUpdate } = require('./config/socket');
  emitPaymentStatusUpdate(req.body.bookingId, req.body.status, req.body.transactionId);
  res.json({ success: true });
});
app.post('/emit/notification', (req, res) => {
  const { emitNotificationToUser } = require('./config/socket');
  emitNotificationToUser(req.body.userId, req.body.notification);
  res.json({ success: true });
});

app.use('/', seatRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4004;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[seat-service] Database connected');

    // Start expired lock cleanup every 60 seconds
    setInterval(cleanupExpiredLocks, 60000);

    server.listen(PORT, () => {
      console.log(`[seat-service] running on port ${PORT}`);
      console.log(`[seat-service] WebSocket: ws://localhost:${PORT}/socket.io`);
    });
  } catch (error) {
    console.error('[seat-service] Failed to start:', error);
    process.exit(1);
  }
};

start();
module.exports = { app, server };
