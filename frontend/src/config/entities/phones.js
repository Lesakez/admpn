import { getStatusesForEntity } from '../../utils/statuses'

export const phonesConfig = {
  entityType: 'phone',
  entityName: 'Телефон',
  entityNamePlural: 'Телефоны',
  apiEndpoint: '/phones',
  
  columns: [
    {
      key: 'model',
      label: 'Модель',
      sortable: true,
      type: 'text',
      width: 'w-48',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value || row.device || 'Неизвестно'}</div>
          {row.androidVersion && (
            <div className="text-sm text-gray-500">Android {row.androidVersion}</div>
          )}
        </div>
      )
    },
    {
      key: 'device',
      label: 'Устройство',
      width: 'w-32',
      render: (value) => value || '-'
    },
    {
      key: 'ipAddress',
      label: 'IP адрес',
      width: 'w-32',
      render: (value) => value ? (
        <span className="font-mono text-sm">{value}</span>
      ) : '-'
    },
    {
      key: 'macAddress',
      label: 'MAC адрес',
      width: 'w-36',
      render: (value) => value ? (
        <span className="font-mono text-xs">{value}</span>
      ) : '-'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'status',
      entityType: 'phone',
      sortable: true,
      width: 'w-32'
    },
    {
      key: 'project',
      label: 'Проект',
      width: 'w-32',
      render: (value, row) => row.project?.name || '-'
    },
    {
      key: 'dateLastReboot',
      label: 'Последняя перезагрузка',
      type: 'datetime',
      width: 'w-44',
      render: (value) => value ? new Date(value).toLocaleString('ru-RU') : '-'
    },
    {
      key: 'createdAt',
      label: 'Создан',
      type: 'datetime',
      sortable: true,
      width: 'w-40'
    }
  ],

  filters: [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Поиск по модели, устройству или IP...',
      className: 'flex-1'
    },
    {
      key: 'status',
      type: 'select',
      label: 'Статус',
      placeholder: 'Все статусы',
      options: getStatusesForEntity('phone').map(status => ({
        value: status,
        label: status
      })),
      className: 'w-full lg:w-48'
    },
    {
      key: 'projectId',
      type: 'select',
      label: 'Проект',
      placeholder: 'Все проекты',
      apiEndpoint: '/projects',
      optionValue: 'id',
      optionLabel: 'name',
      className: 'w-full lg:w-48'
    }
  ],

  formFields: [
    {
      key: 'model',
      label: 'Модель',
      type: 'text',
      validation: {
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'device',
      label: 'Устройство',
      type: 'text',
      validation: {
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'androidVersion',
      label: 'Версия Android',
      type: 'text',
      validation: {
        maxLength: { value: 50, message: 'Максимум 50 символов' }
      }
    },
    {
      key: 'ipAddress',
      label: 'IP адрес',
      type: 'text',
      validation: {
        pattern: {
          value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          message: 'Введите корректный IP адрес'
        }
      }
    },
    {
      key: 'macAddress',
      label: 'MAC адрес',
      type: 'text',
      validation: {
        pattern: {
          value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
          message: 'MAC адрес должен быть в формате XX:XX:XX:XX:XX:XX'
        }
      }
    },
    {
      key: 'projectId',
      label: 'Проект',
      type: 'select',
      apiEndpoint: '/projects',
      optionValue: 'id',
      optionLabel: 'name'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'select',
      options: getStatusesForEntity('phone').map(status => ({
        value: status,
        label: status
      })),
      defaultValue: 'free'
    }
  ],

  bulkActions: [
    {
      key: 'bulk-delete',
      label: 'Удалить выбранные',
      icon: 'Trash2',
      variant: 'danger',
      confirm: true,
      confirmMessage: 'Удалить выбранные телефоны?'
    },
    {
      key: 'bulk-update-status',
      label: 'Изменить статус',
      icon: 'Edit',
      variant: 'outline',
      requiresInput: true,
      inputType: 'select',
      inputLabel: 'Новый статус',
      inputOptions: getStatusesForEntity('phone').map(status => ({
        value: status,
        label: status
      }))
    }
  ],

  actions: [
    {
      key: 'toggle-status',
      label: 'Переключить статус',
      endpoint: (id) => `/phones/${id}/toggle-status`,
      method: 'POST',
      icon: 'ToggleLeft'
    },
    {
      key: 'reboot',
      label: 'Перезагрузить',
      endpoint: (id) => `/phones/${id}/reboot`,
      method: 'POST',
      icon: 'RotateCcw',
      requiresConfirm: true,
      confirmMessage: 'Перезагрузить устройство?',
      variant: 'warning'
    }
  ]
}