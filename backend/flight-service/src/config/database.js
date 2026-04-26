const { createSequelizeInstance } = require('../../../shared/config/database');
const sequelize = createSequelizeInstance();
module.exports = { sequelize };
