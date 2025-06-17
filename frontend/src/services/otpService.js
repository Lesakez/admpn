import api from './api'

export const otpService = {
  // Генерировать OTP код
  generate: (secret) => api.post('/otp/generate', { secret }),

  // Валидировать OTP код
  validate: (secret, token, window = 1) => api.post('/otp/validate', { secret, token, window }),

  // Генерировать секретный ключ
  generateSecret: (length = 32) => api.get(`/otp/secret?length=${length}`),
}