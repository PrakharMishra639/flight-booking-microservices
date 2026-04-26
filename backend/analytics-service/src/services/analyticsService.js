const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';
const FLIGHT_SERVICE_URL = process.env.FLIGHT_SERVICE_URL || 'http://localhost:4003';

const getDashboardStats = async () => {
  const [bookingCounts] = await sequelize.query(
    `SELECT status, COUNT(*) as count FROM bookings GROUP BY status`, { type: QueryTypes.SELECT }
  ).catch(() => [{}]);

  const [revenueResult] = await sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) as totalRevenue FROM payments WHERE status = 'SUCCESS'`, { type: QueryTypes.SELECT }
  ).catch(() => [{ totalRevenue: 0 }]);

  const userCount = await sequelize.query(
    `SELECT COUNT(*) as count FROM users`, { type: QueryTypes.SELECT }
  ).catch(() => [{ count: 0 }]);

  const flightCount = await sequelize.query(
    `SELECT COUNT(*) as count FROM schedules WHERE status = 'SCHEDULED'`, { type: QueryTypes.SELECT }
  ).catch(() => [{ count: 0 }]);

  const recentBookings = await sequelize.query(
    `SELECT b.booking_id, b.pnr, b.status, b.total_price, b.booking_date, b.passenger_count,
            u.name as user_name, u.email as user_email
     FROM bookings b LEFT JOIN users u ON b.user_id = u.user_id
     ORDER BY b.booking_date DESC LIMIT 10`,
    { type: QueryTypes.SELECT }
  ).catch(() => []);

  return {
    bookings: bookingCounts || [],
    revenue: revenueResult?.totalRevenue || 0,
    users: userCount?.[0]?.count || 0,
    activeFlights: flightCount?.[0]?.count || 0,
    recentBookings: recentBookings || []
  };
};

const getAllBookings = async (page = 1, limit = 20, status = null) => {
  const offset = (page - 1) * limit;
  let whereClause = '';
  if (status) whereClause = `WHERE b.status = '${status}'`;

  const bookings = await sequelize.query(
    `SELECT b.*, u.name as user_name, u.email as user_email
     FROM bookings b LEFT JOIN users u ON b.user_id = u.user_id
     ${whereClause}
     ORDER BY b.booking_date DESC
     LIMIT ${limit} OFFSET ${offset}`,
    { type: QueryTypes.SELECT }
  );

  const [countResult] = await sequelize.query(
    `SELECT COUNT(*) as total FROM bookings b ${whereClause}`,
    { type: QueryTypes.SELECT }
  );

  return { data: bookings, total: countResult?.total || 0, page, totalPages: Math.ceil((countResult?.total || 0) / limit) };
};

const getAllPayments = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const payments = await sequelize.query(
    `SELECT p.*, b.pnr, b.status as booking_status
     FROM payments p LEFT JOIN bookings b ON p.booking_id = b.booking_id
     ORDER BY p.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    { type: QueryTypes.SELECT }
  );
  const [countResult] = await sequelize.query(`SELECT COUNT(*) as total FROM payments`, { type: QueryTypes.SELECT });
  return { data: payments, total: countResult?.total || 0, page, totalPages: Math.ceil((countResult?.total || 0) / limit) };
};

const getSystemLogs = async (page = 1, limit = 50, category = null) => {
  const offset = (page - 1) * limit;
  let whereClause = '';
  if (category) whereClause = `WHERE category = '${category}'`;

  try {
    const logs = await sequelize.query(
      `SELECT * FROM logs ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      { type: QueryTypes.SELECT }
    );
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total FROM logs ${whereClause}`,
      { type: QueryTypes.SELECT }
    );
    return { data: logs, total: countResult?.total || 0, page, totalPages: Math.ceil((countResult?.total || 0) / limit) };
  } catch (err) {
    return { data: [], total: 0, page: 1, totalPages: 0, note: 'Logs table may not exist' };
  }
};

const trackResponseTime = async (data) => {
  // Store API response time metrics - could be extended to use a proper metrics store
  console.log(`[analytics] ${data.method} ${data.path} - ${data.responseTime}ms - ${data.statusCode}`);
  return { tracked: true };
};

module.exports = { getDashboardStats, getAllBookings, getAllPayments, getSystemLogs, trackResponseTime };
