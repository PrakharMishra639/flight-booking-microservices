const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Flight = sequelize.define('Flight', {
  flight_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  airline_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'airlines', key: 'airline_id' } },
  flight_no: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  seat_capacity: { type: DataTypes.INTEGER, allowNull: false },
  aircraft_type: { type: DataTypes.STRING(50), allowNull: true },
  base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' }
}, { tableName: 'flights' });

module.exports = Flight;
