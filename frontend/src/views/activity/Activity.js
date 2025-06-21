import React, { useState, useMemo } from 'react'
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
  CFormSelect,
  CSpinner,
  CAlert,
  CWidgetStatsA,
  CTooltip,
  CPagination,
  CPaginationItem,
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
  const [filters, setFilters] = useState({ 
    limit: 50,
    offset: 0,
    page: 1
  })

  // Загрузка данных
  const { data: rawData, isLoading, error, refetch } = useRecentActivity(filters)
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useActivityStats({ period: '7d' })

  // Обработка данных активности
  const activities = useMemo(() => {
    if (!rawData) return []
    if (Array.isArray(rawData)) return rawData
    if (rawData.data && Array.isArray(rawData.data)) return rawData.data
    return []
  }, [rawData])

  // Вычисление пагинации
  const pagination = useMemo(() => {
    const total = activities.length
    const pages = Math.ceil(total / filters.limit)
    return {
      page: filters.page,
      pages,
      total,
      hasNext: filters.page < pages,
      hasPrev: filters.page > 1
    }
  }, [activities.length, filters.limit, filters.page])

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      
      // При изменении limit сбрасываем на первую страницу
      if (key === 'limit') {
        newFilters.page = 1
        newFilters.offset = 0
      }
      
      // При изменении страницы пересчитываем offset
      if (key === 'page') {
        newFilters.offset = (value - 1) * prev.limit
      }
      
      return newFilters
    })
  }

  const handleRefresh = () => {
    refetch()
    refetchStats()
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
      export_custom: 'secondary',
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
      export_custom: 'Экспорт',
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
      old_account: 'primary',
      profile: 'info',
      proxy: 'warning',
      phone: 'success',
      project: 'dark',
    }
    
    const entityLabels = {
      account: 'Аккаунт',
      old_account: 'Аккаунт',
      profile: 'Профиль',
      proxy: 'Прокси',
      phone: 'Устройство',
      project: 'Проект',
    }
    
    const entityIcons = {
      account: cilPeople,
      old_account: cilPeople,
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

  // Рендер пагинации
  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null

    const { page, pages, hasNext, hasPrev } = pagination
    const items = []

    // Кнопка "Предыдущая"
    items.push(
      <CPaginationItem
        key="prev"
        disabled={!hasPrev}
        onClick={() => handleFilterChange('page', page - 1)}
      >
        Предыдущая
      </CPaginationItem>
    )

    // Первая страница
    if (pages > 0) {
      items.push(
        <CPaginationItem
          key={1}
          active={page === 1}
          onClick={() => handleFilterChange('page', 1)}
        >
          1
        </CPaginationItem>
      )
    }

    // Точки слева
    if (page > 3) {
      items.push(
        <CPaginationItem key="dots1" disabled>
          ...
        </CPaginationItem>
      )
    }

    // Страницы вокруг текущей
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      items.push(
        <CPaginationItem
          key={i}
          active={i === page}
          onClick={() => handleFilterChange('page', i)}
        >
          {i}
        </CPaginationItem>
      )
    }

    // Точки справа
    if (page < pages - 2) {
      items.push(
        <CPaginationItem key="dots2" disabled>
          ...
        </CPaginationItem>
      )
    }

    // Последняя страница
    if (pages > 1) {
      items.push(
        <CPaginationItem
          key={pages}
          active={page === pages}
          onClick={() => handleFilterChange('page', pages)}
        >
          {pages}
        </CPaginationItem>
      )
    }

    // Кнопка "Следующая"
    items.push(
      <CPaginationItem
        key="next"
        disabled={!hasNext}
        onClick={() => handleFilterChange('page', page + 1)}
      >
        Следующая
      </CPaginationItem>
    )

    return (
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted">
          Страница {page} из {pages} • Показано {activities.length} записей
        </div>
        <CPagination className="mb-0">
          {items}
        </CPagination>
      </div>
    )
  }

  // Функция для безопасного получения значений статистики
  const getStatValue = (statPath, defaultValue = 0) => {
    if (!stats) return defaultValue
    
    try {
      const keys = statPath.split('.')
      let value = stats
      
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key]
        } else {
          return defaultValue
        }
      }
      
      return typeof value === 'number' ? value : defaultValue
    } catch (e) {
      return defaultValue
    }
  }

  // Показываем ошибки, если есть
  if (error || statsError) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="danger">
            <h4>Ошибка загрузки данных активности</h4>
            {error && <div><strong>Активность:</strong> {error.message}</div>}
            {statsError && <div><strong>Статистика:</strong> {statsError.message}</div>}
            <CButton color="primary" onClick={handleRefresh} className="mt-3">
              Попробовать снова
            </CButton>
          </CAlert>
        </CCol>
      </CRow>
    )
  }

  return (
    <>
      {/* Статистика за неделю */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={getStatValue('totalCount')}
            title="Всего действий за неделю"
            action={
              <CIcon icon={cilChart} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={getStatValue('todayCount')}
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
            value={stats?.entityStats?.find(e => e.entityType === 'account' || e.entityType === 'old_account')?.count || 0}
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
            value={stats?.entityStats?.find(e => e.entityType === 'phone')?.count || 0}
            title="Действия с устройствами"
            action={
              <CIcon icon={cilDevices} height={24} className="my-4 text-white" />
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
                  <h4 className="mb-0">Журнал активности</h4>
                  <small className="text-muted">
                    Последние действия в системе
                  </small>
                </CCol>
                <CCol sm={6} className="d-flex justify-content-end">
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading || statsLoading}
                  >
                    <CIcon icon={cilReload} className={(isLoading || statsLoading) ? 'fa-spin' : ''} />
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
                    <option value="status_toggle">Смена статуса</option>
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

              {/* Индикатор загрузки статистики */}
              {statsLoading && (
                <CRow className="mb-3">
                  <CCol xs={12}>
                    <CAlert color="info" className="mb-0">
                      <CSpinner size="sm" className="me-2" />
                      Загрузка статистики...
                    </CAlert>
                  </CCol>
                </CRow>
              )}

              {/* Таблица активности */}
              {isLoading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" size="lg" />
                  <div className="mt-3 text-muted">Загрузка данных...</div>
                </div>
              ) : (
                <>
                  <CTable align="middle" className="mb-0 border" hover responsive striped>
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
                          <CTableDataCell colSpan={5} className="text-center py-5">
                            <div className="text-muted mb-2">
                              <CIcon icon={cilChart} size="xl" className="mb-3" />
                              <div>Нет активности для отображения</div>
                            </div>
                            <div className="small text-muted">
                              Попробуйте выполнить какие-либо действия в системе
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        activities.map((activity, index) => (
                          <CTableRow key={`${activity.id || index}-${index}`} className="align-middle">
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
                              <div className="text-wrap">
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

                  {/* Пагинация */}
                  {renderPagination()}
                </>
              )}

              {/* Информация о загрузке */}
              {activities && activities.length > 0 && (
                <div className="mt-3 text-center">
                  <small className="text-muted">
                    Автоматическое обновление каждые 30 секунд
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