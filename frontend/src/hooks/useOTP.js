import { useMutation, useQuery } from '@tanstack/react-query'
import { otpService } from '../services/otpService'
import toast from 'react-hot-toast'

// Генерировать OTP код
export function useGenerateOTP() {
  return useMutation({
    mutationFn: async (secret) => {
      const response = await otpService.generate(secret)
      return response.data.data
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
        toast.success('Код подтвержден!')
      } else {
        toast.error('Неверный код')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка валидации OTP')
    }
  })
}

// Генерировать секретный ключ
export function useGenerateSecret(length = 32) {
  return useQuery({
    queryKey: ['otp', 'secret', length],
    queryFn: async () => {
      const response = await otpService.generateSecret(length)
      return response.data.data
    },
    enabled: false, // Запускаем только по требованию
  })
}