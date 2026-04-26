const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
require('./models');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'notification-service', status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', notificationRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4007;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[notification-service] Database connected');
    app.listen(PORT, () => { console.log(`[notification-service] running on port ${PORT}`); });
  } catch (error) { console.error('[notification-service] Failed to start:', error); process.exit(1); }
};

start();
module.exports = app;
