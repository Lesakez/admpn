const logger = require('../utils/logger');


// Кастомные классы ошибок
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Конфликт данных') {
    super(message, 409, 'CONFLICT');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Не авторизован') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещен') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Основной обработчик ошибок
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Логируем ошибку с контекстом
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  // Логируем по-разному в зависимости от типа ошибки
  if (err.isOperational) {
    logger.warn('Operational error occurred', {
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      ...errorContext
    });
  } else {
    logger.error('Unexpected error occurred', {
      error: err.message,
      stack: err.stack,
      ...errorContext
    });
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    
    error = new ValidationError('Ошибка валидации данных', details);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'unknown';
    error = new ConflictError(`Запись с таким значением поля "${field}" уже существует`);
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = new ConflictError('Нарушение целостности данных. Проверьте связанные записи');
  }

  // Sequelize database connection error
  if (err.name === 'SequelizeConnectionError') {
    error = new AppError('Ошибка подключения к базе данных', 503, 'DATABASE_CONNECTION_ERROR');
  }

  // Sequelize timeout error
  if (err.name === 'SequelizeTimeoutError') {
    error = new AppError('Превышено время ожидания запроса к базе данных', 504, 'DATABASE_TIMEOUT');
  }

  // Joi validation error
  if (err.isJoi) {
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    error = new ValidationError('Ошибка валидации входных данных', details);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Недействительный токен');
  }

  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Токен истек');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('Размер файла превышает допустимый лимит');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new ValidationError('Превышено количество файлов');
  }

  // MongoDB errors (если используется)
  if (err.name === 'CastError') {
    error = new ValidationError('Неверный формат ID');
  }

  // Формируем ответ
  const response = {
    success: false,
    error: error.message || 'Внутренняя ошибка сервера',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // Добавляем детали валидации если есть
  if (error.details && error.details.length > 0) {
    response.details = error.details;
  }

  // В режиме разработки добавляем стек ошибки
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
    response.originalError = err.name;
  }

  // Добавляем ID запроса для отладки
  if (req.id) {
    response.requestId = req.id;
  }

  // Возвращаем ошибку
  res.status(error.statusCode || 500).json(response);
};

// Обработчик для 404 ошибок
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Маршрут ${req.originalUrl} не найден`);
  next(error);
};

// Обработчик для необработанных асинхронных ошибок
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  // Экспортируем классы ошибок для использования в сервисах
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError
};