const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const pricingRoutes = require('./routes/pricingRoutes');
const errorHandler = require('../../shared/middleware/errorHandler');

const app = express();
const { metricsMiddleware, metricsRoute } = require('../../shared/middleware/metrics');
app.use(metricsMiddleware);
app.get('/metrics', metricsRoute);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'pricing-service', status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', pricingRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => {
  console.log(`[pricing-service] running on port ${PORT}`);
});

module.exports = app;
