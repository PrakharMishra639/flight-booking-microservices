const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Airline = sequelize.define('Airline', {
  airline_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  country: { type: DataTypes.STRING(50), allowNull: false },
  logo_url: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' }
}, { tableName: 'airlines' });

module.exports = Airline;
