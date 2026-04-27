const mongoose = require('mongoose');

const performanceDataSchema = new mongoose.Schema({
  number_of_users: { type: Number, required: true },
  avg_response_time: { type: Number },
  max_response_time: { type: Number },
  throughput: { type: Number },
  cpu_usage: { type: Number },
  memory_usage: { type: Number },
  error_rate: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PerformanceData', performanceDataSchema);
