const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://mongodb/analytics';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('[analytics-service] MongoDB connected for Performance Data');
  } catch (error) {
    console.error('[analytics-service] MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = { connectMongoDB };
