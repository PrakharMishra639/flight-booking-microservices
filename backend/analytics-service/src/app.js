const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
const analyticsRoutes = require('./routes/analyticsRoutes');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'analytics-service', status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', analyticsRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4008;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[analytics-service] Database connected');
    app.listen(PORT, () => { console.log(`[analytics-service] running on port ${PORT}`); });
  } catch (error) { console.error('[analytics-service] Failed to start:', error); process.exit(1); }
};

start();
module.exports = app;
