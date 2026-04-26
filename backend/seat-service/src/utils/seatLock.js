const redis = require('../config/redis');
const SEAT_LOCK_TTL = 120;

const lockSeat = async (scheduleId, seatId, userId) => {
  const lockKey = `seat_lock:${scheduleId}:${seatId}`;
  const result = await redis.set(lockKey, `${userId}`, 'EX', SEAT_LOCK_TTL, 'NX');
  return result === 'OK';
};

const unlockSeat = async (scheduleId, seatId, userId) => {
  const lockKey = `seat_lock:${scheduleId}:${seatId}`;
  const currentValue = await redis.get(lockKey);
  if (currentValue === String(userId)) {
    await redis.del(lockKey);
    return true;
  }
  return false;
};

const extendSeatLock = async (scheduleId, seatId, userId) => {
  const lockKey = `seat_lock:${scheduleId}:${seatId}`;
  const currentValue = await redis.get(lockKey);
  if (currentValue === String(userId)) {
    await redis.expire(lockKey, SEAT_LOCK_TTL);
    return true;
  }
  return false;
};

const getSeatLock = async (scheduleId, seatId) => {
  const lockKey = `seat_lock:${scheduleId}:${seatId}`;
  return await redis.get(lockKey);
};

module.exports = { lockSeat, unlockSeat, extendSeatLock, getSeatLock, SEAT_LOCK_TTL };
