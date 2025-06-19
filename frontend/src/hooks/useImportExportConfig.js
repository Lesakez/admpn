// frontend/src/hooks/useImportExportConfig.js
import { useState, useEffect } from 'react'

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

        // Проверяем кеш
        if (configCache.has(type)) {
          setConfig(configCache.get(type))
          setIsLoading(false)
          return
        }

        // Ленивая загрузка конфигурации
        let loadedConfig

        try {
          const configModule = await import(`../config/${type}ImportExportConfig.js`)
          loadedConfig = configModule.default || configModule.config
        } catch (importError) {
          // Если файл конфигурации не найден, создаем базовую конфигурацию
          console.warn(`Config file for ${type} not found, using default config`)
          loadedConfig = createDefaultConfig(type)
        }

        // Кешируем
        configCache.set(type, loadedConfig)
        setConfig(loadedConfig)
      } catch (err) {
        setError(err)
        console.error(`Failed to load config for ${type}:`, err)
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
  return {
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
      
      filters: [],
      defaultFilters: {}
    }
  }
}