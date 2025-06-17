import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Shield, Copy, RefreshCw, Key, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../components/ui'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function OTP() {
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [window, setWindow] = useState(1)
  const [generatedOtp, setGeneratedOtp] = useState(null)
  const [validationResult, setValidationResult] = useState(null)

  // Генерация секретного ключа
  const generateSecretMutation = useMutation({
    mutationFn: async (length = 32) => {
      const response = await api.get(`/otp/secret?length=${length}`)
      return response.data.data
    },
    onSuccess: (data) => {
      setSecret(data.secret)
      toast.success('Секретный ключ сгенерирован')
    }
  })

  // Генерация OTP
  const generateOtpMutation = useMutation({
    mutationFn: async (secret) => {
      const response = await api.post('/otp/generate', { secret })
      return response.data.data
    },
    onSuccess: (data) => {
      setGeneratedOtp(data)
      toast.success('OTP код сгенерирован')
    }
  })

  // Валидация OTP
  const validateOtpMutation = useMutation({
    mutationFn: async ({ secret, token, window }) => {
      const response = await api.post('/otp/validate', { secret, token, window })
      return response.data.data
    },
    onSuccess: (data) => {
      setValidationResult(data)
      if (data.valid) {
        toast.success('OTP код действителен')
      } else {
        toast.error('OTP код недействителен')
      }
    }
  })

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    toast.success('Секретный ключ скопирован')
  }

  const handleCopyOtp = () => {
    if (generatedOtp?.otp) {
      navigator.clipboard.writeText(generatedOtp.otp)
      toast.success('OTP код скопирован')
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">OTP Генератор</h1>
        <p className="text-gray-600">
          Генерация и валидация одноразовых паролей (TOTP)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Генерация секретного ключа */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Key className="h-5 w-5" />
              Секретный ключ
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Секретный ключ (Base32)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Введите секретный ключ или сгенерируйте новый"
                  className="input flex-1 font-mono"
                />
                <Button
                  variant="outline"
                  onClick={handleCopySecret}
                  disabled={!secret}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => generateSecretMutation.mutate(16)}
                variant="outline"
                size="sm"
                isLoading={generateSecretMutation.isLoading}
              >
                16 символов
              </Button>
              <Button
                onClick={() => generateSecretMutation.mutate(32)}
                variant="outline"
                size="sm"
                isLoading={generateSecretMutation.isLoading}
              >
                32 символа
              </Button>
              <Button
                onClick={() => generateSecretMutation.mutate(64)}
                variant="outline"
                size="sm"
                isLoading={generateSecretMutation.isLoading}
              >
                64 символа
              </Button>
            </div>
          </div>
        </div>

        {/* Генерация OTP */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Генерация OTP
            </h3>
          </div>
          <div className="card-body space-y-4">
            <Button
              onClick={() => generateOtpMutation.mutate(secret)}
              disabled={!secret}
              isLoading={generateOtpMutation.isLoading}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Сгенерировать OTP
            </Button>

            {generatedOtp && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-mono font-semibold text-green-800">
                      {generatedOtp.otp}
                    </h4>
                    <p className="text-sm text-green-600">
                      Действителен еще {generatedOtp.remainingTime} сек.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyOtp}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Валидация OTP */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Валидация OTP
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Секретный ключ
              </label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Base32 ключ"
                className="input font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP код
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                className="input font-mono text-center"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Окно времени
              </label>
              <select
                value={window}
                onChange={(e) => setWindow(parseInt(e.target.value))}
                className="select"
              >
                <option value={0}>Точное время</option>
                <option value={1}>±30 сек</option>
                <option value={2}>±60 сек</option>
                <option value={3}>±90 сек</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <Button
              onClick={() => validateOtpMutation.mutate({ secret, token, window })}
              disabled={!secret || !token}
              isLoading={validateOtpMutation.isLoading}
            >
              Проверить OTP
            </Button>

            {validationResult && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                validationResult.valid 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {validationResult.valid ? 'Действителен' : 'Недействителен'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Инструкции */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Инструкции</h3>
        </div>
        <div className="card-body">
          <div className="prose text-sm text-gray-600">
            <h4 className="font-medium text-gray-900">Как использовать:</h4>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Сгенерируйте секретный ключ или введите существующий</li>
              <li>Нажмите "Сгенерировать OTP" для получения 6-значного кода</li>
              <li>Код действителен 30 секунд</li>
              <li>Для валидации введите секретный ключ и OTP код</li>
              <li>Окно времени позволяет учесть расхождение часов</li>
            </ol>
            
            <h4 className="font-medium text-gray-900 mt-4">Примечания:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Секретный ключ должен быть в формате Base32</li>
              <li>OTP коды генерируются согласно стандарту RFC 6238 (TOTP)</li>
              <li>Используйте одинаковое время на всех устройствах</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}