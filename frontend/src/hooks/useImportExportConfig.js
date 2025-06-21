// frontend/src/hooks/useImportExportConfig.js
import { useState, useEffect } from 'react'

// Прямой импорт существующих конфигураций
import accountsConfig from '../config/accountsImportExportConfig.js'

// Мапинг конфигураций
const configMap = {
  accounts: accountsConfig,
  // Добавьте другие конфигурации по мере необходимости
}

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

        // Используем статический импорт вместо динамического
        if (configMap[type]) {
          const loadedConfig = configMap[type]
          console.log('Config loaded from static import:', loadedConfig)
          setConfig(loadedConfig)
        } else {
          const errorMsg = `Configuration for type "${type}" not found`
          console.error(errorMsg)
          setError(new Error(errorMsg))
        }
        
      } catch (err) {
        console.error(`Failed to load config for ${type}:`, err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (type) {
      loadConfig()
    }
  }, [type])

  return { config, isLoading, error }
}