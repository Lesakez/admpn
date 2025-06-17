const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'adminpanel',
  username: process.env.DB_USER || 'adminpanel',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'mysql',
  logging: false, // Отключаем SQL логи
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  },
  dialectOptions: {
    charset: 'utf8mb4'
    // Убираем collate - MySQL2 его не поддерживает
  },
  retry: {
    max: 3
  }
});

// Test connection с повторами
const testConnection = async () => {
  let retries = 5;
  
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      logger.info('MySQL connection established successfully');
      return true;
    } catch (error) {
      retries--;
      logger.warn(`MySQL connection failed, retries left: ${retries}`, { error: error.message });
      
      if (retries === 0) {
        logger.error('Unable to connect to MySQL database after all retries:', error);
        return false;
      }
      
      // Ждем 2 секунды перед повтором
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

module.exports = {
  sequelize,
  testConnection
};