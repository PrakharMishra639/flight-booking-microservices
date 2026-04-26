const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificationLog = sequelize.define('NotificationLog', {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.ENUM('EMAIL', 'SMS', 'IN_APP', 'PUSH'), allowNull: false },
  category: { type: DataTypes.STRING(50), allowNull: true },
  subject: { type: DataTypes.STRING(255), allowNull: true },
  recipient: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.ENUM('SENT', 'FAILED', 'PENDING'), defaultValue: 'PENDING' },
  metadata: { type: DataTypes.JSON, allowNull: true },
  error_message: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'notification_logs' });

module.exports = { NotificationLog };
