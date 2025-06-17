import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CInputGroup,
  CFormInput,
  CInputGroupText,
  CAlert,
  CSpinner,
  CProgress,
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilShieldAlt,
  cilReload,
  cilCopy,
  cilCheckAlt,
  cilX,
} from '@coreui/icons'
import { useGenerateOTP, useValidateOTP, useGenerateSecret } from '../../hooks/useOTP'

const OTPGenerator = () => {
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [validationToken, setValidationToken] = useState('')
  const [currentOTP, setCurrentOTP] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedOTP, setCopiedOTP] = useState(false)

  const generateOTPMutation = useGenerateOTP()
  const validateOTPMutation = useValidateOTP()
  const { data: generatedSecret, refetch: generateNewSecret } = useGenerateSecret()

  // Обновляем прогресс бар каждую секунду
  useEffect(() => {
    if (currentOTP && currentOTP.remainingTime > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Автоматически обновляем код когда время истекло
            if (secret) {
              generateOTPMutation.mutate(secret)
            }
            return 30
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentOTP, secret, generateOTPMutation])

  const handleGenerateOTP = () => {
    if (!secret.trim()) return
    
    generateOTPMutation.mutate(secret, {
      onSuccess: (data) => {
        setCurrentOTP(data)
        setTimeLeft(data.remainingTime)
      }
    })
  }

  const handleValidateOTP = () => {
    if (!secret.trim() || !validationToken.trim()) return
    
    validateOTPMutation.mutate({
      secret: secret,
      token: validationToken,
      window: 1
    })
  }

  const handleGenerateSecret = () => {
    generateNewSecret()
  }

  const handleUseGeneratedSecret = () => {
    if (generatedSecret?.secret) {
      setSecret(generatedSecret.secret)
    }
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else if (type === 'otp') {
        setCopiedOTP(true)
        setTimeout(() => setCopiedOTP(false), 2000)
      }
    } catch (err) {
      console.error('Не удалось скопировать: ', err)
    }
  }

  const progressPercentage = timeLeft > 0 ? (timeLeft / 30) * 100 : 0

  return (
    <>
      <CRow>
        <CCol lg={8} className="mx-auto">
          <CCard>
            <CCardHeader>
              <div className="d-flex align-items-center">
                <CIcon icon={cilShieldAlt} className="me-2" />
                <h4 className="mb-0">OTP Генератор</h4>
              </div>
              <small className="text-muted">
                Генерация и валидация одноразовых паролей (TOTP)
              </small>
            </CCardHeader>
            <CCardBody>
              {/* Генерация секретного ключа */}
              <CRow className="mb-4">
                <CCol>
                  <h5>1. Секретный ключ</h5>
                  <CInputGroup className="mb-2">
                    <CFormInput
                      placeholder="Введите секретный ключ Base32 или сгенерируйте новый"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                    />
                    <CButton 
                      color="outline-secondary"
                      onClick={() => copyToClipboard(secret, 'secret')}
                      disabled={!secret}
                    >
                      <CIcon icon={copiedSecret ? cilCheckAlt : cilCopy} />
                    </CButton>
                  </CInputGroup>
                  <div className="d-flex gap-2">
                    <CButton 
                      color="outline-primary" 
                      size="sm"
                      onClick={handleGenerateSecret}
                    >
                      Сгенерировать новый ключ
                    </CButton>
                    {generatedSecret?.secret && (
                      <CButton 
                        color="outline-success" 
                        size="sm"
                        onClick={handleUseGeneratedSecret}
                      >
                        Использовать: {generatedSecret.secret.substring(0, 8)}...
                      </CButton>
                    )}
                  </div>
                </CCol>
              </CRow>

              {/* Генерация OTP */}
              <CRow className="mb-4">
                <CCol>
                  <h5>2. Генерация OTP кода</h5>
                  <div className="d-flex gap-2 mb-3">
                    <CButton 
                      color="primary"
                      onClick={handleGenerateOTP}
                      disabled={!secret || generateOTPMutation.isLoading}
                    >
                      {generateOTPMutation.isLoading ? (
                        <CSpinner size="sm" />
                      ) : (
                        <>
                          <CIcon icon={cilReload} className="me-1" />
                          Генерировать OTP
                        </>
                      )}
                    </CButton>
                  </div>

                  {/* Отображение текущего OTP */}
                  {currentOTP && (
                    <CCard className="bg-light">
                      <CCardBody className="text-center">
                        <h2 className="text-primary mb-2">{currentOTP.otp}</h2>
                        <div className="d-flex justify-content-center gap-2 mb-3">
                          <CButton 
                            color="outline-primary" 
                            size="sm"
                            onClick={() => copyToClipboard(currentOTP.otp, 'otp')}
                          >
                            <CIcon icon={copiedOTP ? cilCheckAlt : cilCopy} className="me-1" />
                            {copiedOTP ? 'Скопировано!' : 'Копировать'}
                          </CButton>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">
                            Действителен еще {timeLeft} секунд
                          </small>
                        </div>
                        <CProgress 
                          value={progressPercentage} 
                          color={progressPercentage > 50 ? 'success' : progressPercentage > 20 ? 'warning' : 'danger'}
                          height={8}
                        />
                      </CCardBody>
                    </CCard>
                  )}

                  {generateOTPMutation.isError && (
                    <CAlert color="danger" className="mt-2">
                      {generateOTPMutation.error?.response?.data?.error || 'Ошибка генерации OTP'}
                    </CAlert>
                  )}
                </CCol>
              </CRow>

              {/* Валидация OTP */}
              <CRow>
                <CCol>
                  <h5>3. Проверка OTP кода</h5>
                  <CInputGroup className="mb-2">
                    <CFormInput
                      placeholder="Введите 6-значный код для проверки"
                      value={validationToken}
                      onChange={(e) => setValidationToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                    <CButton 
                      color="success"
                      onClick={handleValidateOTP}
                      disabled={!secret || !validationToken || validationToken.length !== 6 || validateOTPMutation.isLoading}
                    >
                      {validateOTPMutation.isLoading ? (
                        <CSpinner size="sm" />
                      ) : (
                        'Проверить'
                      )}
                    </CButton>
                  </CInputGroup>

                  {/* Результат валидации */}
                  {validateOTPMutation.isSuccess && (
                    <CAlert 
                      color={validateOTPMutation.data?.valid ? 'success' : 'danger'}
                      className="d-flex align-items-center"
                    >
                      <CIcon 
                        icon={validateOTPMutation.data?.valid ? cilCheckAlt : cilX} 
                        className="me-2" 
                      />
                      {validateOTPMutation.data?.valid ? 
                        'Код верный!' : 
                        'Код неверный или истек'
                      }
                    </CAlert>
                  )}

                  {validateOTPMutation.isError && (
                    <CAlert color="danger">
                      {validateOTPMutation.error?.response?.data?.error || 'Ошибка валидации OTP'}
                    </CAlert>
                  )}
                </CCol>
              </CRow>

              {/* Справочная информация */}
              <CRow className="mt-4">
                <CCol>
                  <CCard className="bg-info bg-opacity-10 border-info">
                    <CCardBody>
                      <h6 className="text-info">Справка:</h6>
                      <ul className="mb-0 small">
                        <li>OTP коды обновляются каждые 30 секунд</li>
                        <li>Секретный ключ должен быть в формате Base32</li>
                        <li>Для проверки используется окно ±1 интервал (90 секунд)</li>
                        <li>Коды совместимы с Google Authenticator, Authy и другими TOTP приложениями</li>
                      </ul>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default OTPGenerator