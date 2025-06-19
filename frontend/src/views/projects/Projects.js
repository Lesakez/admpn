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
  CButtonGroup,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CProgress,
  CWidgetStatsA,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormCheck,
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
  cilOptions,
  cilCloudDownload,
} from '@coreui/icons'
import { useEntityList, useEntityCRUD, useEntityBulkOperations } from '../../hooks/useEntityCRUD'
import { projectsService } from '../../services/projectsService'
import { ProjectFormModal } from '../../components/forms'

const Projects = () => {
  const [filters, setFilters] = useState({ 
    page: 1, 
    limit: 20,
    search: '',
    sortBy: 'created_at', // ИСПРАВЛЕНО: используем snake_case как в БД
    sortOrder: 'DESC'
  })
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [selectedProjects, setSelectedProjects] = useState([])

  // Используем новые оптимизированные хуки
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useEntityList('projects', projectsService, filters, {
    keepPreviousData: true, // Сохраняем предыдущие данные при пагинации
    staleTime: 2 * 60 * 1000 // 2 минуты
  })

  const { 
    deleteMutation
  } = useEntityCRUD('projects', projectsService, {
    successMessages: {
      delete: 'Проект удален. Связанные ресурсы отвязаны.'
    }
  })

  const {
    bulkDeleteMutation,
    isBulkDeleting
  } = useEntityBulkOperations('projects', projectsService)

  // Мемоизируем вычисления для производительности
  const projects = useMemo(() => data?.projects || [], [data])
  const pagination = useMemo(() => data?.pagination || {}, [data])

  // Вычисляем общую статистику
  const totalStats = useMemo(() => {
    return projects.reduce((acc, project) => {
      if (project.stats) {
        acc.totalProxies += project.stats.proxies?.total || 0
        acc.freeProxies += project.stats.proxies?.free || 0
        acc.totalPhones += project.stats.phones?.total || 0
        acc.freePhones += project.stats.phones?.free || 0
        acc.totalProfiles += project.stats.profiles?.total || 0
        acc.activeProfiles += project.stats.profiles?.active || 0
      }
      return acc
    }, { 
      totalProxies: 0, 
      freeProxies: 0, 
      totalPhones: 0, 
      freePhones: 0,
      totalProfiles: 0,
      activeProfiles: 0
    })
  }, [projects])

  // Обработчики событий
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Сбрасываем страницу при изменении фильтров
    }))
  }

  const handleSearch = (value) => {
    // Debounce поиска
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      handleFilterChange('search', value)
    }, 300)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Удалить проект? Все связанные ресурсы будут отвязаны.')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        // Ошибка уже обработана в хуке
        console.error('Delete error:', error)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) return
    
    if (window.confirm(`Удалить ${selectedProjects.length} проектов? Все связанные ресурсы будут отвязаны.`)) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedProjects)
        setSelectedProjects([])
      } catch (error) {
        console.error('Bulk delete error:', error)
      }
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

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  const getStatusBadge = (stats) => {
    const totalResources = (stats?.proxies?.total || 0) + (stats?.phones?.total || 0) + (stats?.profiles?.total || 0)
    if (totalResources === 0) return <CBadge color="secondary">Пустой</CBadge>
    if (totalResources < 10) return <CBadge color="warning">Малый</CBadge>
    if (totalResources < 50) return <CBadge color="info">Средний</CBadge>
    return <CBadge color="success">Большой</CBadge>
  }

  // Рендер состояния загрузки
  if (isLoading && !data) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner size="lg" />
      </div>
    )
  }

  // Рендер ошибки
  if (error) {
    return (
      <CAlert color="danger">
        <h4>Ошибка загрузки данных</h4>
        <p>{error.message}</p>
        <CButton color="outline-danger" onClick={() => refetch()}>
          <CIcon icon={cilReload} className="me-2" />
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
              <CRow className="align-items-center">
                <CCol sm={6}>
                  <h4 className="mb-0">Проекты</h4>
                  <small className="text-muted">
                    Всего: {pagination.total || 0}
                    {selectedProjects.length > 0 && (
                      <span className="ms-2">
                        | Выбрано: {selectedProjects.length}
                      </span>
                    )}
                  </small>
                </CCol>
                <CCol sm={6} className="d-flex justify-content-end gap-2">
                  {/* Поиск */}
                  <CInputGroup style={{ maxWidth: '300px' }}>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск проектов..."
                      defaultValue={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </CInputGroup>

                  {/* Массовые операции */}
                  {selectedProjects.length > 0 && (
                    <CDropdown>
                      <CDropdownToggle color="secondary" variant="outline">
                        <CIcon icon={cilOptions} className="me-2" />
                        Действия ({selectedProjects.length})
                      </CDropdownToggle>
                      <CDropdownMenu>
                        <CDropdownItem 
                          onClick={handleBulkDelete}
                          disabled={isBulkDeleting}
                        >
                          <CIcon icon={cilTrash} className="me-2" />
                          Удалить выбранные
                        </CDropdownItem>
                      </CDropdownMenu>
                    </CDropdown>
                  )}

                  {/* Основные действия */}
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
                      <CIcon 
                        icon={cilReload} 
                        className={isLoading ? 'fa-spin me-2' : 'me-2'} 
                      />
                      Обновить
                    </CButton>
                  </CButtonGroup>
                </CCol>
              </CRow>
            </CCardHeader>

            <CCardBody className="p-0">
              {projects.length === 0 ? (
                <div className="text-center py-5">
                  <CIcon icon={cilFolder} size="3xl" className="text-muted mb-3" />
                  <h5 className="text-muted">Проекты не найдены</h5>
                  <p className="text-muted mb-4">
                    {filters.search ? 
                      'Попробуйте изменить критерии поиска' : 
                      'Создайте первый проект для начала работы'
                    }
                  </p>
                  {!filters.search && (
                    <CButton color="primary" onClick={handleCreate}>
                      <CIcon icon={cilPlus} className="me-2" />
                      Создать первый проект
                    </CButton>
                  )}
                </div>
              ) : (
                <>
                  <CTable hover responsive striped>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: '50px' }}>
                          <CFormCheck
                            checked={selectedProjects.length === projects.length && projects.length > 0}
                            indeterminate={selectedProjects.length > 0 && selectedProjects.length < projects.length}
                            onChange={handleSelectAll}
                          />
                        </CTableHeaderCell>
                        <CTableHeaderCell>Название</CTableHeaderCell>
                        <CTableHeaderCell>Описание</CTableHeaderCell>
                        <CTableHeaderCell>Статус</CTableHeaderCell>
                        <CTableHeaderCell>Прокси</CTableHeaderCell>
                        <CTableHeaderCell>Устройства</CTableHeaderCell>
                        <CTableHeaderCell>Профили</CTableHeaderCell>
                        <CTableHeaderCell>Создан</CTableHeaderCell>
                        <CTableHeaderCell style={{ width: '120px' }}>Действия</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {projects.map((project) => (
                        <CTableRow key={project.id}>
                          <CTableDataCell>
                            <CFormCheck
                              checked={selectedProjects.includes(project.id)}
                              onChange={() => handleSelectProject(project.id)}
                            />
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{project.name}</div>
                            <small className="text-muted">ID: {project.id}</small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div style={{ maxWidth: '200px' }} className="text-truncate">
                              {project.description || <span className="text-muted">Без описания</span>}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            {getStatusBadge(project.stats)}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {project.stats?.proxies?.total || 0}
                              </span>
                              {(project.stats?.proxies?.total || 0) > 0 && (
                                <CProgress
                                  value={((project.stats?.proxies?.free || 0) / project.stats.proxies.total) * 100}
                                  height={4}
                                  className="flex-grow-1"
                                  color="success"
                                />
                              )}
                            </div>
                            <small className="text-muted">
                              Свободно: {project.stats?.proxies?.free || 0}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {project.stats?.phones?.total || 0}
                              </span>
                              {(project.stats?.phones?.total || 0) > 0 && (
                                <CProgress
                                  value={((project.stats?.phones?.free || 0) / project.stats.phones.total) * 100}
                                  height={4}
                                  className="flex-grow-1"
                                  color="info"
                                />
                              )}
                            </div>
                            <small className="text-muted">
                              Свободно: {project.stats?.phones?.free || 0}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {project.stats?.profiles?.total || 0}
                              </span>
                              {(project.stats?.profiles?.total || 0) > 0 && (
                                <CProgress
                                  value={((project.stats?.profiles?.active || 0) / project.stats.profiles.total) * 100}
                                  height={4}
                                  className="flex-grow-1"
                                  color="warning"
                                />
                              )}
                            </div>
                            <small className="text-muted">
                              Активно: {project.stats?.profiles?.active || 0}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{new Date(project.createdAt).toLocaleDateString()}</div>
                            <small className="text-muted">
                              {new Date(project.createdAt).toLocaleTimeString()}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CButtonGroup size="sm">
                              <CButton
                                color="info"
                                variant="outline"
                                onClick={() => handleEdit(project)}
                                disabled={deleteMutation.isLoading}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                variant="outline"
                                onClick={() => handleDelete(project.id)}
                                disabled={deleteMutation.isLoading}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CButtonGroup>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>

                  {/* Пагинация */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center p-3">
                      <div>
                        <small className="text-muted">
                          Показано {projects.length} из {pagination.total} записей
                        </small>
                      </div>
                      <CPagination>
                        <CPaginationItem
                          disabled={pagination.page <= 1}
                          onClick={() => handleFilterChange('page', pagination.page - 1)}
                        >
                          Предыдущая
                        </CPaginationItem>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, pagination.page - 2) + i
                          if (pageNum > pagination.totalPages) return null
                          
                          return (
                            <CPaginationItem
                              key={pageNum}
                              active={pageNum === pagination.page}
                              onClick={() => handleFilterChange('page', pageNum)}
                            >
                              {pageNum}
                            </CPaginationItem>
                          )
                        })}
                        
                        <CPaginationItem
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => handleFilterChange('page', pagination.page + 1)}
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
      {showModal && (
        <ProjectFormModal
          visible={showModal}
          onClose={handleCloseModal}
          project={editingProject}
          isEdit={!!editingProject}
        />
      )}
    </>
  )
}

export default Projects