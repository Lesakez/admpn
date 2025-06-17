const crypto = require('crypto');
const logger = require('../utils/logger');

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
        remainingTime 
      });

      res.json({
        success: true,
        data: {
          otp,
          validUntil,
          remainingTime
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

    const timestamp = Math.floor(Date.now() / 1000);
    const period = 30;
    const currentWindow = Math.floor(timestamp / period);

    let isValid = false;

    // Проверяем текущее окно и соседние окна (для учета расхождения времени)
    for (let i = -window; i <= window; i++) {
      const testWindow = currentWindow + i;
      const testTimestamp = testWindow * period;
      
      try {
        const expectedToken = generateTOTP(secret, testTimestamp, 6, period);
        
        if (expectedToken === token) {
          isValid = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    logger.info('OTP validation', { 
      secretLength: secret.length,
      token: token.substring(0, 2) + '****',
      isValid 
    });

    res.json({
      success: true,
      data: {
        valid: isValid
      }
    });
  } catch (error) {
    next(error);
  }
};

// Генерировать секретный ключ
const generateSecret = async (req, res, next) => {
  try {
    const { length = 32 } = req.query;
    
    // Генерируем случайные байты
    const randomBytes = crypto.randomBytes(Math.ceil(length * 5 / 8));
    
    // Конвертируем в Base32
    const secret = base32Encode(randomBytes).substring(0, length);

    logger.info('Secret generated', { length: secret.length });

    res.json({
      success: true,
      data: {
        secret
      }
    });
  } catch (error) {
    next(error);
  }
};

// Генерация TOTP согласно RFC 6238
function generateTOTP(secret, timestamp, digits = 6, period = 30) {
  try {
    // Декодируем Base32 секретный ключ
    const secretBytes = base32Decode(secret);
    
    // Вычисляем временное окно
    const timeWindow = Math.floor(timestamp / period);
    
    // Преобразуем временное окно в байты (big-endian)
    const timeBytes = Buffer.alloc(8);
    timeBytes.writeUInt32BE(0, 0);
    timeBytes.writeUInt32BE(timeWindow, 4);
    
    // Вычисляем HMAC-SHA1
    const hmac = crypto.createHmac('sha1', secretBytes);
    hmac.update(timeBytes);
    const hash = hmac.digest();
    
    // Динамическое усечение
    const offset = hash[hash.length - 1] & 0x0f;
    const truncatedHash = hash.readUInt32BE(offset) & 0x7fffffff;
    
    // Преобразуем в нужное количество цифр
    const otp = truncatedHash % Math.pow(10, digits);
    
    // Форматируем OTP с ведущими нулями
    return otp.toString().padStart(digits, '0');
  } catch (error) {
    throw new Error(`Ошибка генерации TOTP: ${error.message}`);
  }
}

// Проверка валидности Base32
function isValidBase32(str) {
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(str.toUpperCase());
}

// Кодирование в Base32
function base32Encode(buffer) {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      result += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }
  
  // Добавляем паддинг
  while (result.length % 8 !== 0) {
    result += '=';
  }
  
  return result;
}

// Декодирование из Base32
function base32Decode(str) {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanStr = str.toUpperCase().replace(/=/g, '');
  
  let bits = 0;
  let value = 0;
  const result = [];
  
  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    const index = base32Chars.indexOf(char);
    
    if (index === -1) {
      throw new Error(`Недопустимый символ в Base32: ${char}`);
    }
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return Buffer.from(result);
}

module.exports = {
  generateOTP,
  validateOTP,
  generateSecret
};