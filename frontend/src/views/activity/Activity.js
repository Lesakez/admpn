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
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilReload,
  cilChart,
} from '@coreui/icons'
import { useRecentActivity, useActivityStats } from '../../hooks/useActivity'

const Activity = () => {
  const [filters, setFilters] = useState({ limit: 50 })

  // Загрузка данных
  const { data: activities, isLoading, error, refetch } = useRecentActivity(filters)
  const { data: stats } = useActivityStats({ period: '7d' })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getActionBadge = (actionType) => {
    const actionColors = {
      create: 'success',
      update: 'info',
      delete: 'danger',
      bulk_create: 'success',
      bulk_update: 'info',
      bulk_delete: 'danger',
      status_change: 'warning',
      status_toggle: 'warning',
      import: 'primary',
      export: 'secondary',
      allocate: 'info',
      release: 'secondary',
      reboot: 'warning',
      change_ip: 'info',
    }
    return <CBadge color={actionColors[actionType] || 'secondary'}>{actionType}</CBadge>
  }

  const getEntityBadge = (entityType) => {
    const entityColors = {
      account: 'primary',
      profile: 'info',
      proxy: 'warning',
      phone: 'success',
      project: 'dark',
      registration: 'secondary',
      config: 'light',
      folder: 'info',
    }
    return <CBadge color={entityColors[entityType] || 'secondary'}>{entityType}</CBadge>
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'только что'
    if (diffMinutes < 60) return `${diffMinutes} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} д назад`
    
    return date.toLocaleDateString('ru-RU')
  }

  if (error) {
    return (
      <CAlert color="danger">
        Ошибка загрузки данных: {error.message}
        <CButton color="link" onClick={() => refetch()}>
          Попробовать снова
        </CButton>
      </CAlert>
    )
  }

  return (
    <>
      <CRow>
        {/* Статистика */}
        {stats && (
          <CCol xs={12} className="mb-4">
            <CRow>
              <CCol sm={6} lg={3}>
                <CCard className="text-center">
                  <CCardBody>
                    <h4 className="text-primary">{stats.total}</h4>
                    <p className="text-muted mb-0">Всего действий за неделю</p>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={3}>
                <CCard className="text-center">
                  <CCardBody>
                    <h4 className="text-success">{stats.byAction?.find(a => a.action === 'create')?.count || 0}</h4>
                    <p className="text-muted mb-0">Создано</p>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={3}>
                <CCard className="text-center">
                  <CCardBody>
                    <h4 className="text-info">{stats.byAction?.find(a => a.action === 'update')?.count || 0}</h4>
                    <p className="text-muted mb-0">Обновлено</p>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol sm={6} lg={3}>
                <CCard className="text-center">
                  <CCardBody>
                    <h4 className="text-danger">{stats.byAction?.find(a => a.action === 'delete')?.count || 0}</h4>
                    <p className="text-muted mb-0">Удалено</p>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </CCol>
        )}

        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">Журнал активности</h4>
                  <small className="text-muted">Последние действия в системе</small>
                </div>
                <div>
                  <CButtonGroup>
                    <CButton
                      color="outline-secondary"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <CIcon icon={cilReload} className={isLoading ? 'spin' : ''} />
                    </CButton>
                    <CButton color="outline-info">
                      <CIcon icon={cilChart} /> Статистика
                    </CButton>
                  </CButtonGroup>
                </div>
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
                      placeholder="Поиск в описании..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.entityType || ''}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <option value="">Все сущности</option>
                    <option value="account">account</option>
                    <option value="profile">profile</option>
                    <option value="proxy">proxy</option>
                    <option value="phone">phone</option>
                    <option value="project">project</option>
                    <option value="registration">registration</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.actionType || ''}
                    onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  >
                    <option value="">Все действия</option>
                    <option value="create">create</option>
                    <option value="update">update</option>
                    <option value="delete">delete</option>
                    <option value="import">import</option>
                    <option value="export">export</option>
                    <option value="status_change">status_change</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.limit || 50}
                    onChange={(e) => handleFilterChange('limit', e.target.value)}
                  >
                    <option value={25}>25 записей</option>
                    <option value={50}>50 записей</option>
                    <option value={100}>100 записей</option>
                    <option value={200}>200 записей</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Время</CTableHeaderCell>
                    <CTableHeaderCell>Действие</CTableHeaderCell>
                    <CTableHeaderCell>Сущность</CTableHeaderCell>
                    <CTableHeaderCell>Описание</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {isLoading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="4" className="text-center">
                        <CSpinner /> Загрузка...
                      </CTableDataCell>
                    </CTableRow>
                  ) : !activities || activities.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="4" className="text-center">
                        Данные не найдены
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    activities.map((activity) => (
                      <CTableRow key={activity.id}>
                        <CTableDataCell>
                          <div>{formatTimestamp(activity.timestamp)}</div>
                          <div className="small text-muted">
                            {new Date(activity.timestamp).toLocaleTimeString('ru-RU')}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>{getActionBadge(activity.actionType)}</CTableDataCell>
                        <CTableDataCell>
                          <div>{getEntityBadge(activity.entityType)}</div>
                          {activity.entityId !== 0 && (
                            <div className="small text-muted">ID: {activity.entityId}</div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>{activity.description}</div>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <details className="mt-1">
                              <summary className="small text-muted" style={{ cursor: 'pointer' }}>
                                Подробности
                              </summary>
                              <pre className="small mt-1 p-2 bg-light rounded" style={{ fontSize: '0.75rem' }}>
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Activity