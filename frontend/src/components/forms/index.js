// frontend/src/components/forms/index.js

// Основные формы сущностей
import AccountFormModal from './AccountFormModal'
import ProxyFormModal from './ProxyFormModal'
import PhoneFormModal from './PhoneFormModal'
import ProfileFormModal from './ProfileFormModal'
import ProjectFormModal from './ProjectFormModal'

// Служебные модальные окна
import { 
  DeleteModal, 
  StatusChangeModal, 
  BulkActionModal,
  ConfirmModal 
} from '../common/modals'

// Специальные модалки
import ImportExportModal from '../modals/ImportExportModal'

// Именованный экспорт
export {
  // Основные формы
  AccountFormModal,
  ProxyFormModal,
  PhoneFormModal,
  ProfileFormModal,
  ProjectFormModal,
  
  // Служебные модалки
  DeleteModal,
  StatusChangeModal,
  BulkActionModal,
  ConfirmModal,
  
  // Специальные модалки
  ImportExportModal
}

// Экспорт по умолчанию
export default {
  AccountFormModal,
  ProxyFormModal,
  PhoneFormModal,
  ProfileFormModal,
  ProjectFormModal,
  DeleteModal,
  StatusChangeModal,
  BulkActionModal,
  ConfirmModal,
  ImportExportModal
}