const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { FlightSeat } = require('../models');
const { lockSeat, unlockSeat, extendSeatLock, getSeatLock, SEAT_LOCK_TTL } = require('../utils/seatLock');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) return next(new Error('Authentication required'));
      const cookies = {};
      cookieHeader.split(';').forEach(c => {
        const [key, ...valueParts] = c.trim().split('=');
        if (key) cookies[key] = valueParts.join('=');
      });
      const token = cookies.accessToken;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user_id;
      socket.userRole = decoded.role;
      socket.lockedSeats = new Set();
      socket.heartbeats = new Map();
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[seat-service] User connected: ${socket.userId}`);
    socket.join(`user_${socket.userId}`);
    if (socket.userRole === 'ADMIN' || socket.userRole === 'SUPER_ADMIN') socket.join('admin_room');

    socket.on('join_booking', (bookingId) => socket.join(`booking_${bookingId}`));
    socket.on('leave_booking', (bookingId) => socket.leave(`booking_${bookingId}`));
    socket.on('join_schedule', (scheduleId) => socket.join(`schedule_${scheduleId}`));
    socket.on('leave_schedule', (scheduleId) => socket.leave(`schedule_${scheduleId}`));

    socket.on('select_seat', async (data) => {
      const { scheduleId, seatId, maxSeats = 1 } = data;
      const lockKey = `${scheduleId}:${seatId}`;
      try {
        // Release excess locks
        const existingLocks = [];
        for (const key of socket.lockedSeats) {
          const [sid, stid] = key.split(':');
          if (String(sid) === String(scheduleId) && String(stid) !== String(seatId))
            existingLocks.push({ scheduleId: sid, seatId: stid, key });
        }
        const toRelease = existingLocks.length >= maxSeats ? existingLocks.slice(0, existingLocks.length - maxSeats + 1) : [];
        for (const old of toRelease) {
          await unlockSeat(old.scheduleId, old.seatId, socket.userId);
          socket.lockedSeats.delete(old.key);
          if (socket.heartbeats.has(old.key)) { clearInterval(socket.heartbeats.get(old.key)); socket.heartbeats.delete(old.key); }
          const [cnt] = await FlightSeat.update({ status: 'AVAILABLE', locked_until: null }, { where: { schedule_id: old.scheduleId, seat_id: old.seatId, status: 'LOCKED' } });
          if (cnt > 0) io.to(`schedule_${scheduleId}`).emit('seat_released', { scheduleId: parseInt(scheduleId), seatId: old.seatId, userId: socket.userId, reason: 'seat_changed', timestamp: new Date() });
        }

        const locked = await lockSeat(scheduleId, seatId, socket.userId);
        if (locked) {
          socket.lockedSeats.add(lockKey);
          await FlightSeat.update({ status: 'LOCKED', locked_until: new Date(Date.now() + SEAT_LOCK_TTL * 1000) }, { where: { schedule_id: scheduleId, seat_id: seatId } });
          socket.broadcast.to(`schedule_${scheduleId}`).emit('seat_selected', { scheduleId: parseInt(scheduleId), seatId, userId: socket.userId, timestamp: new Date() });
          socket.emit('seat_lock_acquired', { success: true, scheduleId: parseInt(scheduleId), seatId, releasedSeats: toRelease.map(o => o.seatId), message: `Seat locked for ${SEAT_LOCK_TTL / 60} minutes` });
          const hb = setInterval(async () => {
            const extended = await extendSeatLock(scheduleId, seatId, socket.userId);
            if (!extended) {
              clearInterval(hb);
              const [cnt] = await FlightSeat.update({ status: 'AVAILABLE', locked_until: null }, { where: { schedule_id: scheduleId, seat_id: seatId, status: 'LOCKED' } });
              socket.emit('seat_lock_expired', { scheduleId: parseInt(scheduleId), seatId });
              socket.lockedSeats.delete(lockKey);
              if (cnt > 0) io.to(`schedule_${scheduleId}`).emit('seat_released', { scheduleId: parseInt(scheduleId), seatId, userId: socket.userId, reason: 'expired', timestamp: new Date() });
            }
          }, 300000);
          socket.heartbeats.set(lockKey, hb);
        } else {
          const owner = await getSeatLock(scheduleId, seatId);
          socket.emit('seat_lock_failed', { success: false, scheduleId: parseInt(scheduleId), seatId, message: owner ? 'Seat already taken' : 'Seat unavailable' });
        }
      } catch (error) {
        socket.emit('seat_lock_error', { scheduleId: parseInt(scheduleId), seatId, error: 'Failed to lock seat' });
      }
    });

    socket.on('release_seat', async (data) => {
      const { scheduleId, seatId } = data;
      const lockKey = `${scheduleId}:${seatId}`;
      const unlocked = await unlockSeat(scheduleId, seatId, socket.userId);
      if (unlocked) {
        socket.lockedSeats.delete(lockKey);
        if (socket.heartbeats.has(lockKey)) { clearInterval(socket.heartbeats.get(lockKey)); socket.heartbeats.delete(lockKey); }
        const [cnt] = await FlightSeat.update({ status: 'AVAILABLE', locked_until: null }, { where: { schedule_id: scheduleId, seat_id: seatId, status: 'LOCKED' } });
        if (cnt > 0) socket.broadcast.to(`schedule_${scheduleId}`).emit('seat_released', { scheduleId: parseInt(scheduleId), seatId, userId: socket.userId, timestamp: new Date() });
        socket.emit('seat_released_confirm', { success: true, scheduleId: parseInt(scheduleId), seatId });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[seat-service] User disconnected: ${socket.userId}`);
      for (const lockKey of socket.lockedSeats) {
        const [scheduleId, seatId] = lockKey.split(':');
        await unlockSeat(parseInt(scheduleId), seatId, socket.userId);
        const [cnt] = await FlightSeat.update({ status: 'AVAILABLE', locked_until: null }, { where: { schedule_id: parseInt(scheduleId), seat_id: seatId, status: 'LOCKED' } });
        if (cnt > 0) io.to(`schedule_${scheduleId}`).emit('seat_released', { scheduleId: parseInt(scheduleId), seatId, userId: socket.userId, reason: 'user_disconnected', timestamp: new Date() });
      }
      for (const hb of socket.heartbeats.values()) clearInterval(hb);
      socket.lockedSeats.clear();
      socket.heartbeats.clear();
    });
  });

  return io;
};

