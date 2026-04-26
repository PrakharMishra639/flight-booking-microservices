const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Seat = sequelize.define('Seat', {
  seat_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  seat_number: { type: DataTypes.STRING(10), allowNull: false },
  class: { type: DataTypes.ENUM('ECONOMY', 'BUSINESS', 'FIRST'), allowNull: false },
  row_number: { type: DataTypes.INTEGER, allowNull: false },
  column_letter: { type: DataTypes.STRING(1), allowNull: false },
  is_window: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_aisle: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_extra_legroom: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'seats' });

const FlightSeat = sequelize.define('FlightSeat', {
  flight_seat_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  schedule_id: { type: DataTypes.INTEGER, allowNull: false },
  seat_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'seats', key: 'seat_id' } },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED'), defaultValue: 'AVAILABLE' },
  locked_until: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'flight_seats',
  indexes: [{ fields: ['schedule_id', 'status'] }, { fields: ['status', 'locked_until'] }]
});

Seat.hasMany(FlightSeat, { foreignKey: 'seat_id' });
FlightSeat.belongsTo(Seat, { foreignKey: 'seat_id' });

module.exports = { Seat, FlightSeat };
