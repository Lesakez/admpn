import { useState } from 'react'
import { Trash2, Edit, AlertTriangle } from 'lucide-react'
import { Button } from '../ui'
import { useBulkAction } from '../../hooks/useEntity'
import toast from 'react-hot-toast'

export default function BulkActions({ config, selectedIds, onSuccess }) {
  const [showConfirm, setShowConfirm] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const bulkMutation = useBulkAction(config)

  const handleAction = async (action) => {
    if (action.confirm && !showConfirm) {
      setShowConfirm(action)
      return
    }

    if (action.requiresInput && !inputValue) {
      toast.error('Заполните поле ввода')
      return
    }

    setIsLoading(true)

    try {
      const payload = { ids: selectedIds }
      
      if (action.requiresInput) {
        payload[action.inputField || 'value'] = inputValue
      }

      await bulkMutation.mutateAsync({
        action: action.key,
        payload
      })

      setShowConfirm(null)
      setInputValue('')
      onSuccess?.()
    } catch (error) {
      console.error('Bulk action error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (iconName) => {
    const icons = {
      Trash2,
      Edit,
      AlertTriangle
    }
    return icons[iconName] || Edit
  }

  const getVariantClass = (variant) => {
    const variants = {
      danger: 'btn-danger',
      warning: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
      outline: 'btn-outline',
      primary: 'btn-primary'
    }
    return variants[variant] || 'btn-outline'
  }

  if (!config.bulkActions || selectedIds.length === 0) {
    return null
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Выбрано элементов: {selectedIds.length}
            </h3>
            <p className="text-sm text-gray-500">
              Выберите действие для выполнения с выбранными элементами
            </p>
          </div>

          <div className="flex items-center gap-2">
            {config.bulkActions.map((action) => {
              const Icon = getIcon(action.icon)
              
              return (
                <Button
                  key={action.key}
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleAction(action)}
                  disabled={isLoading}
                  className={getVariantClass(action.variant)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Подтверждение действия */}
        {showConfirm && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800">
                  Подтверждение действия
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {showConfirm.confirmMessage}
                </p>

                {showConfirm.requiresInput && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-yellow-800 mb-1">
                      {showConfirm.inputLabel}
                    </label>
                    
                    {showConfirm.inputType === 'select' ? (
                      <select
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="input w-48"
                      >
                        <option value="">Выберите...</option>
                        {showConfirm.inputOptions?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={showConfirm.inputType || 'text'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="input w-48"
                        placeholder={showConfirm.inputPlaceholder}
                      />
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleAction(showConfirm)}
                    isLoading={isLoading}
                  >
                    Подтвердить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowConfirm(null)
                      setInputValue('')
                    }}
                    disabled={isLoading}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}