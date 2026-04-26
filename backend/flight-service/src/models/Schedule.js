const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  schedule_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  flight_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'flights', key: 'flight_id' } },
  source_airport_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'airports', key: 'airport_id' } },
  dest_airport_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'airports', key: 'airport_id' } },
  departure_time: { type: DataTypes.DATE, allowNull: false },
  arrival_time: { type: DataTypes.DATE, allowNull: false },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED'), defaultValue: 'SCHEDULED' },
  base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  available_seats: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'schedules',
  version: true,
  indexes: [
    { fields: ['source_airport_id', 'dest_airport_id', 'departure_time'] },
    { fields: ['departure_time'] },
    { fields: ['status'] }
  ]
});

module.exports = Schedule;
