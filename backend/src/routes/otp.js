// backend/src/routes/otp.js
const express = require('express');
const otpController = require('../controllers/otpController');
const { body, query, validationResult } = require('express-validator');

const router = express.Router();

/**
 * ИСПРАВЛЕНИЯ В МАРШРУТАХ OTP:
 * 1. Добавлены новые маршруты для дополнительных методов
 * 2. Добавлена валидация входных параметров с express-validator
 * 3. Улучшена обработка ошибок валидации
 * 4. Добавлены комментарии для документации API
 */

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: errors.array().map(err => err.msg)
    });
  }
  next();
};

// POST /api/otp/generate - генерировать OTP код
router.post('/generate', [
  body('secret')
    .notEmpty()
    .withMessage('Секретный ключ обязателен')
    .isLength({ min: 16 })
    .withMessage('Секретный ключ должен быть не менее 16 символов')
    .matches(/^[A-Z2-7\s]+$/i)
    .withMessage('Секретный ключ должен быть в формате Base32 (A-Z, 2-7)'),
  handleValidationErrors
], otpController.generateOTP);

// POST /api/otp/validate - валидировать OTP код
router.post('/validate', [
  body('secret')
    .notEmpty()
    .withMessage('Секретный ключ обязателен')
    .isLength({ min: 16 })
    .withMessage('Секретный ключ должен быть не менее 16 символов')
    .matches(/^[A-Z2-7\s]+$/i)
    .withMessage('Секретный ключ должен быть в формате Base32'),
  body('token')
    .notEmpty()
    .withMessage('OTP токен обязателен')
    .matches(/^\d{6}$/)
    .withMessage('OTP токен должен содержать 6 цифр'),
  body('window')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Окно валидации должно быть от 1 до 10')
    .toInt(),
  handleValidationErrors
], otpController.validateOTP);

// GET /api/otp/secret - генерировать секретный ключ
router.get('/secret', [
  query('length')
    .optional()
    .isInt({ min: 16, max: 64 })
    .withMessage('Длина ключа должна быть от 16 до 64 байт')
    .toInt(),
  handleValidationErrors
], otpController.generateSecret);

// GET /api/otp/time-info - получить информацию о времени сервера
router.get('/time-info', otpController.getTimeInfo);

// POST /api/otp/test - тестирование OTP с заданным секретом
router.post('/test', [
  body('secret')
    .notEmpty()
    .withMessage('Секретный ключ обязателен')
    .isLength({ min: 16 })
    .withMessage('Секретный ключ должен быть не менее 16 символов')
    .matches(/^[A-Z2-7\s]+$/i)
    .withMessage('Секретный ключ должен быть в формате Base32'),
  handleValidationErrors
], otpController.testOTP);

// Документация API (GET /api/otp/docs)
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'OTP API Documentation',
      version: '1.0.0',
      description: 'API для работы с одноразовыми паролями (TOTP)',
      endpoints: [
        {
          method: 'POST',
          path: '/api/otp/generate',
          description: 'Генерирует OTP код по секретному ключу',
          parameters: {
            secret: 'string (Base32, минимум 16 символов) - Секретный ключ'
          },
          response: {
            otp: 'string - 6-значный OTP код',
            validUntil: 'number - Unix timestamp истечения кода',
            remainingTime: 'number - Оставшееся время в секундах',
            period: 'number - Период действия кода (30 сек)',
            algorithm: 'string - Алгоритм хеширования (SHA1)',
            digits: 'number - Количество цифр в коде (6)'
          }
        },
        {
          method: 'POST',
          path: '/api/otp/validate',
          description: 'Валидирует OTP код',
          parameters: {
            secret: 'string (Base32) - Секретный ключ',
            token: 'string (6 цифр) - OTP код для проверки',
            window: 'number (1-10, опционально) - Окно валидации'
          },
          response: {
            valid: 'boolean - Результат валидации',
            timestamp: 'number - Время проверки',
            window: 'number - Использованное окно',
            matchedWindow: 'number - Окно, в котором найдено совпадение',
            matchedTimestamp: 'number - Timestamp совпадения'
          }
        },
        {
          method: 'GET',
          path: '/api/otp/secret',
          description: 'Генерирует новый секретный ключ',
          parameters: {
            length: 'number (16-64, опционально) - Длина ключа в байтах'
          },
          response: {
            secret: 'string - Сгенерированный Base32 ключ',
            length: 'number - Длина ключа',
            qrCodeUrl: 'string - URL для QR кода',
            format: 'string - Формат ключа (Base32)',
            algorithm: 'string - Алгоритм (SHA1)',
            digits: 'number - Количество цифр (6)',
            period: 'number - Период (30)',
            instructions: 'object - Инструкции по настройке'
          }
        },
        {
          method: 'GET',
          path: '/api/otp/time-info',
          description: 'Получает информацию о времени сервера',
          response: {
            timestamp: 'number - Unix timestamp сервера',
            currentWindow: 'number - Текущее временное окно',
            windowStart: 'number - Начало текущего окна',
            windowEnd: 'number - Конец текущего окна',
            remainingTime: 'number - Время до конца окна',
            period: 'number - Период окна (30 сек)',
            serverTime: 'string - ISO строка времени сервера',
            timezone: 'string - Временная зона сервера'
          }
        },
        {
          method: 'POST',
          path: '/api/otp/test',
          description: 'Генерирует тестовые OTP коды для отладки',
          parameters: {
            secret: 'string (Base32) - Секретный ключ'
          },
          response: {
            secret: 'string - Использованный ключ',
            timestamp: 'number - Время генерации',
            period: 'number - Период (30)',
            codes: 'array - Массив тестовых кодов',
            note: 'string - Примечание'
          }
        }
      ],
      examples: {
        generateOTP: {
          request: {
            secret: 'JBSWY3DPEHPK3PXP'
          },
          response: {
            success: true,
            data: {
              otp: '123456',
              validUntil: 1640995230,
              remainingTime: 25,
              period: 30,
              algorithm: 'SHA1',
              digits: 6
            }
          }
        },
        validateOTP: {
          request: {
            secret: 'JBSWY3DPEHPK3PXP',
            token: '123456',
            window: 1
          },
          response: {
            success: true,
            data: {
              valid: true,
              timestamp: 1640995205,
              window: 1,
              matchedWindow: 0,
              matchedTimestamp: 1640995205
            }
          }
        }
      },
      notes: [
        'Все временные метки в Unix формате (секунды с 1970-01-01)',
        'Секретные ключи должны быть в формате Base32',
        'OTP коды действительны 30 секунд',
        'Для синхронизации времени используйте /time-info',
        'Окно валидации позволяет учесть небольшие расхождения времени'
      ]
    }
  });
});

module.exports = router;