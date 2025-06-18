// frontend/src/views/dashboard/Dashboard.js
import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CWidgetStatsA,
  CSpinner,
  CAlert,
  CProgress,
  CBadge,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilUser,
  cilGlobeAlt,
  cilDevices,
  cilChart,
  cilFolder,
  cilReload,
  cilSpeedometer,
} from '@coreui/icons'
import { useAccountsStats } from '../../hooks/useAccounts'
import { useProxiesStats } from '../../hooks/useProxies'
import { usePhonesStats } from '../../hooks/usePhones'
import { useProjectsStats } from '../../hooks/useProjects'

const Dashboard = () => {
  const { data: accountsStats, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAccountsStats()
  const { data: proxiesStats, isLoading: proxiesLoading, error: proxiesError, refetch: refetchProxies } = useProxiesStats()
  const { data: phonesStats, isLoading: phonesLoading, error: phonesError, refetch: refetchPhones } = usePhonesStats()
  const { data: projectsStats, isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjectsStats()

  const isLoading = accountsLoading || proxiesLoading || phonesLoading || projectsLoading
  const hasError = accountsError || proxiesError || phonesError || projectsError

  const handleRefreshAll = () => {
    refetchAccounts?.()
    refetchProxies?.()
    refetchPhones?.()
    refetchProjects?.()
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        <div className="mt-3 text-body-secondary">Загрузка статистики...</div>
      </div>
    )
  }

  if (hasError) {
    return (
      <CAlert color="danger" className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Ошибка загрузки данных:</strong>
          <div className="mt-1">
            {accountsError?.message || proxiesError?.message || phonesError?.message || projectsError?.message}
          </div>
        </div>
        <CButton color="danger" variant="outline" onClick={handleRefreshAll}>
          <CIcon icon={cilReload} className="me-2" />
          Попробовать снова
        </CButton>
      </CAlert>
    )
  }

  // Вычисляем общую статистику
  const totalResources = (accountsStats?.total || 0) + (proxiesStats?.total || 0) + (phonesStats?.total || 0)
  const activeResources = (accountsStats?.byStatus?.active || 0) + (proxiesStats?.byStatus?.free || 0) + (phonesStats?.byStatus?.free || 0)
  const busyResources = (accountsStats?.byStatus?.working || 0) + (proxiesStats?.byStatus?.busy || 0) + (phonesStats?.byStatus?.busy || 0)

  return (
    <>
      {/* Заголовок с кнопкой обновления */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Панель управления</h1>
          <p className="text-body-secondary mb-0">Общая статистика и мониторинг системы</p>
        </div>
        <CButton 
          color="primary" 
          variant="outline" 
          onClick={handleRefreshAll}
          disabled={isLoading}
        >
          <CIcon icon={cilReload} className="me-2" />
          Обновить
        </CButton>
      </div>

      {/* Главные метрики */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={accountsStats?.total || 0}
            title="Всего аккаунтов"
            action={
              <CIcon icon={cilPeople} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={proxiesStats?.total || 0}
            title="Всего прокси"
            action={
              <CIcon icon={cilGlobeAlt} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="info"
            value={phonesStats?.total || 0}
            title="Всего телефонов"
            action={
              <CIcon icon={cilDevices} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value={projectsStats?.total || 0}
            title="Всего проектов"
            action={
              <CIcon icon={cilFolder} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
      </CRow>

      {/* Дополнительные метрики */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="text-center">
            <CCardBody>
              <div className="text-body-secondary small text-uppercase fw-semibold">Общий ресурсы</div>
              <div className="fs-2 fw-semibold text-primary">{totalResources}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-center">
            <CCardBody>
              <div className="text-body-secondary small text-uppercase fw-semibold">Активные ресурсы</div>
              <div className="fs-2 fw-semibold text-success">{activeResources}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-center">
            <CCardBody>
              <div className="text-body-secondary small text-uppercase fw-semibold">В работе</div>
              <div className="fs-2 fw-semibold text-warning">{busyResources}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-center">
            <CCardBody>
              <div className="text-body-secondary small text-uppercase fw-semibold">Загрузка системы</div>
              <div className="fs-2 fw-semibold text-info">
                {totalResources > 0 ? Math.round((busyResources / totalResources) * 100) : 0}%
              </div>
              <CProgress 
                className="mt-2" 
                value={totalResources > 0 ? (busyResources / totalResources) * 100 : 0} 
                color="info"
                height={8}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Детальная статистика */}
      <CRow>
        <CCol md={6} lg={3}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Аккаунты</strong>
              <CIcon icon={cilPeople} className="text-primary" />
            </CCardHeader>
            <CCardBody>
              {accountsStats?.byStatus ? (
                <div className="vstack gap-2">
                  {Object.entries(accountsStats.byStatus).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <CBadge 
                          color={
                            status === 'active' ? 'success' :
                            status === 'working' ? 'warning' :
                            status === 'banned' ? 'danger' : 'secondary'
                          }
                          shape="rounded-pill" 
                          className="me-2"
                        >
                          {count}
                        </CBadge>
                        <span className="text-capitalize small">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-3">Нет данных</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6} lg={3}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Прокси</strong>
              <CIcon icon={cilGlobeAlt} className="text-success" />
            </CCardHeader>
            <CCardBody>
              {proxiesStats?.byStatus ? (
                <div className="vstack gap-2">
                  {Object.entries(proxiesStats.byStatus).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <CBadge 
                          color={
                            status === 'free' ? 'success' :
                            status === 'busy' ? 'warning' :
                            status === 'banned' ? 'danger' : 'secondary'
                          }
                          shape="rounded-pill" 
                          className="me-2"
                        >
                          {count}
                        </CBadge>
                        <span className="text-capitalize small">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-3">Нет данных</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6} lg={3}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Телефоны</strong>
              <CIcon icon={cilDevices} className="text-info" />
            </CCardHeader>
            <CCardBody>
              {phonesStats?.byStatus ? (
                <div className="vstack gap-2">
                  {Object.entries(phonesStats.byStatus).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <CBadge 
                          color={
                            status === 'free' ? 'success' :
                            status === 'busy' ? 'warning' :
                            status === 'offline' ? 'danger' : 'secondary'
                          }
                          shape="rounded-pill" 
                          className="me-2"
                        >
                          {count}
                        </CBadge>
                        <span className="text-capitalize small">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-3">Нет данных</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6} lg={3}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Проекты</strong>
              <CIcon icon={cilFolder} className="text-warning" />
            </CCardHeader>
            <CCardBody>
              {projectsStats?.topProjects ? (
                <div className="vstack gap-2">
                  {projectsStats.topProjects.slice(0, 5).map((project, index) => (
                    <div key={project.name} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <CBadge 
                          color="primary"
                          shape="rounded-pill" 
                          className="me-2"
                        >
                          {index + 1}
                        </CBadge>
                        <span className="small text-truncate" style={{ maxWidth: '120px' }}>
                          {project.name}
                        </span>
                      </div>
                      <small className="text-body-secondary">
                        {project.resourceCount || 0}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-center py-3">Нет данных</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Статистика по странам для прокси */}
      {proxiesStats?.byCountry && proxiesStats.byCountry.length > 0 && (
        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <strong>Прокси по странам</strong>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  {proxiesStats.byCountry.slice(0, 12).map(({ country, count }) => (
                    <CCol key={country} sm={6} md={4} lg={3} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center p-2 bg-body-secondary bg-opacity-10 rounded">
                        <span className="small">{country || 'Не указано'}</span>
                        <CBadge color="secondary">{count}</CBadge>
                      </div>
                    </CCol>
                  ))}
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Dashboard