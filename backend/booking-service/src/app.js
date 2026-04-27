const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
require('./models');
const bookingRoutes = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();
const { metricsMiddleware, metricsRoute } = require('../../shared/middleware/metrics');
app.use(metricsMiddleware);
app.get('/metrics', metricsRoute);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Raw body for Stripe webhook
app.post('/webhook', express.raw({ type: 'application/json' }), bookingController.webhook);

app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'booking-service', status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', bookingRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4005;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[booking-service] Database connected');
    app.listen(PORT, () => {
      console.log(`[booking-service] running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[booking-service] Failed to start:', error);
    process.exit(1);
  }
};

start();
module.exports = app;
