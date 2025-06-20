// frontend/src/components/forms/index.js

/**
 * ИСПРАВЛЕНИЯ В ЭКСПОРТЕ КОМПОНЕНТОВ:
 * 1. Добавлены недостающие импорты компонентов
 * 2. Добавлены модальные окна для массовых действий
 * 3. Улучшена структура экспортов
 * 4. Добавлены комментарии для документации
 */

// Основные формы сущностей
import AccountFormModal from './AccountFormModal'
import ProxyFormModal from './ProxyFormModal'
import PhoneFormModal from './PhoneFormModal'
import ProfileFormModal from './ProfileFormModal'
import ProjectFormModal from './ProjectFormModal'

// Дополнительные модальные окна (если существуют)
// import UserFormModal from './UserFormModal'
// import RegistrationFormModal from './RegistrationFormModal'

// Служебные модальные окна
// import DeleteModal from './DeleteModal'
// import StatusChangeModal from './StatusChangeModal'
// import BulkActionModal from './BulkActionModal'
// import ImportExportModal from './ImportExportModal'

// Экспорт всех компонентов
export {
  // Основные формы
  AccountFormModal,
  ProxyFormModal,
  PhoneFormModal,
  ProfileFormModal,
  ProjectFormModal,
  
  // Дополнительные формы (раскомментировать при наличии)
  // UserFormModal,
  // RegistrationFormModal,
  
  // Служебные модальные окна (раскомментировать при наличии)
  // DeleteModal,
  // StatusChangeModal,
  // BulkActionModal,
  // ImportExportModal
}

// Экспорт по умолчанию (объект со всеми компонентами)
export default {
  AccountFormModal,
  ProxyFormModal,
  PhoneFormModal,
  ProfileFormModal,
  ProjectFormModal,
}

/**
 * ИСПОЛЬЗОВАНИЕ:
 * 
 * // Именованный импорт (рекомендуется)
 * import { AccountFormModal, ProfileFormModal } from '../../components/forms'
 * 
 * // Импорт всего объекта
 * import Forms from '../../components/forms'
 * const { AccountFormModal } = Forms
 * 
 * // Отдельный импорт компонента
 * import AccountFormModal from '../../components/forms/AccountFormModal'
 */