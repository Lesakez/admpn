// frontend/src/config/accountsExportConfig.js
export default {
  title: 'Экспорт аккаунтов',
  description: 'Экспортируйте аккаунты в нужном формате. Создавайте кастомные форматы из любых полей.',
  service: 'accountsService',
  
  // Шаги экспорта
  steps: [
    { id: 'type', label: 'Тип и фильтры', icon: 'cilFilter' },
    { id: 'format', label: 'Формат и поля', icon: 'cilCode' },
    { id: 'preview', label: 'Предпросмотр', icon: 'cilEyedropper' }
  ],

  // Типы экспорта
  exportTypes: [
    {
      value: 'filtered',
      title: 'Фильтрованный экспорт',
      description: 'С учетом текущих фильтров'
    },
    {
      value: 'selected',
      title: 'Выбранные записи',
      description: 'Предварительно выбранные в таблице'
    },
    {
      value: 'by_ids',
      title: 'По списку ID',
      description: 'Конкретные записи по User ID'
    },
    {
      value: 'all',
      title: 'Все записи',
      description: 'Полный экспорт без фильтров'
    }
  ],

  // Форматы экспорта
  formats: [
    {
      value: 'csv',
      label: 'CSV (Excel)',
      description: 'Таблица для Excel с выбранными полями',
      method: 'exportCSV',
      extension: 'csv',
      mimeType: 'text/csv',
      supportsFields: true,
      supportsHeader: true,
      options: {
        delimiters: [
          { value: ',', label: 'Запятая (,)' },
          { value: ';', label: 'Точка с запятой (;)' },
          { value: '\t', label: 'Табуляция' }
        ],
        quotes: [
          { value: '"', label: 'Двойные кавычки (")' },
          { value: "'", label: 'Одинарные кавычки (\')' },
          { value: '', label: 'Без кавычек' }
        ]
      }
    },
    {
      value: 'txt',
      label: 'TXT (Кастомный)',
      description: 'Текстовый формат с настраиваемым шаблоном',
      method: 'exportTXT',
      extension: 'txt',
      mimeType: 'text/plain',
      supportsTemplate: true,
      supportsFields: true,
      defaultTemplate: '{login}:{password}:{email}'
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'Полные данные в JSON формате',
      method: 'exportJSON',
      extension: 'json',
      mimeType: 'application/json',
      supportsFields: true
    },
    {
      value: 'xml',
      label: 'XML',
      description: 'Данные в XML формате',
      method: 'exportXML',
      extension: 'xml',
      mimeType: 'application/xml',
      supportsFields: true
    }
  ],

  // Готовые шаблоны для TXT
  templates: {
    login_password: {
      name: 'Логин:Пароль',
      template: '{login}:{password}',
      description: 'Базовый формат для ZennoPoster',
      fields: ['login', 'password']
    },
    email_password: {
      name: 'Email:Пароль',
      template: '{email}:{password}',
      description: 'Формат с email вместо логина',
      fields: ['email', 'password']
    },
    full_account: {
      name: 'Полный аккаунт',
      template: '{login}:{password}:{email}:{user_id}:{status}',
      description: 'Максимум информации',
      fields: ['login', 'password', 'email', 'user_id', 'status']
    },
    zenno_advanced: {
      name: 'ZennoPoster расширенный',
      template: '{login}:{password}:{email}:{phone}:{recovery_email}',
      description: 'Для ZennoPoster с дополнительными полями',
      fields: ['login', 'password', 'email', 'phone', 'recovery_email']
    }
  },

  // Категории полей
  fieldCategories: [
    {
      key: 'basic',
      name: 'Основные поля',
      description: 'Базовая информация об аккаунте'
    },
    {
      key: 'email',
      name: 'Email данные',
      description: 'Информация об email и восстановлении'
    },
    {
      key: 'security',
      name: 'Безопасность',
      description: 'Пароли, 2FA и данные безопасности'
    },
    {
      key: 'social',
      name: 'Социальные сети',
      description: 'Данные из социальных сетей'
    },
    {
      key: 'metadata',
      name: 'Метаданные',
      description: 'Служебная информация и метрики'
    }
  ],

  // Все доступные поля для экспорта
  availableFields: [
    // Основные поля
    { 
      key: 'id', 
      name: 'ID', 
      label: 'ID',
      category: 'basic', 
      type: 'number',
      sensitive: false,
      description: 'Уникальный идентификатор записи'
    },
    { 
      key: 'login', 
      name: 'login', 
      label: 'Логин',
      category: 'basic', 
      type: 'string',
      sensitive: false,
      description: 'Логин аккаунта'
    },
    { 
      key: 'password', 
      name: 'password', 
      label: 'Пароль',
      category: 'security', 
      type: 'string',
      sensitive: true,
      description: 'Пароль аккаунта'
    },
    { 
      key: 'email', 
      name: 'email', 
      label: 'Email',
      category: 'email', 
      type: 'email',
      sensitive: false,
      description: 'Основной email адрес'
    },
    { 
      key: 'user_id', 
      name: 'user_id', 
      label: 'User ID',
      category: 'basic', 
      type: 'string',
      sensitive: false,
      description: 'ID пользователя в системе'
    },
    { 
      key: 'status', 
      name: 'status', 
      label: 'Статус',
      category: 'basic', 
      type: 'enum',
      sensitive: false,
      description: 'Текущий статус аккаунта'
    },

    // Email данные
    { 
      key: 'email_password', 
      name: 'email_password', 
      label: 'Пароль Email',
      category: 'email', 
      type: 'string',
      sensitive: true,
      description: 'Пароль от email аккаунта'
    },
    { 
      key: 'recovery_email', 
      name: 'recovery_email', 
      label: 'Резервный Email',
      category: 'email', 
      type: 'email',
      sensitive: false,
      description: 'Email для восстановления'
    },
    { 
      key: 'email_verified', 
      name: 'email_verified', 
      label: 'Email подтвержден',
      category: 'email', 
      type: 'boolean',
      sensitive: false,
      description: 'Статус подтверждения email'
    },

    // Безопасность
    { 
      key: 'phone', 
      name: 'phone', 
      label: 'Телефон',
      category: 'security', 
      type: 'string',
      sensitive: false,
      description: 'Номер телефона'
    },
    { 
      key: 'two_fa_secret', 
      name: 'two_fa_secret', 
      label: '2FA секрет',
      category: 'security', 
      type: 'string',
      sensitive: true,
      description: 'Секретный ключ для 2FA'
    },
    { 
      key: 'backup_codes', 
      name: 'backup_codes', 
      label: 'Резервные коды',
      category: 'security', 
      type: 'text',
      sensitive: true,
      description: 'Резервные коды восстановления'
    },

    // Социальные сети
    { 
      key: 'facebook_id', 
      name: 'facebook_id', 
      label: 'Facebook ID',
      category: 'social', 
      type: 'string',
      sensitive: false,
      description: 'ID профиля Facebook'
    },
    { 
      key: 'instagram_username', 
      name: 'instagram_username', 
      label: 'Instagram',
      category: 'social', 
      type: 'string',
      sensitive: false,
      description: 'Имя пользователя Instagram'
    },
    { 
      key: 'twitter_handle', 
      name: 'twitter_handle', 
      label: 'Twitter',
      category: 'social', 
      type: 'string',
      sensitive: false,
      description: 'Handle в Twitter'
    },

    // Метаданные
    { 
      key: 'created_at', 
      name: 'created_at', 
      label: 'Дата создания',
      category: 'metadata', 
      type: 'datetime',
      sensitive: false,
      description: 'Дата создания записи'
    },
    { 
      key: 'updated_at', 
      name: 'updated_at', 
      label: 'Дата обновления',
      category: 'metadata', 
      type: 'datetime',
      sensitive: false,
      description: 'Дата последнего обновления'
    },
    { 
      key: 'last_login', 
      name: 'last_login', 
      label: 'Последний вход',
      category: 'metadata', 
      type: 'datetime',
      sensitive: false,
      description: 'Дата последнего входа в систему'
    },
    { 
      key: 'proxy', 
      name: 'proxy', 
      label: 'Прокси',
      category: 'metadata', 
      type: 'string',
      sensitive: false,
      description: 'Используемый прокси сервер'
    },
    { 
      key: 'user_agent', 
      name: 'user_agent', 
      label: 'User Agent',
      category: 'metadata', 
      type: 'text',
      sensitive: false,
      description: 'User Agent браузера'
    },
    { 
      key: 'notes', 
      name: 'notes', 
      label: 'Заметки',
      category: 'metadata', 
      type: 'text',
      sensitive: false,
      description: 'Дополнительные заметки'
    }
  ],

  // Фильтры для экспорта
  filters: [
    {
      key: 'status',
      name: 'Статус',
      type: 'multiselect',
      options: [
        { value: 'active', label: 'Активный', color: 'success' },
        { value: 'suspended', label: 'Заблокирован', color: 'danger' },
        { value: 'restricted', label: 'Ограничен', color: 'warning' },
        { value: 'disabled', label: 'Отключен', color: 'dark' },
        { value: 'exported', label: 'Выгружен', color: 'info' },
        { value: 'pending', label: 'На проверке', color: 'primary' },
        { value: 'deleted', label: 'Удалён', color: 'danger' }
      ]
    },
    {
      key: 'date_range',
      name: 'Период создания',
      type: 'daterange',
      fields: ['date_from', 'date_to']
    },
    {
      key: 'search',
      name: 'Поиск',
      type: 'text',
      placeholder: 'Поиск по логину, email...'
    },
    {
      key: 'email_verified',
      name: 'Email подтвержден',
      type: 'select',
      options: [
        { value: '', label: 'Все' },
        { value: 'true', label: 'Подтверждены' },
        { value: 'false', label: 'Не подтверждены' }
      ]
    }
  ],

  // Настройки по умолчанию
  defaults: {
    format: 'csv',
    encoding: 'utf-8',
    include_header: true,
    mask_passwords: false,
    compress_output: false,
    fields: ['login', 'password', 'email', 'status', 'created_at'],
    filename_template: 'export_{format}_{date}'
  },

  // Валидация
  validation: {
    maxRecords: 100000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    requiredFields: ['id'],
    minFields: 1
  },

  // Сообщения
  messages: {
    success: 'Экспорт завершен успешно',
    error: 'Ошибка при экспорте данных',
    noData: 'Нет данных для экспорта',
    tooManyRecords: 'Слишком много записей для экспорта'
  }
}