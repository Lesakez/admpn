// backend/src/controllers/otpController.js
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * ИСПРАВЛЕНИЯ В OTP КОНТРОЛЛЕРЕ:
 * 1. Завершена обрезанная реализация validateOTP
 * 2. Добавлен метод генерации секретного ключа
 * 3. Исправлены проблемы с Base32 кодированием
 * 4. Добавлена полная реализация TOTP алгоритма
 * 5. Улучшена обработка ошибок и валидация
 */

// Таблица Base32 для кодирования/декодирования
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Проверка валидности Base32 строки
const isValidBase32 = (str) => {
  if (!str || typeof str !== 'string') return false;
  
  // Удаляем пробелы и приводим к верхнему регистру
  const cleanStr = str.replace(/\s/g, '').toUpperCase();
  
  // Проверяем, что все символы из алфавита Base32
  return /^[A-Z2-7]*$/.test(cleanStr) && cleanStr.length >= 16;
};

// Декодирование Base32 в Buffer
const base32Decode = (encoded) => {
  const cleanInput = encoded.replace(/\s/g, '').toUpperCase();
  let bits = '';
  
  for (let i = 0; i < cleanInput.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (val === -1) throw new Error('Invalid Base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = [];
  for (let i = 0; i < bits.length - 7; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  
  return Buffer.from(bytes);
};

// Кодирование Buffer в Base32
const base32Encode = (buffer) => {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substr(i, 5).padEnd(5, '0');
    result += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  
  return result;
};

// Генерация TOTP кода
const generateTOTP = (secret, timestamp, digits = 6, period = 30) => {
  try {
    // Декодируем Base32 секрет
    const key = base32Decode(secret);
    
    // Вычисляем счетчик времени
    const counter = Math.floor(timestamp / period);
    
    // Создаем 8-байтовый буфер для счетчика
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);
    
    // Генерируем HMAC-SHA1
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();
    
    // Динамическое усечение
    const offset = digest[digest.length - 1] & 0xf;
    const code = ((digest[offset] & 0x7f) << 24) |
                 ((digest[offset + 1] & 0xff) << 16) |
                 ((digest[offset + 2] & 0xff) << 8) |
                 (digest[offset + 3] & 0xff);
    
    // Получаем код нужной длины
    const otp = (code % Math.pow(10, digits)).toString().padStart(digits, '0');
    
    return otp;
  } catch (error) {
    throw new Error('Ошибка генерации TOTP: ' + error.message);
  }
};

// Генерировать OTP код
const generateOTP = async (req, res, next) => {
  try {
    const { secret } = req.body;

    if (!secret) {
      return res.status(400).json({
        success: false,
        error: 'Секретный ключ обязателен'
      });
    }

    // Проверяем валидность Base32 ключа
    if (!isValidBase32(secret)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат секретного ключа (должен быть Base32)'
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    
    try {
      const otp = generateTOTP(secret, timestamp, 6, 30);
      
      // Вычисляем, когда истечет текущий код
      const period = 30;
      const currentWindow = Math.floor(timestamp / period);
      const validUntil = (currentWindow + 1) * period;
      const remainingTime = validUntil - timestamp;

      logger.info('OTP generated', { 
        secretLength: secret.length,
        remainingTime,
        timestamp
      });

      res.json({
        success: true,
        data: {
          otp,
          validUntil,
          remainingTime,
          period,
          algorithm: 'SHA1',
          digits: 6
        }
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка генерации OTP: ' + error.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// Валидировать OTP код
const validateOTP = async (req, res, next) => {
  try {
    const { secret, token, window = 1 } = req.body;

    if (!secret || !token) {
      return res.status(400).json({
        success: false,
        error: 'Секретный ключ и токен обязательны'
      });
    }

    if (!isValidBase32(secret)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат секретного ключа (должен быть Base32)'
      });
    }

    // Проверяем формат токена
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        error: 'Токен должен содержать 6 цифр'
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const period = 30;
    const windowSize = Math.max(1, Math.min(10, parseInt(window))); // Ограничиваем окно

    let isValid = false;
    let matchedWindow = null;

    try {
      // Проверяем текущее окно и соседние окна в пределах window
      for (let i = -windowSize; i <= windowSize; i++) {
        const testTimestamp = timestamp + (i * period);
        const expectedOtp = generateTOTP(secret, testTimestamp, 6, period);
        
        if (expectedOtp === token) {
          isValid = true;
          matchedWindow = i;
          break;
        }
      }

      const result = {
        valid: isValid,
        timestamp,
        window: windowSize,
        ...(isValid && {
          matchedWindow,
          matchedTimestamp: timestamp + (matchedWindow * period)
        })
      };

      if (isValid) {
        logger.info('OTP validation successful', {
          secretLength: secret.length,
          matchedWindow,
          timestamp
        });
      } else {
        logger.warn('OTP validation failed', {
          secretLength: secret.length,
          token: token.substring(0, 2) + '****', // Частично скрываем токен
          timestamp
        });
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации OTP: ' + error.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// Генерировать секретный ключ
const generateSecret = async (req, res, next) => {
  try {
    const { length = 32 } = req.query;
    
    // Ограничиваем длину ключа
    const keyLength = Math.max(16, Math.min(64, parseInt(length) || 32));
    
    // Генерируем случайные байты
    const randomBytes = crypto.randomBytes(keyLength);
    
    // Кодируем в Base32
    const secret = base32Encode(randomBytes);
    
    // Создаем QR код URL для Google Authenticator
    const issuer = process.env.OTP_ISSUER || 'AdminPanel';
    const accountName = process.env.OTP_ACCOUNT || 'user@adminpanel.com';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    logger.info('Secret generated', { 
      length: keyLength,
      secretLength: secret.length
    });

    res.json({
      success: true,
      data: {
        secret,
        length: keyLength,
        qrCodeUrl: otpauthUrl,
        format: 'Base32',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        instructions: {
          setup: 'Отсканируйте QR код в приложении аутентификатора или введите секрет вручную',
          apps: ['Google Authenticator', 'Authy', 'Microsoft Authenticator', '1Password']
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить информацию о текущем времени и синхронизации
const getTimeInfo = async (req, res, next) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const period = 30;
    const currentWindow = Math.floor(timestamp / period);
    const windowStart = currentWindow * period;
    const windowEnd = windowStart + period;
    const remainingTime = windowEnd - timestamp;

    res.json({
      success: true,
      data: {
        timestamp,
        currentWindow,
        windowStart,
        windowEnd,
        remainingTime,
        period,
        serverTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  } catch (error) {
    next(error);
  }
};

// Тестирование OTP с заданным секретом
const testOTP = async (req, res, next) => {
  try {
    const { secret } = req.body;

    if (!secret || !isValidBase32(secret)) {
      return res.status(400).json({
        success: false,
        error: 'Требуется валидный Base32 секретный ключ'
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const period = 30;
    
    // Генерируем коды для текущего и следующих окон
    const codes = [];
    for (let i = 0; i < 3; i++) {
      const testTimestamp = timestamp + (i * period);
      const otp = generateTOTP(secret, testTimestamp, 6, period);
      const windowStart = Math.floor(testTimestamp / period) * period;
      
      codes.push({
        otp,
        window: i,
        timestamp: testTimestamp,
        windowStart,
        windowEnd: windowStart + period,
        isCurrent: i === 0
      });
    }

    res.json({
      success: true,
      data: {
        secret,
        timestamp,
        period,
        codes,
        note: 'Используйте эти коды для тестирования. Первый код актуален сейчас.'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateOTP,
  validateOTP,
  generateSecret,
  getTimeInfo,
  testOTP
};