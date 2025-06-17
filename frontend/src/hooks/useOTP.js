import { useMutation } from '@tanstack/react-query'
import { otpService } from '../services/otpService'
import toast from 'react-hot-toast'

// Генерировать OTP код
export function useGenerateOTP() {
  return useMutation({
    mutationFn: async (secret) => {
      const response = await otpService.generate(secret)
      return response.data.data
    },
    onSuccess: () => {
      // Не показываем toast для успешной генерации, так как это происходит часто
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка генерации OTP')
    }
  })
}

// Валидировать OTP код
export function useValidateOTP() {
  return useMutation({
    mutationFn: async ({ secret, token, window }) => {
      const response = await otpService.validate(secret, token, window)
      return response.data.data
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success('OTP код действителен!')
      } else {
        toast.error('OTP код недействителен или истек')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка валидации OTP')
    }
  })
}

// Генерировать секретный ключ
export function useGenerateSecret() {
  return useMutation({
    mutationFn: async (length = 32) => {
      const response = await otpService.generateSecret(length)
      return response.data.data
    },
    onSuccess: () => {
      toast.success('Новый секретный ключ сгенерирован')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка генерации секретного ключа')
    }
  })
}