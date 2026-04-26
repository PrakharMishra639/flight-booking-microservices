const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Otp = sequelize.define('Otp', {
  otp_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  otp_code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('registration', 'login', 'password_reset'),
    defaultValue: 'login'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'otps'
});

module.exports = Otp;
