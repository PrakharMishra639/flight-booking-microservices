const { Sequelize } = require('sequelize');

const createSequelizeInstance = (config = {}) => {
  const sequelize = new Sequelize(
    config.database || process.env.DB_NAME,
    config.username || process.env.DB_USER,
    config.password || process.env.DB_PASSWORD,
    {
      host: config.host || process.env.DB_HOST,
      port: config.port || process.env.DB_PORT,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    }
  );
  return sequelize;
};

module.exports = { createSequelizeInstance };
