// frontend/src/views/projects/Projects.js

import React, { useState, useMemo, useCallback } from 'react'
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
  CWidgetStatsA,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormCheck,
  CTooltip,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
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
  cilWarning
} from '@coreui/icons'
// ИСПРАВЛЕНО: Используем отдельные хуки вместо несуществующего useEntityManager
import { useEntityList, useEntityCRUD } from '../../hooks/useEntityCRUD'
import { projectsService } from '../../services/projectsService'
import { ProjectFormModal } from '../../components/forms'

const Projects = () => {
  // Состояние фильтров
  const [filters, setFilters] = useState({ 
    page: 1, 
    limit: 20,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  })

  // Состояние модальных окон
  const [modals, setModals] = useState({
    form: { visible: false, project: null },
    delete: { visible: false, project: null },
    bulkDelete: { visible: false, selectedIds: [] }
  })

  // Выбранные проекты для массовых операций
  const [selectedProjects, setSelectedProjects] = useState([])

  // ИСПРАВЛЕНО: Используем только существующие хуки
  const {
    data: listData,
    isLoading: isLoadingList,
    error: listError,
    refetch
  } = useEntityList('projects', projectsService, filters, {
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000
  })

  const {
    create,
    update,
    delete: deleteProject,
    isCreating,
    isUpdating,
    isDeleting
  } = useEntityCRUD('projects', projectsService, {
    successMessages: {
      create: 'Проект успешно создан',
      update: 'Проект успешно обновлен',
      delete: 'Проект удален'
    }
  })

  // ВРЕМЕННО: Заглушка для массового удаления пока не исправим хуки
  const bulkDelete = async (ids) => {
    console.log('Bulk delete:', ids)
    // TODO: Реализовать массовое удаление
  }
  const isBulkDeleting = false

  // ИСПРАВЛЕНО: Безопасное извлечение данных
  const projects = useMemo(() => {
    if (!listData) return []
    
    // Проверяем разные возможные структуры ответа
    if (Array.isArray(listData)) return listData
    if (listData.data && Array.isArray(listData.data)) return listData.data
    if (listData.projects && Array.isArray(listData.projects)) return listData.projects
    
    return []
  }, [listData])

  const pagination = useMemo(() => {
    if (!listData) return { total: 0, page: 1, pages: 0, hasNext: false, hasPrev: false }
    
    if (listData.pagination) return listData.pagination
    if (listData.data?.pagination) return listData.data.pagination
    
    return { total: 0, page: 1, pages: 0, hasNext: false, hasPrev: false }
  }, [listData])

  // Обработчики модальных окон
  const openModal = useCallback((type, data = {}) => {
    setModals(prev => ({
      ...prev,
      [type]: { visible: true, ...data }
    }))
  }, [])

  const closeModal = useCallback((type) => {
    setModals(prev => ({
      ...prev,
      [type]: { visible: false, project: null, selectedIds: [] }
    }))
  }, [])

  // Обработчики фильтров
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Сбрасываем страницу при изменении фильтров
    }))
  }, [])

  const handleSearch = useCallback((value) => {
    handleFilterChange('search', value)
  }, [handleFilterChange])

  const handleSort = useCallback((field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1
    }))
  }, [])

  // Обработчики выбора проектов
  const handleSelectProject = useCallback((projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedProjects(prev => 
      prev.length === projects.length ? [] : projects.map(p => p.id)
    )
  }, [projects])

  // Обработчики CRUD операций
  const handleCreateProject = useCallback(async (data) => {
    try {
      await create(data)
      closeModal('form')
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }, [create, closeModal])

  const handleUpdateProject = useCallback(async (id, data) => {
    try {
      await update({ id, data })
      closeModal('form')
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }, [update, closeModal])

  const handleDeleteProject = useCallback(async () => {
    if (!modals.delete.project) return
    
    try {
      await deleteProject(modals.delete.project.id)
      closeModal('delete')
      setSelectedProjects(prev => prev.filter(id => id !== modals.delete.project.id))
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }, [deleteProject, modals.delete.project, closeModal])

  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDelete(selectedProjects)
      closeModal('bulkDelete')
      setSelectedProjects([])
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }, [bulkDelete, selectedProjects, closeModal])

  // ИСПРАВЛЕНО: Упрощаем статистику без отдельного API запроса
  const totalStats = useMemo(() => {
    return projects.reduce((acc, project) => {
      if (project.stats) {
        acc.totalProxies += project.stats.proxies?.total || 0
        acc.totalPhones += project.stats.phones?.total || 0
        acc.totalProfiles += project.stats.profiles?.total || 0
      }
      return acc
    }, { totalProxies: 0, totalPhones: 0, totalProfiles: 0 })
  }, [projects])

  const sortIcon = useMemo(() => {
    return filters.sortOrder === 'ASC' ? '↑' : '↓'
  }, [filters.sortOrder])

  const isAllSelected = useMemo(() => {
    return projects.length > 0 && selectedProjects.length === projects.length
  }, [projects.length, selectedProjects.length])

  const isPartiallySelected = useMemo(() => {
    return selectedProjects.length > 0 && selectedProjects.length < projects.length
  }, [selectedProjects.length, projects.length])

  // Рендер статусных бейджей
  const renderStatusBadge = useCallback((status, count, variant) => (
    <CBadge color={variant} className="me-1">
      {status}: {count}
    </CBadge>
  ), [])

  // Рендер пагинации
  const renderPagination = useMemo(() => {
    if (!pagination || pagination.pages <= 1) return null

    const items = []
    const { page, pages } = pagination

    // Первая страница
    if (pages > 0) {
      items.push(
        <CPaginationItem
          key="first"
          disabled={page === 1}
          onClick={() => handleFilterChange('page', 1)}
        >
          1
        </CPaginationItem>
      )
    }

    // Предыдущие страницы
    if (page > 3) {
      items.push(<CPaginationItem key="dots1" disabled>...</CPaginationItem>)
    }

    // Текущая и соседние страницы
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

    // Следующие страницы
    if (page < pages - 2) {
      items.push(<CPaginationItem key="dots2" disabled>...</CPaginationItem>)
    }

    // Последняя страница
    if (pages > 1) {
      items.push(
        <CPaginationItem
          key="last"
          active={page === pages}
          disabled={page === pages}
          onClick={() => handleFilterChange('page', pages)}
        >
          {pages}
        </CPaginationItem>
      )
    }

    return (
      <CPagination className="justify-content-center mt-3">
        <CPaginationItem
          disabled={page === 1}
          onClick={() => handleFilterChange('page', page - 1)}
        >
          Назад
        </CPaginationItem>
        {items}
        <CPaginationItem
          disabled={page === pages}
          onClick={() => handleFilterChange('page', page + 1)}
        >
          Вперед
        </CPaginationItem>
      </CPagination>
    )
  }, [pagination, handleFilterChange])

  return (
    <>
      <CRow>
        {/* Виджеты статистики */}
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={pagination?.total || 0}
            title="Всего проектов"
            chart={<CIcon icon={cilFolder} height={52} />}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="info"
            value={totalStats.totalProxies}
            title="Всего прокси"
            chart={<CIcon icon={cilGlobeAlt} height={52} />}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value={totalStats.totalPhones}
            title="Всего телефонов"
            chart={<CIcon icon={cilDevices} height={52} />}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={totalStats.totalProfiles}
            title="Всего профилей"
            chart={<CIcon icon={cilChart} height={52} />}
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Проекты</h4>
                
                <div className="d-flex gap-2">
                  {/* Поиск */}
                  <CInputGroup style={{ width: '300px' }}>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск проектов..."
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </CInputGroup>

                  {/* Массовые действия */}
                  {selectedProjects.length > 0 && (
                    <CButtonGroup>
                      <CTooltip content="Удалить выбранные">
                        <CButton
                          color="danger"
                          variant="outline"
                          onClick={() => openModal('bulkDelete', { selectedIds: selectedProjects })}
                          disabled={isBulkDeleting}
                        >
                          <CIcon icon={cilTrash} size="sm" />
                          {selectedProjects.length}
                        </CButton>
                      </CTooltip>
                    </CButtonGroup>
                  )}

                  {/* Кнопки управления */}
                  <CButton
                    color="primary"
                    onClick={() => openModal('form')}
                    disabled={isCreating}
                  >
                    <CIcon icon={cilPlus} size="sm" className="me-1" />
                    Создать проект
                  </CButton>

                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={refetch}
                    disabled={isLoadingList}
                  >
                    <CIcon icon={cilReload} size="sm" />
                  </CButton>
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Ошибки */}
              {listError && (
                <CAlert color="danger" className="mb-3">
                  <CIcon icon={cilWarning} className="me-2" />
                  Ошибка загрузки: {listError.message}
                </CAlert>
              )}

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '50px' }}>
                      <CFormCheck
                        checked={isAllSelected}
                        indeterminate={isPartiallySelected}
                        onChange={handleSelectAll}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      Название {filters.sortBy === 'name' && sortIcon}
                    </CTableHeaderCell>
                    <CTableHeaderCell>Описание</CTableHeaderCell>
                    <CTableHeaderCell>Ресурсы</CTableHeaderCell>
                    <CTableHeaderCell 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('created_at')}
                    >
                      Создан {filters.sortBy === 'created_at' && sortIcon}
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '120px' }}>Действия</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {isLoadingList ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center py-4">
                        <CSpinner />
                        <div className="mt-2">Загрузка проектов...</div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : projects.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center py-4 text-muted">
                        {filters.search ? 'Проекты не найдены' : 'Нет проектов'}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    projects.map((project) => (
                      <CTableRow key={project.id}>
                        <CTableDataCell>
                          <CFormCheck
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => handleSelectProject(project.id)}
                          />
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
                          {project.description ? (
                            <span title={project.description}>
                              {project.description.length > 50
                                ? `${project.description.substring(0, 50)}...`
                                : project.description
                              }
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {project.stats ? (
                            <div>
                              {renderStatusBadge('Прокси', project.stats.proxies?.total || 0, 'info')}
                              {renderStatusBadge('Телефоны', project.stats.phones?.total || 0, 'warning')}
                              {renderStatusBadge('Профили', project.stats.profiles?.total || 0, 'success')}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <small className="text-muted">
                            {project.createdAt ? 
                              new Date(project.createdAt).toLocaleDateString('ru-RU') : 
                              '-'
                            }
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CTooltip content="Редактировать">
                              <CButton
                                color="primary"
                                variant="outline"
                                onClick={() => openModal('form', { project })}
                                disabled={isUpdating}
                              >
                                <CIcon icon={cilPencil} size="sm" />
                              </CButton>
                            </CTooltip>
                            <CTooltip content="Удалить">
                              <CButton
                                color="danger"
                                variant="outline"
                                onClick={() => openModal('delete', { project })}
                                disabled={isDeleting}
                              >
                                <CIcon icon={cilTrash} size="sm" />
                              </CButton>
                            </CTooltip>
                          </CButtonGroup>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {/* Пагинация */}
              {renderPagination}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Модальное окно создания/редактирования */}
      <ProjectFormModal
        visible={modals.form.visible}
        onClose={() => closeModal('form')}
        project={modals.form.project}
        onSave={modals.form.project ? 
          (data) => handleUpdateProject(modals.form.project.id, data) : 
          handleCreateProject
        }
        isLoading={isCreating || isUpdating}
      />

      {/* Модальное окно подтверждения удаления */}
      <CModal
        visible={modals.delete.visible}
        onClose={() => closeModal('delete')}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Подтверждение удаления</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex align-items-center mb-3">
            <CIcon icon={cilWarning} className="text-warning me-2" size="lg" />
            <span>Вы уверены, что хотите удалить проект?</span>
          </div>
          {modals.delete.project && (
            <div className="bg-light p-3 rounded">
              <strong>{modals.delete.project.name}</strong>
              {modals.delete.project.description && (
                <div className="text-muted mt-1">
                  {modals.delete.project.description}
                </div>
              )}
            </div>
          )}
          <div className="mt-3 text-muted">
            <small>Все связанные ресурсы будут отвязаны от проекта.</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => closeModal('delete')}
            disabled={isDeleting}
          >
            Отмена
          </CButton>
          <CButton
            color="danger"
            onClick={handleDeleteProject}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <CSpinner size="sm" className="me-1" />
                Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Модальное окно массового удаления */}
      <CModal
        visible={modals.bulkDelete.visible}
        onClose={() => closeModal('bulkDelete')}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Массовое удаление</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex align-items-center mb-3">
            <CIcon icon={cilWarning} className="text-warning me-2" size="lg" />
            <span>
              Вы уверены, что хотите удалить {selectedProjects.length} 
              {selectedProjects.length === 1 ? ' проект' : 
               selectedProjects.length < 5 ? ' проекта' : ' проектов'}?
            </span>
          </div>
          <div className="text-muted">
            <small>Все связанные ресурсы будут отвязаны от проектов.</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => closeModal('bulkDelete')}
            disabled={isBulkDeleting}
          >
            Отмена
          </CButton>
          <CButton
            color="danger"
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? (
              <>
                <CSpinner size="sm" className="me-1" />
                Удаление...
              </>
            ) : (
              'Удалить все'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Projects