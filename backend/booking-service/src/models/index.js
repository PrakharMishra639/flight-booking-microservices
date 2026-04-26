const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  booking_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  booking_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED', 'EXPIRED'), defaultValue: 'PENDING' },
  pnr: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  contact_email: { type: DataTypes.STRING(100), allowNull: false },
  passenger_count: { type: DataTypes.INTEGER, defaultValue: 1 },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  confirmed_at: { type: DataTypes.DATE, allowNull: true },
  checkin_status: { type: DataTypes.ENUM('NOT_STARTED', 'COMPLETED'), defaultValue: 'NOT_STARTED' },
  checked_in_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'bookings', indexes: [{ fields: ['user_id'] }, { fields: ['pnr'] }, { fields: ['status', 'expires_at'] }] });

const BookingDetail = sequelize.define('BookingDetail', {
  booking_detail_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  schedule_id: { type: DataTypes.INTEGER, allowNull: false },
  flight_seat_id: { type: DataTypes.INTEGER, allowNull: false },
  passenger_name: { type: DataTypes.STRING(100), allowNull: false },
  passenger_age: { type: DataTypes.INTEGER, allowNull: false },
  passenger_gender: { type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'), allowNull: false },
  passenger_id_type: { type: DataTypes.STRING(50), allowNull: true },
  passenger_id_number: { type: DataTypes.STRING(50), allowNull: true },
  leg_order: { type: DataTypes.INTEGER, defaultValue: 1 },
  price_paid: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'booking_details' });

const Payment = sequelize.define('Payment', {
  payment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { type: DataTypes.ENUM('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED'), defaultValue: 'INITIATED' },
  gateway_reference: { type: DataTypes.STRING(255), allowNull: true },
  payment_method: { type: DataTypes.STRING(50), allowNull: true },
  payment_time: { type: DataTypes.DATE, allowNull: true },
  idempotency_key: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  currency: { type: DataTypes.STRING(10), defaultValue: 'inr' }
}, { tableName: 'payments' });

const BoardingPass = sequelize.define('BoardingPass', {
  boarding_pass_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  booking_detail_id: { type: DataTypes.INTEGER, allowNull: true },
  passenger_name: { type: DataTypes.STRING(100), allowNull: false },
  flight_no: { type: DataTypes.STRING(20), allowNull: false },
  seat_number: { type: DataTypes.STRING(10), allowNull: false },
  gate: { type: DataTypes.STRING(10), allowNull: true },
  boarding_time: { type: DataTypes.DATE, allowNull: true },
  qr_code: { type: DataTypes.TEXT, allowNull: true },
  download_token: { type: DataTypes.STRING(255), allowNull: true },
  expiry_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'boarding_passes' });

// Associations
Booking.hasMany(BookingDetail, { foreignKey: 'booking_id' });
BookingDetail.belongsTo(Booking, { foreignKey: 'booking_id' });
Booking.hasMany(BoardingPass, { foreignKey: 'booking_id' });
BoardingPass.belongsTo(Booking, { foreignKey: 'booking_id' });
Booking.hasMany(Payment, { foreignKey: 'booking_id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });
BookingDetail.hasOne(BoardingPass, { foreignKey: 'booking_detail_id' });
BoardingPass.belongsTo(BookingDetail, { foreignKey: 'booking_detail_id' });

module.exports = { sequelize, Booking, BookingDetail, Payment, BoardingPass };
