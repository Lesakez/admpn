const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api', routes);

// 404 handler (должен быть перед error handler)
app.use(notFoundHandler);

// Error handling (должен быть последним)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection с повторами
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database after retries');
      process.exit(1);
    }

    // Создаем базу данных если не существует
    try {
      await sequelize.query('CREATE DATABASE IF NOT EXISTS adminpanel');
      logger.info('Database ensured');
    } catch (error) {
      logger.warn('Could not ensure database exists:', error.message);
    }

    // ОТКЛЮЧАЕМ синхронизацию БД - используем существующую структуру
    // Sync database только если явно указано в переменной окружения
    if (process.env.DB_SYNC === 'true') {
      logger.info('Database sync enabled via DB_SYNC=true');
      await sequelize.sync({ alter: false, force: false });
      logger.info('Database synchronized');
    } else {
      logger.info('Database sync disabled - using existing schema');
      // Просто проверяем подключение к БД
      await sequelize.authenticate();
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;