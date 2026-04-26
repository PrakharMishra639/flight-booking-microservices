const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./config/database');
const { connectMongoDB } = require('./config/mongodb');
require('./models'); // Initialize associations
const flightRoutes = require('./routes/flightRoutes');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use('/uploads', express.static(require('path').join(__dirname, '../../uploads')));

app.get('/health', (req, res) => {
  res.json({ service: 'flight-service', status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', flightRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4003;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[flight-service] Database connected');
    await connectMongoDB();
    app.listen(PORT, () => {
      console.log(`[flight-service] running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[flight-service] Failed to start:', error);
    process.exit(1);
  }
};

start();
module.exports = app;
