// frontend/src/hooks/useModals.js
import { useState } from 'react'

export const useModals = () => {
  const [modals, setModals] = useState({
    delete: { visible: false, data: null },
    confirm: { visible: false, data: null },
    statusChange: { visible: false, data: null },
    bulkAction: { visible: false, data: null }
  })

  const openModal = (type, data = {}) => {
    setModals(prev => ({
      ...prev,
      [type]: { visible: true, data }
    }))
  }

  const closeModal = (type) => {
    setModals(prev => ({
      ...prev,
      [type]: { visible: false, data: null }
    }))
  }

  const closeAllModals = () => {
    setModals({
      delete: { visible: false, data: null },
      confirm: { visible: false, data: null },
      statusChange: { visible: false, data: null },
      bulkAction: { visible: false, data: null }
    })
  }

  // Удобные методы для каждого типа модалки
  const confirmDelete = (item, options = {}) => {
    openModal('delete', {
      item,
      title: options.title || "Подтверждение удаления",
      message: options.message || `Вы уверены, что хотите удалить "${item.name || item.login || 'этот элемент'}"?`,
      itemName: item.name || item.login || item.title,
      onConfirm: options.onConfirm,
      ...options
    })
  }

  const confirmAction = (options = {}) => {
    openModal('confirm', {
      variant: options.variant || 'warning',
      title: options.title || "Подтверждение",
      message: options.message || "Вы уверены?",
      confirmText: options.confirmText || "Подтвердить",
      confirmColor: options.confirmColor || "primary",
      onConfirm: options.onConfirm,
      ...options
    })
  }

  const changeStatus = (item, entityType, options = {}) => {
    openModal('statusChange', {
      item,
      entityType,
      currentStatus: item.status,
      itemName: item.name || item.login || item.title,
      title: options.title || `Изменить статус: ${item.name || item.login}`,
      onConfirm: options.onConfirm,
      ...options
    })
  }

  const bulkAction = (selectedItems, action, options = {}) => {
    openModal('bulkAction', {
      selectedItems,
      action,
      entityType: options.entityType,
      title: options.title,
      onConfirm: options.onConfirm,
      ...options
    })
  }

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    // Удобные методы
    confirmDelete,
    confirmAction,
    changeStatus,
    bulkAction
  }
}