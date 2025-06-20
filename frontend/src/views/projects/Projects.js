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
  cilWarning
} from '@coreui/icons'
import { useEntityList, useEntityCRUD } from '../../hooks/useEntityCRUD'
import { projectsService } from '../../services/projectsService'
import ProjectFormModal from '../../components/forms/ProjectFormModal'

const Projects = () => {
  // Состояние фильтров
  const [filters, setFilters] = useState({ 
    page: 1, 
    limit: 20,
    search: '',
    sortBy: 'createdAt',
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

  // Загрузка данных
  const {
    data: rawData,
    isLoading,
    error,
    refetch
  } = useEntityList('projects', projectsService, filters, {
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000
  })

  // CRUD операции
  const {
    create,
    update,
    delete: deleteProject,
    bulkDelete,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkDeleting
  } = useEntityCRUD('projects', projectsService, {
    successMessages: {
      create: 'Проект успешно создан',
      update: 'Проект успешно обновлен', 
      delete: 'Проект удален',
      bulkDelete: 'Проекты удалены'
    }
  })

  // Обработка данных проектов
  const projects = useMemo(() => {
    if (!rawData) return []
    if (Array.isArray(rawData)) return rawData
    if (rawData.data && Array.isArray(rawData.data)) return rawData.data
    if (rawData.projects && Array.isArray(rawData.projects)) return rawData.projects
    return []
  }, [rawData])

  // Пагинация
  const pagination = useMemo(() => {
    if (rawData?.pagination) return rawData.pagination
    if (rawData?.data?.pagination) return rawData.data.pagination
    
    // Создаем пагинацию на основе массива
    if (Array.isArray(rawData)) {
      const total = rawData.length
      const pages = Math.ceil(total / filters.limit)
      return {
        page: filters.page,
        limit: filters.limit,
        total,
        pages,
        hasNext: filters.page < pages,
        hasPrev: filters.page > 1
      }
    }
    
    return { page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false }
  }, [rawData, filters.page, filters.limit])

  // Статистика
  const stats = useMemo(() => {
    if (!projects.length) {
      return { totalProxies: 0, totalPhones: 0, totalProfiles: 0 }
    }
    
    return projects.reduce((acc, project) => {
      if (project.stats) {
        acc.totalProxies += project.stats.proxies?.total || 0
        acc.totalPhones += project.stats.phones?.total || 0
        acc.totalProfiles += project.stats.profiles?.total || 0
      }
      return acc
    }, { totalProxies: 0, totalPhones: 0, totalProfiles: 0 })
  }, [projects])

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
      page: key !== 'page' ? 1 : value
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

  // Обработчики выбора
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

  // CRUD обработчики
  const handleCreate = useCallback(async (data) => {
    try {
      await create(data)
      closeModal('form')
    } catch (error) {
      console.error('Create error:', error)
    }
  }, [create, closeModal])

  const handleUpdate = useCallback(async (id, data) => {
    try {
      await update({ id, data })
      closeModal('form')
    } catch (error) {
      console.error('Update error:', error)
    }
  }, [update, closeModal])

  const handleDelete = useCallback(async () => {
    if (!modals.delete.project) return
    
    try {
      await deleteProject(modals.delete.project.id)
      closeModal('delete')
      setSelectedProjects(prev => prev.filter(id => id !== modals.delete.project.id))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }, [deleteProject, modals.delete.project, closeModal])

  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDelete(selectedProjects)
      closeModal('bulkDelete')
      setSelectedProjects([])
    } catch (error) {
      console.error('Bulk delete error:', error)
    }
  }, [bulkDelete, selectedProjects, closeModal])

  // Вычисляемые значения
  const sortIcon = filters.sortOrder === 'ASC' ? '↑' : '↓'
  const isAllSelected = projects.length > 0 && selectedProjects.length === projects.length
  const isPartiallySelected = selectedProjects.length > 0 && selectedProjects.length < projects.length

  // Рендер бейджа статистики
  const renderBadge = (label, count, color) => (
    <CBadge color={color} className="me-1">
      {label}: {count}
    </CBadge>
  )

  // Рендер пагинации
  const renderPagination = () => {
    if (!pagination || pagination.pages <= 1) return null

    const items = []
    const { page, pages } = pagination

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

    if (page > 3) {
      items.push(<CPaginationItem key="dots1" disabled>...</CPaginationItem>)
    }

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

    if (page < pages - 2) {
      items.push(<CPaginationItem key="dots2" disabled>...</CPaginationItem>)
    }

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
      <CPagination>
        <CPaginationItem
          disabled={page === 1}
          onClick={() => handleFilterChange('page', page - 1)}
        >
          Предыдущая
        </CPaginationItem>
        {items}
        <CPaginationItem
          disabled={page === pages}
          onClick={() => handleFilterChange('page', page + 1)}
        >
          Следующая
        </CPaginationItem>
      </CPagination>
    )
  }

  // Обработка ошибок
  if (error) {
    return (
      <CAlert color="danger">
        <h4>Ошибка загрузки проектов</h4>
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
          <CWidgetStatsA
            className="mb-4"
            color="primary"
            value={projects.length}
            title="Всего проектов"
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
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="info"
            value={stats.totalProxies}
            title="Всего прокси"
            action={<CIcon icon={cilGlobeAlt} />}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="warning"
            value={stats.totalPhones}
            title="Всего телефонов"
            action={<CIcon icon={cilDevices} />}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            className="mb-4"
            color="success"
            value={stats.totalProfiles}
            title="Всего профилей"
            action={<CIcon icon={cilChart} />}
          />
        </CCol>
      </CRow>

      {/* Основная карточка */}
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Проекты</h5>
              <small className="text-body-secondary">
                Управление проектами системы
              </small>
            </div>
            <div className="d-flex gap-2">
              {selectedProjects.length > 0 && (
                <CButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  onClick={() => openModal('bulkDelete', { selectedIds: selectedProjects })}
                  disabled={isBulkDeleting}
                >
                  <CIcon icon={cilTrash} className="me-1" />
                  Удалить ({selectedProjects.length})
                </CButton>
              )}
              <CButton
                color="primary"
                onClick={() => openModal('form')}
                disabled={isCreating}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Создать проект
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* Поиск и фильтры */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Поиск проектов..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={6} className="d-flex justify-content-end">
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <CIcon icon={cilReload} className="me-1" />
                Обновить
              </CButton>
            </CCol>
          </CRow>

          {/* Таблица */}
          {isLoading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <div className="mt-2">Загрузка проектов...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-4">
              <CIcon icon={cilFolder} size="xxl" className="text-body-tertiary mb-3" />
              <h5>Проекты не найдены</h5>
              <p className="text-body-secondary">
                {filters.search ? 'Попробуйте изменить параметры поиска' : 'Создайте первый проект'}
              </p>
            </div>
          ) : (
            <>
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '40px' }}>
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
                    <CTableHeaderCell>Статистика</CTableHeaderCell>
                    <CTableHeaderCell
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('createdAt')}
                    >
                      Создан {filters.sortBy === 'createdAt' && sortIcon}
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '100px' }}>Действия</CTableHeaderCell>
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
                        <div>
                          <strong>{project.name}</strong>
                          {project.transliterateName && (
                            <div className="text-body-secondary small">
                              {project.transliterateName}
                            </div>
                          )}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        {project.description || (
                          <span className="text-body-tertiary">Нет описания</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        {project.stats ? (
                          <div>
                            {renderBadge('Прокси', project.stats.proxies?.total || 0, 'primary')}
                            {renderBadge('Телефоны', project.stats.phones?.total || 0, 'info')}
                            {renderBadge('Профили', project.stats.profiles?.total || 0, 'success')}
                          </div>
                        ) : (
                          <span className="text-body-tertiary">Нет данных</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <small className="text-body-secondary">
                          {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                        </small>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButtonGroup size="sm">
                          <CTooltip content="Редактировать">
                            <CButton
                              color="primary"
                              variant="ghost"
                              onClick={() => openModal('form', { project })}
                              disabled={isUpdating}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </CTooltip>
                          <CTooltip content="Удалить">
                            <CButton
                              color="danger"
                              variant="ghost"
                              onClick={() => openModal('delete', { project })}
                              disabled={isDeleting}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTooltip>
                        </CButtonGroup>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Пагинация */}
              {renderPagination()}
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Модальные окна */}
      {modals.form.visible && (
        <ProjectFormModal
          visible={modals.form.visible}
          project={modals.form.project}
          onClose={() => closeModal('form')}
          onSubmit={modals.form.project ? handleUpdate : handleCreate}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Модальное окно удаления */}
      <CModal
        visible={modals.delete.visible}
        onClose={() => closeModal('delete')}
        size="sm"
      >
        <CModalHeader>
          <CModalTitle>Подтверждение удаления</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center">
            <CIcon icon={cilWarning} size="xxl" className="text-warning mb-3" />
            <p>
              Вы уверены, что хотите удалить проект{' '}
              <strong>{modals.delete.project?.name}</strong>?
            </p>
            <p className="text-body-secondary small">
              Это действие нельзя отменить.
            </p>
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
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <CSpinner size="sm" /> : 'Удалить'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Модальное окно массового удаления */}
      <CModal
        visible={modals.bulkDelete.visible}
        onClose={() => closeModal('bulkDelete')}
        size="sm"
      >
        <CModalHeader>
          <CModalTitle>Массовое удаление</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center">
            <CIcon icon={cilWarning} size="xxl" className="text-warning mb-3" />
            <p>
              Вы уверены, что хотите удалить {selectedProjects.length} проектов?
            </p>
            <p className="text-body-secondary small">
              Это действие нельзя отменить.
            </p>
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
            {isBulkDeleting ? <CSpinner size="sm" /> : 'Удалить все'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Projects