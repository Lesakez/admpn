import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'
import { useForm } from 'react-hook-form'
import { useCreatePhone, useUpdatePhone } from '../../hooks/usePhones'
import { useProjects } from '../../hooks/useProjects'

const PhoneFormModal = ({ visible, onClose, phone = null, isEdit = false }) => {
  const createMutation = useCreatePhone()
  const updateMutation = useUpdatePhone()
  const { data: projectsData } = useProjects()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      model: phone?.model || '',
      device: phone?.device || '',
      androidVersion: phone?.androidVersion || '',
      ipAddress: phone?.ipAddress || '',
      macAddress: phone?.macAddress || '',
      status: phone?.status || 'free',
      projectId: phone?.projectId || '',
    }
  })

  const onSubmit = async (data) => {
    try {
      // Очищаем пустые значения
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      )

      // Конвертируем projectId в число если указан
      if (cleanData.projectId) {
        cleanData.projectId = parseInt(cleanData.projectId)
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: phone.id, data: cleanData })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      
      reset()
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading
  const projects = projectsData?.projects || []

  return (
    <CModal visible={visible} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>{isEdit ? 'Редактировать устройство' : 'Добавить устройство'}</CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody>
          <CRow>
            {/* Основная информация */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="model">Модель</CFormLabel>
                <CFormInput
                  id="model"
                  placeholder="Samsung Galaxy S21"
                  {...register('model')}
                />
              </div>
            </CCol>
            
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="device">Устройство</CFormLabel>
                <CFormInput
                  id="device"
                  placeholder="SM-G991B"
                  {...register('device')}
                />
              </div>
            </CCol>

            {/* Версия Android */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="androidVersion">Версия Android</CFormLabel>
                <CFormInput
                  id="androidVersion"
                  placeholder="11, 12, 13..."
                  {...register('androidVersion')}
                />
              </div>
            </CCol>

            {/* Статус */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="status">Статус</CFormLabel>
                <CFormSelect id="status" {...register('status')}>
                  <option value="free">free</option>
                  <option value="busy">busy</option>
                  <option value="inactive">inactive</option>
                  <option value="maintenance">maintenance</option>
                  <option value="offline">offline</option>
                  <option value="rebooting">rebooting</option>
                  <option value="error">error</option>
                </CFormSelect>
              </div>
            </CCol>

            {/* Сетевая информация */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="ipAddress">IP адрес</CFormLabel>
                <CFormInput
                  id="ipAddress"
                  placeholder="192.168.1.100"
                  invalid={!!errors.ipAddress}
                  {...register('ipAddress', {
                    pattern: {
                      value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                      message: 'Некорректный IP адрес'
                    }
                  })}
                />
                {errors.ipAddress && (
                  <div className="invalid-feedback">{errors.ipAddress.message}</div>
                )}
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="macAddress">MAC адрес</CFormLabel>
                <CFormInput
                  id="macAddress"
                  placeholder="00:1B:44:11:3A:B7"
                  invalid={!!errors.macAddress}
                  {...register('macAddress', {
                    pattern: {
                      value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                      message: 'Формат должен быть XX:XX:XX:XX:XX:XX'
                    }
                  })}
                />
                {errors.macAddress && (
                  <div className="invalid-feedback">{errors.macAddress.message}</div>
                )}
              </div>
            </CCol>

            {/* Проект */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="projectId">Проект</CFormLabel>
                <CFormSelect id="projectId" {...register('projectId')}>
                  <option value="">Без проекта</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </CCol>

            {/* Даты статусов (только для отображения при редактировании) */}
            {isEdit && phone?.dateSetStatusFree && (
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Дата установки статуса "свободен"</CFormLabel>
                  <CFormInput
                    value={new Date(phone.dateSetStatusFree).toLocaleString('ru-RU')}
                    disabled
                    readOnly
                  />
                </div>
              </CCol>
            )}

            {isEdit && phone?.dateSetStatusBusy && (
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Дата установки статуса "занят"</CFormLabel>
                  <CFormInput
                    value={new Date(phone.dateSetStatusBusy).toLocaleString('ru-RU')}
                    disabled
                    readOnly
                  />
                </div>
              </CCol>
            )}

            {isEdit && phone?.dateLastReboot && (
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Дата последней перезагрузки</CFormLabel>
                  <CFormInput
                    value={new Date(phone.dateLastReboot).toLocaleString('ru-RU')}
                    disabled
                    readOnly
                  />
                </div>
              </CCol>
            )}
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={handleClose} disabled={isLoading}>
            Отмена
          </CButton>
          <CButton color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {isEdit ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              isEdit ? 'Сохранить' : 'Создать'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default PhoneFormModal