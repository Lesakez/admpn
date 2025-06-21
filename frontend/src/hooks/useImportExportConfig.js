// frontend/src/hooks/useImportExportConfig.js
import { useState, useEffect } from 'react'

// Очищаем кеш для отладки
const configCache = new Map()

export const useImportExportConfig = (type) => {
  const [config, setConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log(`Loading config for type: ${type}`)

        // ПРИНУДИТЕЛЬНО ОЧИЩАЕМ КЕШ ДЛЯ ОТЛАДКИ
        configCache.clear()
        console.log('Cache cleared for debugging')

        // Ленивая загрузка конфигурации
        let loadedConfig

        try {
          const configPath = `../config/${type}ImportExportConfig.js`
          console.log(`Attempting to import config from: ${configPath}`)
          
          // Добавляем timestamp чтобы избежать кеша браузера
          const timestamp = Date.now()
          const configModule = await import(`../config/${type}ImportExportConfig.js?t=${timestamp}`)
          console.log('Config module loaded:', configModule)
          console.log('Config module default:', configModule.default)
          console.log('Config module config:', configModule.config)
          
          loadedConfig = configModule.default || configModule.config
          console.log('Final loaded config:', loadedConfig)
          
          // Проверяем структуру конфигурации
          if (loadedConfig) {
            console.log('Config has export section:', !!loadedConfig.export)
            console.log('Config has import section:', !!loadedConfig.import)
            if (loadedConfig.export) {
              console.log('Export section steps:', loadedConfig.export.steps)
              console.log('Export section exportTypes:', loadedConfig.export.exportTypes)
            }
          }
          
          if (!loadedConfig) {
            throw new Error('Config module does not export default or config')
          }
          
        } catch (importError) {
          console.error(`Failed to import config for ${type}:`, importError)
          // Если файл конфигурации не найден, создаем базовую конфигурацию
          console.warn(`Config file for ${type} not found, using default config`)
          loadedConfig = createDefaultConfig(type)
          console.log('Created default config:', loadedConfig)
        }

        // НЕ кешируем для отладки
        console.log(`Setting config for ${type}:`, loadedConfig)
        setConfig(loadedConfig)
      } catch (err) {
        console.error(`Failed to load config for ${type}:`, err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [type])

  return { config, isLoading, error }
}

// Создает базовую конфигурацию если файл не найден
const createDefaultConfig = (type) => {
  console.log(`Creating default config for ${type}`)
  
  const defaultConfig = {
    title: `Импорт/Экспорт ${type}`,
    icon: 'cilUser',
    
    import: {
      title: `Импорт ${type}`,
      description: `Импортируйте ${type} из текстового файла`,
      service: `${type}Service`,
      method: 'importFromText',
      
      formats: [
        {
          value: 'default',
          label: 'Стандартный формат',
          example: 'Пример данных',
          description: 'Стандартный формат для импорта'
        }
      ],
      
      delimiters: [
        { value: '\n', label: 'Новая строка' },
        { value: ';', label: 'Точка с запятой' }
      ],
      
      acceptedFileTypes: '.txt,.csv',
      maxFileSize: 10 * 1024 * 1024,
      
      resultFields: {
        imported: 'Импортировано',
        errors: 'Ошибок'
      }
    },
    
    export: {
      title: `Экспорт ${type}`,
      description: `Экспортируйте ${type} в различных форматах`,
      service: `${type}Service`,
      
      steps: [
        { id: 'type', label: 'Тип и фильтры', icon: 'cilFilter' },
        { id: 'format', label: 'Формат и поля', icon: 'cilCode' },
        { id: 'preview', label: 'Предпросмотр', icon: 'cilEyedropper' }
      ],

      exportTypes: [
        {
          value: 'all',
          title: 'Все записи',
          description: 'Полный экспорт без фильтров'
        }
      ],
      
      formats: [
        {
          value: 'json',
          label: 'JSON',
          description: 'Данные в формате JSON',
          method: 'exportJSON',
          extension: 'json',
          mimeType: 'application/json'
        }
      ],

      fieldCategories: [
        {
          key: 'basic',
          name: 'Основные поля'
        }
      ],

      availableFields: [
        { 
          key: 'id', 
          name: 'id', 
          label: 'ID',
          category: 'basic', 
          type: 'number',
          sensitive: false
        }
      ],
      
      filters: [],
      defaults: {
        format: 'json',
        fields: ['id']
      }
    }
  }
  
  console.log('Default config created:', defaultConfig)
  return defaultConfig
}