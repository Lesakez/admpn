// frontend/src/hooks/useImportExportModal.js
import { useState } from 'react'

export const useImportExportModal = () => {
  const [modalState, setModalState] = useState({
    visible: false,
    type: 'accounts',
    mode: 'both' // 'import', 'export', 'both'
  })

  const openImport = (type = 'accounts') => {
    setModalState({
      visible: true,
      type,
      mode: 'import'
    })
  }

  const openExport = (type = 'accounts') => {
    setModalState({
      visible: true,
      type,
      mode: 'export'
    })
  }

  const openBoth = (type = 'accounts') => {
    setModalState({
      visible: true,
      type,
      mode: 'both'
    })
  }

  const close = () => {
    setModalState(prev => ({ ...prev, visible: false }))
  }

  return {
    modalState,
    openImport,
    openExport,
    openBoth,
    close
  }
}