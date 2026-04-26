const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Airport = sequelize.define('Airport', {
  airport_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  city: { type: DataTypes.STRING(100), allowNull: false },
  country: { type: DataTypes.STRING(50), allowNull: false },
  timezone: { type: DataTypes.STRING(50), allowNull: true },
  latitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true },
  terminal_count: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'airports' });

module.exports = Airport;
