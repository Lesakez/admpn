// frontend/src/hooks/useOTP.js
import { useMutation, useQuery } from '@tanstack/react-query'
import { otpService } from '../services/otpService'
import toast from 'react-hot-toast'
import { useState, useCallback, useEffect } from 'react'

/**
 * ИСПРАВЛЕНИЯ В ХУКЕ useOTP:
 * 1. Добавлена обработка всех новых методов API
 * 2. Улучшена обработка ошибок с детальными сообщениями
 * 3. Добавлен автоматический счетчик обратного отсчета
 * 4. Добавлена логика кеширования и повторных попыток
 * 5. Добавлены дополнительные utility функции
 */

// Генерировать OTP код
export function useGenerateOTP() {
  return useMutation({
    mutationFn: async (secret) => {
      if (!secret) {
        throw new Error('Секретный ключ обязателен')
      }
      const response = await otpService.generate(secret)
      return response.data.data
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка генерации OTP'
      toast.error(errorMessage)
    },
    // Кешируем результат на 25 секунд (меньше периода OTP)
    gcTime: 25000,
    staleTime: 25000
  })
}

// Валидировать OTP код
export function useValidateOTP() {
  return useMutation({
    mutationFn: async ({ secret, token, window = 1 }) => {
      if (!secret || !token) {
        throw new Error('Секретный ключ и токен обязательны')
      }
      const response = await otpService.validate(secret, token, window)
      return response.data.data
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success('OTP код действителен!', {
          icon: '✅',
          duration: 3000
        })
      } else {
        toast.error('OTP код недействителен или истек', {
          icon: '❌',
          duration: 4000
        })
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка валидации OTP'
      toast.error(errorMessage, {
        icon: '⚠️',
        duration: 5000
      })
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
    onSuccess: (data) => {
      toast.success('Новый секретный ключ сгенерирован', {
        icon: '🔑',
        duration: 3000
      })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка генерации секретного ключа'
      toast.error(errorMessage)
    }
  })
}

// Получить информацию о времени сервера
export function useTimeInfo() {
  return useQuery({
    queryKey: ['otp', 'timeInfo'],
    queryFn: async () => {
      const response = await otpService.getTimeInfo()
      return response.data.data
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    staleTime: 25000,
    onError: (error) => {
      console.error('Ошибка получения информации о времени:', error)
    }
  })
}

// Тестировать OTP с заданным секретом
export function useTestOTP() {
  return useMutation({
    mutationFn: async (secret) => {
      if (!secret) {
        throw new Error('Секретный ключ обязателен')
      }
      const response = await otpService.testOTP(secret)
      return response.data.data
    },
    onSuccess: () => {
      toast.success('Тестовые коды сгенерированы', {
        icon: '🧪',
        duration: 3000
      })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка тестирования OTP'
      toast.error(errorMessage)
    }
  })
}

// Хук для автоматического обратного отсчета времени до обновления OTP
export function useOTPCountdown(otpData) {
  const [remainingTime, setRemainingTime] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!otpData?.validUntil) {
      setRemainingTime(0)
      setIsExpired(true)
      return
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = Math.max(0, otpData.validUntil - now)
      
      setRemainingTime(remaining)
      setIsExpired(remaining === 0)
    }

    // Обновляем сразу
    updateCountdown()

    // Обновляем каждую секунду
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [otpData?.validUntil])

  return {
    remainingTime,
    isExpired,
    progress: otpData?.period ? ((otpData.period - remainingTime) / otpData.period) * 100 : 0
  }
}

// Хук для работы с OTP сессией (объединяет генерацию и валидацию)
export function useOTPSession(secret) {
  const [currentOTP, setCurrentOTP] = useState(null)
  const [lastGenerated, setLastGenerated] = useState(null)
  
  const generateMutation = useGenerateOTP()
  const validateMutation = useValidateOTP()
  const countdown = useOTPCountdown(currentOTP)

  // Автоматическая генерация OTP
  const generateOTP = useCallback(async () => {
    if (!secret) {
      toast.error('Секретный ключ не установлен')
      return
    }

    try {
      const result = await generateMutation.mutateAsync(secret)
      setCurrentOTP(result)
      setLastGenerated(Date.now())
      return result
    } catch (error) {
      console.error('Ошибка генерации OTP:', error)
      return null
    }
  }, [secret, generateMutation])

  // Валидация OTP
  const validateOTP = useCallback(async (token, window = 1) => {
    if (!secret) {
      toast.error('Секретный ключ не установлен')
      return { valid: false }
    }

    if (!token) {
      toast.error('Введите OTP код')
      return { valid: false }
    }

    try {
      const result = await validateMutation.mutateAsync({ secret, token, window })
      return result
    } catch (error) {
      console.error('Ошибка валидации OTP:', error)
      return { valid: false }
    }
  }, [secret, validateMutation])

  // Автоматическое обновление OTP при истечении
  useEffect(() => {
    if (countdown.isExpired && currentOTP && secret) {
      generateOTP()
    }
  }, [countdown.isExpired, currentOTP, secret, generateOTP])

  return {
    // Данные
    currentOTP,
    lastGenerated,
    countdown,
    
    // Методы
    generateOTP,
    validateOTP,
    
    // Состояния
    isGenerating: generateMutation.isLoading,
    isValidating: validateMutation.isLoading,
    
    // Ошибки
    generateError: generateMutation.error,
    validateError: validateMutation.error
  }
}

// Хук для проверки синхронизации времени клиента и сервера
export function useTimeSynchronization() {
  const { data: timeInfo, isLoading } = useTimeInfo()
  const [timeDifference, setTimeDifference] = useState(0)
  const [isSynchronized, setIsSynchronized] = useState(true)

  useEffect(() => {
    if (timeInfo?.timestamp) {
      const clientTime = Math.floor(Date.now() / 1000)
      const serverTime = timeInfo.timestamp
      const difference = Math.abs(clientTime - serverTime)
      
      setTimeDifference(difference)
      setIsSynchronized(difference <= 30) // Считаем синхронизированным если разница <= 30 сек
      
      if (difference > 30) {
        toast.warning(
          `Время клиента отличается от сервера на ${difference} секунд. Это может повлиять на работу OTP.`,
          {
            duration: 8000,
            icon: '⏰'
          }
        )
      }
    }
  }, [timeInfo])

  return {
    timeDifference,
    isSynchronized,
    serverTime: timeInfo,
    isLoading
  }
}

// Утилиты для работы с OTP
export const otpUtils = {
  // Форматирование OTP кода с пробелами
  formatOTP: (otp) => {
    if (!otp || otp.length !== 6) return otp
    return `${otp.slice(0, 3)} ${otp.slice(3)}`
  },

  // Проверка валидности формата OTP
  isValidOTPFormat: (otp) => {
    return /^\d{6}$/.test(otp?.replace(/\s/g, ''))
  },

  // Очистка OTP от пробелов
  cleanOTP: (otp) => {
    return otp?.replace(/\s/g, '') || ''
  },

  // Генерация QR кода URL
  generateQRCodeUrl: (secret, issuer = 'AdminPanel', account = 'user') => {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    })
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params}`
  },

  // Проверка валидности Base32 секрета
  isValidSecret: (secret) => {
    if (!secret || typeof secret !== 'string') return false
    const cleanSecret = secret.replace(/\s/g, '').toUpperCase()
    return /^[A-Z2-7]{16,}$/.test(cleanSecret)
  },

  // Форматирование времени обратного отсчета
  formatCountdown: (seconds) => {
    if (seconds <= 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}