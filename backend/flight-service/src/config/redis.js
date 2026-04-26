const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});
redis.on('error', (err) => console.error('[flight-service] Redis error:', err.message));
redis.on('connect', () => console.log('[flight-service] Redis connected'));
module.exports = redis;
