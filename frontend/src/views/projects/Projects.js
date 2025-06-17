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
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CProgress,
  CWidgetStatsA,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilChart,
  cilFolder,
  cilDevices,
  cilGlobeAlt,
} from '@coreui/icons'
import { useProjects, useDeleteProject } from '../../hooks/useProjects'
import { ProjectFormModal } from '../../components/forms'

const Projects = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  // Загрузка данных
  const { data, isLoading, error, refetch } = useProjects(filters)
  const deleteMutation = useDeleteProject()

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
    if (window.confirm('Удалить проект? Все связанные ресурсы будут отвязаны.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingProject(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProject(null)
  }

  const projects = data?.projects || []
  const pagination = data?.pagination || {}

  // Считаем общую статистику
  const totalStats = projects.reduce((acc, project) => {
    if (project.stats) {
      acc.totalProxies += project.stats.proxies?.total || 0
      acc.freeProxies += project.stats.proxies?.free || 0
      acc.totalPhones += project.stats.phones?.total || 0
      acc.freePhones += project.stats.phones?.free || 0
    }
    return acc
  }, { totalProxies: 0, freeProxies: 0, totalPhones: 0, freePhones: 0 })

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
      {/* Общая статистика */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={projects.length}
            title="Всего проектов"
            action={
              <CIcon icon={cilFolder} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="info"
            value={totalStats.totalProxies}
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
            value={totalStats.freeProxies}
            title="Свободных прокси"
            action={
              <CIcon icon={cilGlobeAlt} height={24} className="my-4 text-white" />
            }
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value={totalStats.totalPhones}
            title="Всего устройств"
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
                  <h4 className="mb-0">Проекты</h4>
                  <small className="text-muted">
                    Всего: {pagination.total || 0}
                  </small>
                </CCol>
                <CCol sm={6} className="d-flex justify-content-end">
                  <CButtonGroup>
                    <CButton 
                      color="primary" 
                      onClick={handleCreate}
                    >
                      <CIcon icon={cilPlus} className="me-2" />
                      Создать проект
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <CIcon icon={cilReload} className={isLoading ? 'fa-spin' : ''} />
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody>
              {/* Фильтры */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск по названию проекта..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <label className="form-label text-muted small">На странице:</label>
                  <select
                    className="form-select"
                    value={filters.limit || 20}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
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
                        <CTableHeaderCell>Название</CTableHeaderCell>
                        <CTableHeaderCell>Описание</CTableHeaderCell>
                        <CTableHeaderCell>Прокси</CTableHeaderCell>
                        <CTableHeaderCell>Устройства</CTableHeaderCell>
                        <CTableHeaderCell>Создан</CTableHeaderCell>
                        <CTableHeaderCell>Действия</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {projects.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={7} className="text-center">
                            Нет проектов для отображения
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        projects.map((project) => (
                          <CTableRow key={project.id}>
                            <CTableDataCell>
                              <strong>{project.id}</strong>
                            </CTableDataCell>
                            <CTableDataCell>
                              <div>
                                <strong>{project.name}</strong>
                                {project.transliterateName && (
                                  <div className="text-muted small">
                                    {project.transliterateName}
                                  </div>
                                )}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              <div 
                                className="text-truncate" 
                                style={{ maxWidth: '200px' }}
                                title={project.description}
                              >
                                {project.description || 'Без описания'}
                              </div>
                            </CTableDataCell>
                            <CTableDataCell>
                              {project.stats?.proxies ? (
                                <div>
                                  <CBadge color="primary" className="me-1">
                                    {project.stats.proxies.total}
                                  </CBadge>
                                  <CBadge color="success" className="me-1">
                                    {project.stats.proxies.free} свободных
                                  </CBadge>
                                  <CBadge color="warning">
                                    {project.stats.proxies.busy} занятых
                                  </CBadge>
                                  {project.stats.proxies.total > 0 && (
                                    <CProgress 
                                      thin 
                                      color="success" 
                                      value={(project.stats.proxies.free / project.stats.proxies.total) * 100}
                                      className="mt-1"
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">Нет данных</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {project.stats?.phones ? (
                                <div>
                                  <CBadge color="primary" className="me-1">
                                    {project.stats.phones.total}
                                  </CBadge>
                                  <CBadge color="success" className="me-1">
                                    {project.stats.phones.free} свободных
                                  </CBadge>
                                  <CBadge color="warning">
                                    {project.stats.phones.busy} занятых
                                  </CBadge>
                                  {project.stats.phones.total > 0 && (
                                    <CProgress 
                                      thin 
                                      color="success" 
                                      value={(project.stats.phones.free / project.stats.phones.total) * 100}
                                      className="mt-1"
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">Нет данных</span>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {project.createdAt ? 
                                new Date(project.createdAt).toLocaleDateString('ru-RU') : 
                                'N/A'
                              }
                            </CTableDataCell>
                            <CTableDataCell>
                              <CButtonGroup size="sm">
                                <CButton
                                  color="info"
                                  variant="outline"
                                  onClick={() => handleEdit(project)}
                                  title="Редактировать"
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color="warning"
                                  variant="outline"
                                  title="Статистика"
                                >
                                  <CIcon icon={cilChart} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  onClick={() => handleDelete(project.id)}
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
                        Показано {projects.length} из {pagination.total} записей
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
      <ProjectFormModal
        visible={showModal}
        onClose={handleCloseModal}
        project={editingProject}
        isEdit={!!editingProject}
      />
    </>
  )
}

export default Projects