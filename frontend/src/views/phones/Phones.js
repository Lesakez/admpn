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
  CPlaceholder,
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

// Skeleton компонент для таблицы
const TableSkeleton = ({ rows = 5 }) => (
  <CTable hover responsive>
    <CTableHead color="light">
      <CTableRow>
        {Array(8).fill().map((_, i) => (
          <CTableHeaderCell key={i}>
            <CPlaceholder animation="glow" style={{ width: '80%' }} />
          </CTableHeaderCell>
        ))}
      </CTableRow>
    </CTableHead>
    <CTableBody>
      {Array(rows).fill().map((_, rowIndex) => (
        <CTableRow key={rowIndex}>
          <CTableDataCell><CPlaceholder animation="glow" style={{ width: '60px' }} /></CTableDataCell>
          <CTableDataCell><CPlaceholder animation="glow" style={{ width: '90%' }} /></CTableDataCell>
          <CTableDataCell><CPlaceholder animation="glow" style={{ width: '85%' }} /></CTableDataCell>
          <CTableDataCell><CPlaceholder animation="glow" style={{ width: '70%' }} /></CTableDataCell>
          <CTableDataCell><CPlaceholder animation="glow" style={{ width: '120px' }} /></CTableDataCell>
          <CTableDataCell>
            <CPlaceholder animation="glow" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
          </CTableDataCell>
          <CTableDataCell><CPlaceholder animation="glow" style={{ width: '75%' }} /></CTableDataCell>
          <CTableDataCell>
            <div className="d-flex gap-1">
              <CPlaceholder animation="glow" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
              <CPlaceholder animation="glow" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
              <CPlaceholder animation="glow" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
            </div>
          </CTableDataCell>
        </CTableRow>
      ))}
    </CTableBody>
  </CTable>
)

// Skeleton для статистики
const StatsSkeleton = () => (
  <CWidgetStatsA
    className="mb-4"
    value={<CPlaceholder animation="glow" style={{ width: '60px', height: '36px' }} />}
    title={<CPlaceholder animation="glow" style={{ width: '120px', height: '16px' }} />}
    action={<CPlaceholder animation="glow" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />}
  />
)

const Phones = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [showModal, setShowModal] = useState(false)
  const [editingPhone, setEditingPhone] = useState(null)

  // Загрузка данных
  const { data, isLoading, error, refetch } = usePhones(filters)
  const { data: stats, isLoading: statsLoading } = usePhonesStats()
  const deleteMutation = useDeletePhone()
  const toggleStatusMutation = useTogglePhoneStatus()
  const rebootMutation = useRebootPhone()

  // Извлекаем данные - используем оригинальную структуру
  const phones = data?.phones || []
  const pagination = data?.pagination || {}
  const phoneStats = stats?.data || stats || {}

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

  const handleCreate = () => {
    setEditingPhone(null)
    setShowModal(true)
  }

  const handleEdit = (phone) => {
    setEditingPhone(phone)
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
        <h4>Ошибка загрузки устройств</h4>
        <p>{error.message}</p>
        <CButton color="primary" onClick={() => refetch()}>
          <CIcon icon={cilReload} className="me-2" />
          Попробовать снова
        </CButton>
      </CAlert>
    )
  }

  return (
    <>
      {/* Статистика */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          {statsLoading ? (
            <StatsSkeleton />
          ) : (
            <CWidgetStatsA
              className="mb-4"
              color="primary"
              value={phoneStats.total || 0}
              title="Всего устройств"
              action={
                <CButton
                  color="transparent"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <CIcon icon={cilReload} />
                </CButton>
              }
            />
          )}
        </CCol>
        <CCol sm={6} lg={3}>
          {statsLoading ? (
            <StatsSkeleton />
          ) : (
            <CWidgetStatsA
              className="mb-4"
              color="success"
              value={phoneStats.free || 0}
              title="Свободные"
              action={<CIcon icon={cilToggleOn} />}
            />
          )}
        </CCol>
        <CCol sm={6} lg={3}>
          {statsLoading ? (
            <StatsSkeleton />
          ) : (
            <CWidgetStatsA
              className="mb-4"
              color="warning"
              value={phoneStats.busy || 0}
              title="Занятые"
              action={<CIcon icon={cilToggleOff} />}
            />
          )}
        </CCol>
        <CCol sm={6} lg={3}>
          {statsLoading ? (
            <StatsSkeleton />
          ) : (
            <CWidgetStatsA
              className="mb-4"
              color="info"
              value={phoneStats.disabled || 0}
              title="Отключенные"
              action={<CIcon icon={cilDevices} />}
            />
          )}
        </CCol>
      </CRow>

      {/* Основная таблица */}
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Устройства</h5>
                  {!isLoading && pagination.total && (
                    <small className="text-muted">Всего: {pagination.total}</small>
                  )}
                </div>
                <CButton color="primary" onClick={handleCreate}>
                  <CIcon icon={cilPlus} className="me-2" />
                  Добавить устройство
                </CButton>
              </div>
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

              {/* Таблица или skeleton */}
              {isLoading ? (
                <TableSkeleton rows={filters.limit || 10} />
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
                          <CTableDataCell colSpan={8} className="text-center py-4">
                            <div className="text-muted">
                              <CIcon icon={cilDevices} size="xl" className="mb-3" />
                              <p>Устройства не найдены</p>
                              <CButton color="primary" variant="outline" onClick={handleCreate}>
                                <CIcon icon={cilPlus} className="me-2" />
                                Добавить первое устройство
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        phones.map((phone) => (
                          <CTableRow key={phone.id}>
                            <CTableDataCell>
                              <strong>#{phone.id}</strong>
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
                                  {toggleStatusMutation.isLoading ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    <CIcon icon={phone.status === 'free' ? cilToggleOff : cilToggleOn} />
                                  )}
                                </CButton>
                                <CButton
                                  color="secondary"
                                  variant="outline"
                                  onClick={() => handleReboot(phone.id)}
                                  disabled={rebootMutation.isLoading}
                                  title="Перезагрузить"
                                >
                                  {rebootMutation.isLoading ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    <CIcon icon={cilPowerStandby} />
                                  )}
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
                    <div className="d-flex justify-content-center mt-3">
                      <CPagination>
                        <CPaginationItem
                          disabled={pagination.page <= 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        >
                          Предыдущая
                        </CPaginationItem>
                        
                        {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                          const page = i + 1;
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