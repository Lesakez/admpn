import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CSpinner,
  CAlert,
  CProgress,
  CWidgetStatsA,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilShieldAlt,
  cilReload,
  cilCopy,
  cilCheckAlt,
  cilX,
  cilKeyboard,
  cilClock,
} from '@coreui/icons'
import { useGenerateOTP, useValidateOTP, useGenerateSecret } from '../../hooks/useOTP'

const OTPGenerator = () => {
  const [secret, setSecret] = useState('')
  const [validateToken, setValidateToken] = useState('')
  const [currentOTP, setCurrentOTP] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedOTP, setCopiedOTP] = useState(false)

  // Хуки для API
  const generateOTPMutation = useGenerateOTP()
  const validateOTPMutation = useValidateOTP()
  const generateSecretMutation = useGenerateSecret()

  // Таймер для обновления OTP и обратного отсчета
  useEffect(() => {
    let interval
    if (currentOTP) {
      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        const elapsed = now % 30
        const remaining = 30 - elapsed
        setTimeLeft(remaining)

        // Автоматически генерируем новый OTP каждые 30 секунд
        if (remaining === 30 && secret) {
          handleGenerateOTP()
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentOTP, secret])

  // Генерация нового секретного ключа
  const handleGenerateSecret = async () => {
    try {
      const result = await generateSecretMutation.mutateAsync(32)
      setSecret(result.secret)
      setCurrentOTP(null)
    } catch (error) {
      console.error('Error generating secret:', error)
    }
  }

  // Генерация OTP кода
  const handleGenerateOTP = async () => {
    if (!secret) return
    
    try {
      const result = await generateOTPMutation.mutateAsync(secret)
      setCurrentOTP(result)
      
      // Вычисляем оставшееся время
      const now = Math.floor(Date.now() / 1000)
      const elapsed = now % 30
      setTimeLeft(30 - elapsed)
    } catch (error) {
      console.error('Error generating OTP:', error)
    }
  }

  // Валидация OTP кода
  const handleValidateOTP = async () => {
    if (!secret || !validateToken) return
    
    try {
      await validateOTPMutation.mutateAsync({
        secret,
        token: validateToken,
        window: 1
      })
    } catch (error) {
      console.error('Error validating OTP:', error)
    }
  }

  // Копирование в буфер обмена
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
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Прогресс бар для оставшегося времени
  const progressPercentage = (timeLeft / 30) * 100

  return (
    <>
      {/* Статистические карточки */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={currentOTP ? currentOTP.otp : '------'}
            title="Текущий OTP"
            action={
              <CIcon icon={cilShieldAlt} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="info"
            value={`${timeLeft}s`}
            title="Осталось времени"
            action={
              <CIcon icon={cilClock} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={validateOTPMutation.data?.valid ? 'ВЕРНЫЙ' : 'НЕ ПРОВЕРЕН'}
            title="Статус валидации"
            action={
              <CIcon icon={validateOTPMutation.data?.valid ? cilCheckAlt : cilKeyboard} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value="TOTP"
            title="Алгоритм"
            action={
              <CIcon icon={cilShieldAlt} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
      </CRow>

      {/* Основной компонент */}
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h4 className="mb-0">OTP Generator (TOTP)</h4>
              <small className="text-muted">
                Генератор одноразовых паролей с временной привязкой
              </small>
            </CCardHeader>

            <CCardBody>
              {/* Генерация секретного ключа */}
              <CRow className="mb-4">
                <CCol>
                  <h5>1. Секретный ключ</h5>
                  <CInputGroup className="mb-3">
                    <CFormInput
                      placeholder="Введите секретный ключ в формате Base32 или сгенерируйте новый"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      type="password"
                    />
                    <CButton 
                      color="outline-secondary"
                      onClick={() => copyToClipboard(secret, 'secret')}
                      disabled={!secret}
                    >
                      <CIcon icon={copiedSecret ? cilCheckAlt : cilCopy} />
                    </CButton>
                    <CButton 
                      color="primary"
                      onClick={handleGenerateSecret}
                      disabled={generateSecretMutation.isLoading}
                    >
                      {generateSecretMutation.isLoading ? (
                        <CSpinner size="sm" />
                      ) : (
                        <>
                          <CIcon icon={cilReload} className="me-1" />
                          Сгенерировать
                        </>
                      )}
                    </CButton>
                  </CInputGroup>

                  {generateSecretMutation.isError && (
                    <CAlert color="danger" className="mt-2">
                      {generateSecretMutation.error?.response?.data?.error || 'Ошибка генерации секретного ключа'}
                    </CAlert>
                  )}
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
                        <h2 className="text-primary mb-2 font-monospace">{currentOTP.otp}</h2>
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
              <CRow className="mb-4">
                <CCol>
                  <h5>3. Валидация OTP кода</h5>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilKeyboard} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Введите 6-значный OTP код для проверки"
                      value={validateToken}
                      onChange={(e) => setValidateToken(e.target.value)}
                      maxLength={6}
                      pattern="[0-9]*"
                    />
                    <CButton 
                      color="success"
                      onClick={handleValidateOTP}
                      disabled={!secret || !validateToken || validateOTPMutation.isLoading}
                    >
                      {validateOTPMutation.isLoading ? (
                        <CSpinner size="sm" />
                      ) : (
                        <>
                          <CIcon icon={cilCheckAlt} className="me-1" />
                          Проверить
                        </>
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
                      <h6 className="text-info">
                        <CIcon icon={cilShieldAlt} className="me-2" />
                        Справка по использованию:
                      </h6>
                      <ul className="mb-0 small">
                        <li>OTP коды обновляются каждые 30 секунд</li>
                        <li>Секретный ключ должен быть в формате Base32 (A-Z, 2-7)</li>
                        <li>Для проверки используется окно ±1 интервал (90 секунд)</li>
                        <li>Коды совместимы с Google Authenticator, Authy и другими TOTP приложениями</li>
                        <li>Длина секретного ключа: рекомендуется 32 символа</li>
                        <li>Алгоритм: TOTP (Time-based One-Time Password) RFC 6238</li>
                      </ul>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              {/* Дополнительные инструменты */}
              <CRow className="mt-4">
                <CCol>
                  <CCard className="bg-light">
                    <CCardBody>
                      <h6>Быстрые действия:</h6>
                      <div className="d-flex gap-2 flex-wrap">
                        <CButton 
                          color="outline-primary" 
                          size="sm"
                          onClick={() => {
                            setSecret('')
                            setCurrentOTP(null)
                            setValidateToken('')
                          }}
                        >
                          Очистить все
                        </CButton>
                        <CButton 
                          color="outline-info" 
                          size="sm"
                          onClick={() => setSecret('JBSWY3DPEHPK3PXP')}
                        >
                          Тестовый ключ
                        </CButton>
                        <CButton 
                          color="outline-success" 
                          size="sm"
                          onClick={() => {
                            if (currentOTP) {
                              setValidateToken(currentOTP.otp)
                            }
                          }}
                          disabled={!currentOTP}
                        >
                          Использовать текущий OTP
                        </CButton>
                      </div>
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