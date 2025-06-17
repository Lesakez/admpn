import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CInputGroup,
  CFormInput,
  CInputGroupText,
  CBadge,
  CButtonGroup,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CWidgetStatsA,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilPowerStandby,
  cilSync,
  cilToggleOn,
  cilToggleOff,
  cilDevices,
} from '@coreui/icons'
import { 
  usePhones, 
  usePhonesStats, 
  useDeletePhone, 
  useTogglePhoneStatus,
  useRebootPhone 
} from '../../hooks/usePhones'
import { PhoneFormModal } from '../../components/forms'

const Phones = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [showModal, setShowModal] = useState(false)
  const [editingPhone, setEditingPhone] = useState(null)

  // Загрузка данных
  const { data, isLoading, error, refetch } = usePhones(filters)
  const { data: stats } = usePhonesStats()
  const deleteMutation = useDeletePhone()
  const toggleStatusMutation = useTogglePhoneStatus()
  const rebootMutation = useRebootPhone()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleDelete = async (id) => {
    if (window.confirm('Удалить устройство?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleToggleStatus = async (id) => {
    await toggleStatusMutation.mutateAsync(id)
  }

  const handleReboot = async (id) => {
    if (window.confirm('Перезагрузить устройство? Это может занять несколько минут.')) {
      await rebootMutation.mutateAsync(id)
    }
  }

  const handleEdit = (phone) => {
    setEditingPhone(phone)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingPhone(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPhone(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'free':
        return 'success'
      case 'busy':
        return 'warning'
      case 'disabled':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'free':
        return 'Свободен'
      case 'busy':
        return 'Занят'
      case 'disabled':
        return 'Отключен'
      default:
        return status
    }
  }

  if (error) {
    return (
      <CAlert color="danger">
        Ошибка загрузки данных: {error.message}
      </CAlert>
    )
  }

  const phones = data?.phones || []
  const pagination = data?.pagination || {}

  return (
    <>
      {/* Статистика */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={stats?.total || 0}
            title="Всего устройств"
            action={
              <CIcon icon={cilDevices} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={stats?.free || 0}
            title="Свободные"
            action={
              <CIcon icon={cilToggleOn} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value={stats?.busy || 0}
            title="Занятые"
            action={
              <CIcon icon={cilSync} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="danger"
            value={stats?.disabled || 0}
            title="Отключенные"
            action={
              <CIcon icon={cilToggleOff} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
      </CRow>

      {/* Основная таблица */}
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CRow>
                <CCol sm={6}>
                  <h4 className="mb-0">Управление устройствами</h4>
                </CCol>
                <CCol sm={6} className="d-flex justify-content-end">
                  <CButtonGroup>
                    <CButton 
                      color="primary" 
                      onClick={handleCreate}
                    >
                      <CIcon icon={cilPlus} className="me-2" />
                      Добавить устройство
                    </CButton>
                    <CButton 
                      color="secondary" 
                      variant="outline"
                      onClick={() => refetch()}
                    >
                      <CIcon icon={cilReload} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {/* Фильтры */}
              <CRow className="mb-3">
                <CCol md={4}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск по модели, устройству..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Все статусы</option>
                    <option value="free">Свободные</option>
                    <option value="busy">Занятые</option>
                    <option value="disabled">Отключенные</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.limit || 20}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Таблица */}
              {isLoading ? (
                <div className="text-center">
                  <CSpinner color="primary" />
                  <div className="mt-2">Загрузка...</div>
                </div>
              ) : (
                <>
                  <CTable align="middle" className="mb-0 border" hover responsive>
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell>ID</CTableHeaderCell>
                        <CTableHeaderCell>Модель</CTableHeaderCell>
                        <CTableHeaderCell>Устройство</CTableHeaderCell>
                        <CTableHeaderCell>Android</CTableHeaderCell>
                        <CTableHeaderCell>IP Адрес</CTableHeaderCell>
                        <CTableHeaderCell>Статус</CTableHeaderCell>
                        <CTableHeaderCell>Проект</CTableHeaderCell>
                        <CTableHeaderCell>Действия</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {phones.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={8} className="text-center">
                            Нет данных для отображения
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        phones.map((phone) => (
                          <CTableRow key={phone.id}>
                            <CTableDataCell>
                              <strong>{phone.id}</strong>
                            </CTableDataCell>
                            <CTableDataCell>{phone.model || 'N/A'}</CTableDataCell>
                            <CTableDataCell>{phone.device || 'N/A'}</CTableDataCell>
                            <CTableDataCell>{phone.androidVersion || 'N/A'}</CTableDataCell>
                            <CTableDataCell>{phone.ipAddress || 'N/A'}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={getStatusColor(phone.status)}>
                                {getStatusText(phone.status)}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>
                              {phone.project?.name || 'Без проекта'}
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButtonGroup size="sm">
                                <CButton
                                  color="info"
                                  variant="outline"
                                  onClick={() => handleEdit(phone)}
                                  title="Редактировать"
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color={phone.status === 'free' ? 'warning' : 'success'}
                                  variant="outline"
                                  onClick={() => handleToggleStatus(phone.id)}
                                  disabled={toggleStatusMutation.isLoading}
                                  title="Переключить статус"
                                >
                                  <CIcon icon={phone.status === 'free' ? cilToggleOff : cilToggleOn} />
                                </CButton>
                                <CButton
                                  color="secondary"
                                  variant="outline"
                                  onClick={() => handleReboot(phone.id)}
                                  disabled={rebootMutation.isLoading}
                                  title="Перезагрузить"
                                >
                                  <CIcon icon={cilPowerStandby} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  onClick={() => handleDelete(phone.id)}
                                  disabled={deleteMutation.isLoading}
                                  title="Удалить"
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </CButtonGroup>
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      )}
                    </CTableBody>
                  </CTable>

                  {/* Пагинация */}
                  {pagination.pages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        Показано {phones.length} из {pagination.total} записей
                      </div>
                      <CPagination>
                        <CPaginationItem
                          disabled={pagination.page <= 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        >
                          Предыдущая
                        </CPaginationItem>
                        
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const page = Math.max(1, Math.min(
                            pagination.pages - 4,
                            pagination.page - 2
                          )) + i
                          
                          if (page <= pagination.pages) {
                            return (
                              <CPaginationItem
                                key={page}
                                active={page === pagination.page}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </CPaginationItem>
                            )
                          }
                          return null
                        })}
                        
                        <CPaginationItem
                          disabled={pagination.page >= pagination.pages}
                          onClick={() => handlePageChange(pagination.page + 1)}
                        >
                          Следующая
                        </CPaginationItem>
                      </CPagination>
                    </div>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Модальное окно */}
      <PhoneFormModal
        visible={showModal}
        onClose={handleCloseModal}
        phone={editingPhone}
        isEdit={!!editingPhone}
      />
    </>
  )
}

export default Phones