const getIO = () => io;

const emitSeatAvailabilityUpdate = (scheduleId, seatId, status) => {
  if (io) io.to(`schedule_${scheduleId}`).emit('seat_availability', { scheduleId, seatId, status, timestamp: new Date() });
};

const emitBookingStatusUpdate = (bookingId, status, data = {}) => {
  if (io) {
    io.to(`booking_${bookingId}`).emit('booking_status_update', { bookingId, status, data, timestamp: new Date() });
    if (data.userId) io.to(`user_${data.userId}`).emit('booking_notification', { bookingId, status, data, timestamp: new Date() });
  }
};

const emitPaymentStatusUpdate = (bookingId, paymentStatus, transactionId) => {
  if (io) io.to(`booking_${bookingId}`).emit('payment_status_update', { bookingId, status: paymentStatus, transactionId, timestamp: new Date() });
};

const emitNotificationToUser = (userId, notification) => {
  if (io) io.to(`user_${userId}`).emit('user_notification', { ...notification, timestamp: new Date() });
};

const emitFlightStatusUpdate = (scheduleId, flightStatus, delayMinutes = 0) => {
  if (io) {
    io.to(`schedule_${scheduleId}`).emit('flight_status_update', { scheduleId, status: flightStatus, delayMinutes, timestamp: new Date() });
    io.to('admin_room').emit('flight_operational_update', { scheduleId, status: flightStatus, delayMinutes, timestamp: new Date() });
  }
};

const emitAdminAlert = (alert) => {
  if (io) io.to('admin_room').emit('admin_alert', { ...alert, timestamp: new Date() });
};

module.exports = {
  initializeSocket, getIO,
  emitSeatAvailabilityUpdate, emitBookingStatusUpdate, emitPaymentStatusUpdate,
  emitNotificationToUser, emitFlightStatusUpdate, emitAdminAlert
};
