// frontend/src/services/otpService.js
import api from './api'

/**
 * ИСПРАВЛЕНИЯ В OTP СЕРВИСЕ:
 * 1. Добавлены новые методы API для работы с OTP
 * 2. Улучшена обработка ошибок
 * 3. Добавлена валидация параметров
 * 4. Добавлены утилиты для работы с OTP
 */

export const otpService = {
  // Генерировать OTP код
  generate: async (secret) => {
    if (!secret) {
      throw new Error('Секретный ключ обязателен')
    }
    
    try {
      return await api.post('/otp/generate', { secret })
    } catch (error) {
      console.error('OTP Generate API Error:', error)
      throw error
    }
  },

  // Валидировать OTP код
  validate: async (secret, token, window = 1) => {
    if (!secret || !token) {
      throw new Error('Секретный ключ и токен обязательны')
    }

    // Очищаем токен от пробелов
    const cleanToken = token.replace(/\s/g, '')
    
    if (!/^\d{6}$/.test(cleanToken)) {
      throw new Error('Токен должен содержать 6 цифр')
    }

    try {
      return await api.post('/otp/validate', { 
        secret, 
        token: cleanToken, 
        window: Math.max(1, Math.min(10, parseInt(window) || 1))
      })
    } catch (error) {
      console.error('OTP Validate API Error:', error)
      throw error
    }
  },

  // Генерировать секретный ключ
  generateSecret: async (length = 32) => {
    const keyLength = Math.max(16, Math.min(64, parseInt(length) || 32))
    
    try {
      return await api.get(`/otp/secret?length=${keyLength}`)
    } catch (error) {
      console.error('OTP Generate Secret API Error:', error)
      throw error
    }
  },

  // Получить информацию о времени сервера
  getTimeInfo: async () => {
    try {
      return await api.get('/otp/time-info')
    } catch (error) {
      console.error('OTP Time Info API Error:', error)
      throw error
    }
  },

  // Тестировать OTP с заданным секретом
  testOTP: async (secret) => {
    if (!secret) {
      throw new Error('Секретный ключ обязателен')
    }

    try {
      return await api.post('/otp/test', { secret })
    } catch (error) {
      console.error('OTP Test API Error:', error)
      throw error
    }
  }
}

// Утилиты для работы с OTP (клиентская сторона)
export const otpClientUtils = {
  // Валидация Base32 секрета
  validateSecret: (secret) => {
    if (!secret || typeof secret !== 'string') {
      return { valid: false, error: 'Секретный ключ должен быть строкой' }
    }

    const cleanSecret = secret.replace(/\s/g, '').toUpperCase()
    
    if (cleanSecret.length < 16) {
      return { valid: false, error: 'Секретный ключ слишком короткий (минимум 16 символов)' }
    }

    if (!/^[A-Z2-7]+$/.test(cleanSecret)) {
      return { valid: false, error: 'Секретный ключ должен содержать только символы A-Z и 2-7' }
    }

    return { valid: true, secret: cleanSecret }
  },

  // Валидация OTP токена
  validateToken: (token) => {
    if (!token) {
      return { valid: false, error: 'OTP код обязателен' }
    }

    const cleanToken = token.replace(/\s/g, '')
    
    if (!/^\d{6}$/.test(cleanToken)) {
      return { valid: false, error: 'OTP код должен содержать 6 цифр' }
    }

    return { valid: true, token: cleanToken }
  },

  // Форматирование OTP для отображения
  formatOTPForDisplay: (otp) => {
    if (!otp || otp.length !== 6) return otp
    return `${otp.slice(0, 3)} ${otp.slice(3)}`
  },

  // Генерация URL для QR кода
  generateQRCodeDataURL: async (secret, issuer = 'AdminPanel', account = 'user@example.com') => {
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
    
    // Если есть библиотека для генерации QR кодов, используем её
    if (typeof QRCode !== 'undefined') {
      try {
        return await QRCode.toDataURL(otpauthUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      } catch (error) {
        console.error('QR Code generation error:', error)
      }
    }
    
    // Возвращаем URL для внешнего сервиса генерации QR кодов
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
  },

  // Проверка синхронизации времени
  checkTimeSync: (serverTimestamp) => {
    const clientTimestamp = Math.floor(Date.now() / 1000)
    const difference = Math.abs(clientTimestamp - serverTimestamp)
    
    return {
      difference,
      isSynced: difference <= 30,
      warning: difference > 30 ? `Время клиента отличается от сервера на ${difference} секунд` : null
    }
  },

  // Вычисление прогресса до следующего OTP
  calculateProgress: (remainingTime, period = 30) => {
    if (remainingTime <= 0) return 100
    return ((period - remainingTime) / period) * 100
  },

  // Форматирование времени обратного отсчета
  formatCountdown: (seconds) => {
    if (seconds <= 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },

  // Получение цвета для прогресс-бара в зависимости от оставшегося времени
  getProgressColor: (remainingTime, period = 30) => {
    const ratio = remainingTime / period
    
    if (ratio > 0.5) return 'success'      // Зеленый
    if (ratio > 0.25) return 'warning'     // Желтый
    return 'danger'                        // Красный
  },

  // Копирование OTP в буфер обмена
  copyToClipboard: async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return { success: true }
      } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const result = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        return { success: result }
      }
    } catch (error) {
      console.error('Copy to clipboard error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default otpService