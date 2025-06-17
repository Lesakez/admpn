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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilUser,
  cilGlobeAlt,
  cilDevices,
} from '@coreui/icons'
import { useAccountsStats } from '../../hooks/useAccounts'
import { useProxiesStats } from '../../hooks/useProxies'

const Dashboard = () => {
  const { data: accountsStats, isLoading: accountsLoading, error: accountsError } = useAccountsStats()
  const { data: proxiesStats, isLoading: proxiesLoading, error: proxiesError } = useProxiesStats()

  if (accountsLoading || proxiesLoading) {
    return (
      <div className="text-center">
        <CSpinner color="primary" />
        <div className="mt-2">Загрузка статистики...</div>
      </div>
    )
  }

  if (accountsError || proxiesError) {
    return (
      <CAlert color="danger">
        Ошибка загрузки данных: {accountsError?.message || proxiesError?.message}
      </CAlert>
    )
  }

  return (
    <>
      <CRow>
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
            color="info"
            value={accountsStats?.byStatus?.active || 0}
            title="Активные аккаунты"
            action={
              <CIcon icon={cilUser} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
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
            color="success"
            value={proxiesStats?.byStatus?.free || 0}
            title="Свободные прокси"
            action={
              <CIcon icon={cilDevices} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Статистика аккаунтов по статусам</strong>
            </CCardHeader>
            <CCardBody>
              {accountsStats?.byStatus ? (
                <div>
                  {Object.entries(accountsStats.byStatus).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between py-2">
                      <span className="text-capitalize">{status}:</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">Нет данных</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Статистика прокси</strong>
            </CCardHeader>
            <CCardBody>
              {proxiesStats?.byStatus ? (
                <div>
                  {Object.entries(proxiesStats.byStatus).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between py-2">
                      <span className="text-capitalize">{status}:</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">Нет данных</div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {proxiesStats?.byCountry && (
        <CRow>
          <CCol xs>
            <CCard className="mb-4">
              <CCardHeader>
                <strong>Прокси по странам</strong>
              </CCardHeader>
              <CCardBody>
                {proxiesStats.byCountry.map(({ country, count }) => (
                  <div key={country} className="d-flex justify-content-between py-2">
                    <span>{country || 'Не указано'}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Dashboard