// frontend/src/config/accountsImportExportConfig.js
export default {
  title: 'Импорт/Экспорт аккаунтов',
  icon: 'cilUser',
  
  import: {
    title: 'Импорт аккаунтов',
    description: 'Импортируйте аккаунты из текстового файла или введите данные вручную',
    service: 'accountsService',
    method: 'importFromText',
    
    formats: [
      {
        value: 'login:password',
        label: 'Логин:Пароль',
        example: 'user123:password123\nadmin:secretpass',
        description: 'Базовый формат для быстрого импорта'
      },
      {
        value: 'email:password',
        label: 'Email:Пароль', 
        example: 'user@example.com:password123\ntest@mail.com:mypass123',
        description: 'Импорт через email'
      },
      {
        value: 'custom',
        label: 'Кастомный формат',
        example: 'Настройте поля и разделители по своему усмотрению',
        description: 'Полностью настраиваемый формат импорта'
      }
    ],
    
    delimiters: [
      { value: '\n', label: 'Новая строка' },
      { value: ';', label: 'Точка с запятой' },
      { value: ',', label: 'Запятая' },
      { value: '|', label: 'Вертикальная черта' },
      { value: '\t', label: 'Табуляция' }
    ],
    
    acceptedFileTypes: '.txt,.csv',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    
    resultFields: {
      imported: 'Импортировано',
      updated: 'Обновлено',
      errors: 'Ошибок',
      total: 'Всего строк'
    },
    
    successMessage: 'Аккаунты успешно импортированы',
    submitLabel: 'Импортировать аккаунты'
  },
  
  export: {
    title: 'Экспорт аккаунтов',
    description: 'Экспортируйте аккаунты в нужном формате. Создавайте кастомные форматы из любых полей.',
    service: 'accountsService',
    
    // Минимальный набор готовых форматов
    formats: [
      {
        value: 'json',
        label: 'JSON',
        description: 'Полные данные в JSON формате',
        method: 'exportJSON',
        extension: 'json',
        mimeType: 'application/json',
        filename: 'accounts.json'
      },
      {
        value: 'csv',
        label: 'CSV (Excel)',
        description: 'Таблица для Excel с выбранными полями',
        method: 'exportCSV',
        extension: 'csv',
        mimeType: 'text/csv',
        filename: 'accounts.csv'
      },
      {
        value: 'txt_simple',
        label: 'TXT (Логин:Пароль)',
        description: 'Простой формат для ZennoPoster',
        method: 'exportTXT',
        extension: 'txt',
        mimeType: 'text/plain',
        template: '{login}:{password}',
        filename: 'accounts_login_pass.txt'
      },
      {
        value: 'txt_custom',
        label: 'TXT (Кастомный)',
        description: 'Создайте свой формат из любых полей',
        method: 'exportCustom',
        extension: 'txt',
        mimeType: 'text/plain',
        isCustom: true,
        filename: 'accounts_custom.txt'
      }
    ],

    // Все доступные поля для конструктора форматов
    availableFields: [
      // Основные поля
      { key: 'id', label: 'ID', category: 'basic', sensitive: false },
      { key: 'login', label: 'Логин', category: 'basic', sensitive: false },
      { key: 'password', label: 'Пароль', category: 'basic', sensitive: true },
      { key: 'email', label: 'Email', category: 'basic', sensitive: false },
      { key: 'status', label: 'Статус', category: 'basic', sensitive: false },
      
      // Email данные  
      { key: 'emailPassword', label: 'Пароль от Email', category: 'email', sensitive: true },
      { key: 'emailRecovery', label: 'Резервный Email', category: 'email', sensitive: false },
      { key: 'emailPasswordRecovery', label: 'Пароль резервного Email', category: 'email', sensitive: true },
      { key: 'emailJsonData', label: 'JSON данные Email', category: 'email', sensitive: false },
      
      // Безопасность
      { key: 'twoFA', label: '2FA ключ', category: 'security', sensitive: true },
      { key: 'userAgent', label: 'User Agent', category: 'security', sensitive: false },
      
      // Профиль
      { key: 'dob', label: 'Дата рождения', category: 'profile', sensitive: false },
      { key: 'nameProfiles', label: 'Имя профиля', category: 'profile', sensitive: false },
      { key: 'userId', label: 'User ID', category: 'profile', sensitive: false },
      
      // Метаданные
      { key: 'source', label: 'Источник', category: 'meta', sensitive: false },
      { key: 'createdAt', label: 'Дата создания', category: 'meta', sensitive: false },
      { key: 'updatedAt', label: 'Дата обновления', category: 'meta', sensitive: false },
      { key: 'importDate', label: 'Дата импорта', category: 'meta', sensitive: false },
      
      // Токены и API
      { key: 'accessToken', label: 'Access Token', category: 'tokens', sensitive: true },
      { key: 'refreshToken', label: 'Refresh Token', category: 'tokens', sensitive: true },
      { key: 'clientId', label: 'Client ID', category: 'tokens', sensitive: false },
      
      // Дополнительные поля
      { key: 'counter', label: 'Счетчик', category: 'additional', sensitive: false },
      { key: 'code', label: 'Код', category: 'additional', sensitive: false },
      { key: 'device', label: 'Устройство', category: 'additional', sensitive: false },
      { key: 'lsposedJson', label: 'LSPosed JSON', category: 'additional', sensitive: false }
    ],

    // Категории полей для группировки
    fieldCategories: [
      { key: 'basic', label: 'Основные', icon: 'cilUser', color: 'primary' },
      { key: 'email', label: 'Email данные', icon: 'cilEnvelopeClosed', color: 'info' },
      { key: 'security', label: 'Безопасность', icon: 'cilShield', color: 'warning' },
      { key: 'profile', label: 'Профиль', icon: 'cilPeople', color: 'success' },
      { key: 'tokens', label: 'Токены API', icon: 'cilKey', color: 'danger' },
      { key: 'meta', label: 'Метаданные', icon: 'cilInfo', color: 'secondary' },
      { key: 'additional', label: 'Дополнительно', icon: 'cilPlus', color: 'dark' }
    ],

    // Готовые шаблоны для быстрого старта
    quickTemplates: [
      {
        name: 'zennoposter_basic',
        label: 'ZennoPoster (базовый)',
        template: '{login}:{password}',
        description: 'Логин и пароль для ZennoPoster'
      },
      {
        name: 'zennoposter_full',
        label: 'ZennoPoster (полный)',
        template: '{login}:{password}:{email}:{emailPassword}:{twoFA}',
        description: 'Полный набор для ZennoPoster с email и 2FA'
      },
      {
        name: 'email_auth',
        label: 'Email авторизация',
        template: '{email}:{password}:{emailPassword}',
        description: 'Email, пароль аккаунта и пароль от email'
      },
      {
        name: 'api_tokens',
        label: 'API токены',
        template: '{email}:{accessToken}:{refreshToken}:{clientId}',
        description: 'Данные для API доступа'
      },
      {
        name: 'with_status',
        label: 'С статусом',
        template: '{login}:{password}:{email}:{status}',
        description: 'Основные данные плюс статус аккаунта'
      }
    ],

    // Настройки разделителей
    separators: [
      { value: ':', label: 'Двоеточие (:)', default: true },
      { value: ';', label: 'Точка с запятой (;)' },
      { value: '|', label: 'Вертикальная черта (|)' },
      { value: ',', label: 'Запятая (,)' },
      { value: '\t', label: 'Табуляция' },
      { value: ' ', label: 'Пробел' },
      { value: 'custom', label: 'Другой символ...' }
    ],

    // Фильтры
    filters: [
      {
        key: 'status',
        label: 'Статус',
        type: 'select',
        dynamic: true,
        entity: 'account',
        multiple: true,
        placeholder: 'Все статусы'
      },
      {
        key: 'source',
        label: 'Источник',
        type: 'select',
        multiple: true,
        options: [
          { value: '', label: 'Все источники' },
          { value: 'manual', label: 'Ручное создание' },
          { value: 'import', label: 'Импорт' },
          { value: 'registration', label: 'Регистрация' },
          { value: 'api', label: 'API' }
        ]
      },
      {
        key: 'search',
        label: 'Поиск',
        type: 'text',
        placeholder: 'Поиск по логину, email...'
      },
      {
        key: 'dateFrom',
        label: 'Создан от',
        type: 'date'
      },
      {
        key: 'dateTo',
        label: 'Создан до', 
        type: 'date'
      },
      {
        key: 'hasEmail',
        label: 'Только с email',
        type: 'checkbox'
      },
      {
        key: 'has2FA',
        label: 'Только с 2FA',
        type: 'checkbox'
      }
    ]
  }
}