const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[flight-service] MongoDB connected');
  } catch (error) {
    console.error('[flight-service] MongoDB error:', error);
  }
};

const searchCacheSchema = new mongoose.Schema({
  queryHash: { type: String, required: true, unique: true },
  source: String,
  destination: String,
  date: Date,
  results: Object,
  createdAt: { type: Date, expires: 300, default: Date.now }
});

const airportLocationSchema = new mongoose.Schema({
  airportId: Number,
  name: String,
  code: String,
  city: String,
  country: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
});
airportLocationSchema.index({ location: '2dsphere' });

const SearchCache = mongoose.model('SearchCache', searchCacheSchema);
const AirportLocation = mongoose.model('AirportLocation', airportLocationSchema);

module.exports = { connectMongoDB, SearchCache, AirportLocation };
