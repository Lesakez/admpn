import React, { useState, useEffect } from 'react'
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
  CWidgetStatsA,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilReload,
  cilChart,
  cilPeople,
  cilUser,
  cilGlobeAlt,
  cilDevices,
  cilFolder,
  cilCalendar,
} from '@coreui/icons'
import { useRecentActivity, useActivityStats } from '../../hooks/useActivity'

const Activity = () => {
  const [filters, setFilters] = useState({ limit: 50 })

  // Загрузка данных
  const { data: activities, isLoading, error, refetch } = useRecentActivity(filters)
  const { data: stats, isLoading: statsLoading, error: statsError } = useActivityStats({ period: '7d' })

  // Отладочная информация
  useEffect(() => {
    console.log('Activity component state:', {
      activities,
      isLoading,
      error,
      stats,
      statsLoading,
      statsError,
      filters
    })
  }, [activities, isLoading, error, stats, statsLoading, statsError, filters])

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
    
    const actionLabels = {
      create: 'Создание',
      update: 'Обновление',
      delete: 'Удаление',
      bulk_create: 'Массовое создание',
      bulk_update: 'Массовое обновление',
      bulk_delete: 'Массовое удаление',
      status_change: 'Смена статуса',
      status_toggle: 'Переключение статуса',
      import: 'Импорт',
      export: 'Экспорт',
      allocate: 'Назначение',
      release: 'Освобождение',
      reboot: 'Перезагрузка',
      change_ip: 'Смена IP',
    }
    
    return (
      <CBadge color={actionColors[actionType] || 'secondary'}>
        {actionLabels[actionType] || actionType}
      </CBadge>
    )
  }

  const getEntityBadge = (entityType) => {
    const entityColors = {
      account: 'primary',
      profile: 'info',
      proxy: 'warning',
      phone: 'success',
      project: 'dark',
    }
    
    const entityLabels = {
      account: 'Аккаунт',
      profile: 'Профиль',
      proxy: 'Прокси',
      phone: 'Устройство',
      project: 'Проект',
    }
    
    const entityIcons = {
      account: cilPeople,
      profile: cilUser,
      proxy: cilGlobeAlt,
      phone: cilDevices,
      project: cilFolder,
    }
    
    return (
      <CBadge color={entityColors[entityType] || 'secondary'} className="d-flex align-items-center">
        <CIcon icon={entityIcons[entityType]} className="me-1" size="sm" />
        {entityLabels[entityType] || entityType}
      </CBadge>
    )
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Только что'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} мин назад`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} ч назад`
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Показываем ошибки, если есть
  if (error || statsError) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="danger">
            <h4>Ошибка загрузки данных активности</h4>
            <div><strong>Activities error:</strong> {error?.message || 'No error'}</div>
            <div><strong>Stats error:</strong> {statsError?.message || 'No error'}</div>
            <div className="mt-2">
              <strong>Debug info:</strong>
              <pre>{JSON.stringify({ activities, stats, isLoading, statsLoading }, null, 2)}</pre>
            </div>
            <CButton color="primary" onClick={() => {
              refetch()
              window.location.reload()
            }} className="mt-3">
              Попробовать снова
            </CButton>
          </CAlert>
        </CCol>
      </CRow>
    )
  }

  return (
    <>
      {/* Отладочная информация */}
      <CRow className="mb-3">
        <CCol xs={12}>
          <CAlert color="info">
            <strong>Debug Info:</strong><br/>
            Activities: {activities ? `${activities.length} записей` : 'null/undefined'}<br/>
            Loading: {isLoading ? 'Yes' : 'No'}<br/>
            Stats: {stats ? 'Loaded' : 'null/undefined'}<br/>
            Stats Loading: {statsLoading ? 'Yes' : 'No'}<br/>
            Filters: {JSON.stringify(filters)}
          </CAlert>
        </CCol>
      </CRow>

      {/* Статистика за неделю */}
      {stats && (
        <CRow className="mb-4">
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="primary"
              value={stats.totalActions || stats.totalCount || 0}
              title="Всего действий"
              action={
                <CIcon icon={cilChart} height={24} className="my-4 text-white" />
              }
            />
          </CCol>
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="success"
              value={stats.todayActions || 0}
              title="Сегодня"
              action={
                <CIcon icon={cilCalendar} height={24} className="my-4 text-white" />
              }
            />
          </CCol>
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="info"
              value={stats.byEntityType?.account || stats.entityStats?.find(e => e.entityType === 'account')?.count || 0}
              title="Действия с аккаунтами"
              action={
                <CIcon icon={cilPeople} height={24} className="my-4 text-white" />
              }
            />
          </CCol>
          <CCol sm={6} lg={3}>
            <CWidgetStatsA
              className="mb-4"
              color="warning"
              value={stats.byEntityType?.project || stats.entityStats?.find(e => e.entityType === 'project')?.count || 0}
              title="Действия с проектами"
              action={
                <CIcon icon={cilFolder} height={24} className="my-4 text-white" />
              }
            />
          </CCol>
        </CRow>
      )}

      {/* Основная таблица */}
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CRow>
                <CCol sm={6}>
                  <h4 className="mb-0">Журнал активности</h4>
                  <small className="text-muted">
                    Последние действия в системе
                  </small>
                </CCol>
                <CCol sm={6} className="d-flex justify-content-end">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    <CIcon icon={cilReload} className={isLoading ? 'fa-spin' : ''} />
                    Обновить
                  </CButton>
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
                      placeholder="Поиск по описанию..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.entityType || ''}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <option value="">Все сущности</option>
                    <option value="account">Аккаунты</option>
                    <option value="profile">Профили</option>
                    <option value="proxy">Прокси</option>
                    <option value="phone">Устройства</option>
                    <option value="project">Проекты</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.actionType || ''}
                    onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  >
                    <option value="">Все действия</option>
                    <option value="create">Создание</option>
                    <option value="update">Обновление</option>
                    <option value="delete">Удаление</option>
                    <option value="status_change">Смена статуса</option>
                    <option value="import">Импорт</option>
                    <option value="export">Экспорт</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.limit || 50}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Таблица активности */}
              {isLoading ? (
                <div className="text-center">
                  <CSpinner color="primary" />
                  <div className="mt-2">Загрузка...</div>
                </div>
              ) : (
                <CTable align="middle" className="mb-0 border" hover responsive>
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '140px' }}>Время</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '120px' }}>Сущность</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '120px' }}>Действие</CTableHeaderCell>
                      <CTableHeaderCell>Описание</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '80px' }}>ID</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {!activities || activities.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={5} className="text-center">
                          <div className="py-4">
                            <div className="text-muted mb-2">Нет активности для отображения</div>
                            <div className="small text-muted">
                              Попробуйте выполнить какие-либо действия в системе (создать прокси, изменить статус и т.д.)
                            </div>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      activities.map((activity, index) => (
                        <CTableRow key={`${activity.id || index}-${index}`}>
                          <CTableDataCell>
                            <CTooltip
                              content={new Date(activity.timestamp).toLocaleString('ru-RU')}
                            >
                              <small className="text-muted">
                                {formatTimestamp(activity.timestamp)}
                              </small>
                            </CTooltip>
                          </CTableDataCell>
                          <CTableDataCell>
                            {getEntityBadge(activity.entityType)}
                          </CTableDataCell>
                          <CTableDataCell>
                            {getActionBadge(activity.actionType)}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>
                              {activity.description}
                              {activity.metadata && (
                                <div className="text-muted small mt-1">
                                  {Object.entries(activity.metadata).slice(0, 2).map(([key, value]) => (
                                    <span key={key} className="me-2">
                                      <strong>{key}:</strong> {JSON.stringify(value).slice(0, 50)}
                                      {JSON.stringify(value).length > 50 && '...'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            {activity.entityId && (
                              <CBadge color="secondary" shape="rounded-pill">
                                #{activity.entityId}
                              </CBadge>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}

              {/* Информация о загрузке */}
              {activities && activities.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Показано {activities.length} записей
                  </small>
                  <small className="text-muted">
                    Обновление каждые 30 секунд
                  </small>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Activity