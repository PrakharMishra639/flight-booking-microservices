const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();
const { metricsMiddleware, metricsRoute } = require('../../shared/middleware/metrics');
app.use(metricsMiddleware);
app.get('/metrics', metricsRoute);

app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'OK', timestamp: new Date().toISOString() });
});

const oauthRoutes = require('./routes/oauthRoutes');
app.use('/', authRoutes);
app.use('/', oauthRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4001;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[auth-service] Database connected');
    app.listen(PORT, () => {
      console.log(`[auth-service] running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[auth-service] Failed to start:', error);
    process.exit(1);
  }
};

start();
module.exports = app;
