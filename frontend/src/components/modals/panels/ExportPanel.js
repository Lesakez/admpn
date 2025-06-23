// frontend/src/components/modals/panels/ExportPanel.js
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CAlert,
  CSpinner,
  CBadge,
  CRow,
  CCol,
  CButton,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCloudDownload,
  cilCheckCircle,
  cilFilter,
  cilCode,
  cilPlus,
  cilX,
  cilSettings,
  cilGlobeAlt,
  cilEyedropper,
  cilSearch,
} from '@coreui/icons';
import toast from 'react-hot-toast';
import { accountsService } from '../../../services/accountsService';
import { useQuery } from '@tanstack/react-query';
import './ExportPanel.scss';

const ExportPanel = ({
  type = 'accounts',
  selectedIds = [],
  currentFilters = {},
  initialFormat = 'csv',
  onSuccess,
  onExport,
}) => {
  const { data: fieldsData, isLoading: fieldsLoading, error } = useQuery({
    queryKey: [type, 'fields'],
    queryFn: async () => {
      const response = await accountsService.getFields();
      return response.data.data;
    },
  });

  const [currentStep, setCurrentStep] = useState('type');
  const [exporting, setExporting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Флаг для первой загрузки

  const [settings, setSettings] = useState({
    export_type: selectedIds.length > 0 ? 'selected' : 'all',
    format: initialFormat,
    encoding: 'utf-8',
    include_header: true,
    mask_passwords: false,
    csv_delimiter: ',',
    filename: '',
    status_filters: [],
  });

  const [selectedFieldsList, setSelectedFieldsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const exportTypes = useMemo(() => [
    { value: 'all', title: 'Все записи', description: 'Экспортировать все записи из базы данных', icon: cilFilter },
    { value: 'selected', title: 'Выбранные записи', description: `Экспортировать ${selectedIds.length} выбранных записей`, icon: cilCheckCircle, disabled: selectedIds.length === 0 },
    { value: 'filtered', title: 'По текущим фильтрам', description: 'Экспортировать записи согласно активным фильтрам', icon: cilGlobeAlt },
  ], [selectedIds.length]);

  const availableFormats = useMemo(() => [
    { value: 'csv', label: 'CSV', extension: 'csv', icon: cilEyedropper, method: 'exportCSV', mimeType: 'text/csv' },
    { value: 'json', label: 'JSON', extension: 'json', icon: cilCode, method: 'exportJSON', mimeType: 'application/json' },
    { value: 'txt', label: 'TXT', extension: 'txt', icon: cilGlobeAlt, method: 'exportTXT', mimeType: 'text/plain' },
  ], []);

  const availableFields = useMemo(() => {
    if (!fieldsData?.fields) return [];
    return Object.entries(fieldsData.fields)
      .map(([key, field]) => ({
        key,
        label: field.label || key,
        name: field.name || key,
        sensitive: field.isSensitive || false,
        type: field.type || 'string',
      }))
      .filter(field => field.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [fieldsData, searchQuery]);

  const availableStatuses = useMemo(() => {
    const statusField = fieldsData?.fields?.status;
    return statusField?.possibleValues || [];
  }, [fieldsData]);

  const steps = [
    { id: 'type', label: 'Тип экспорта' },
    { id: 'format', label: 'Настройки' },
    { id: 'preview', label: 'Экспорт' },
  ];

  const currentFormat = availableFormats.find(f => f.value === settings.format);

  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const addField = (field) => {
    if (!selectedFieldsList.find(f => f.key === field.key)) {
      setSelectedFieldsList(prev => [...prev, field]);
    }
  };

  const removeField = (fieldKey) => {
    setSelectedFieldsList(prev => prev.filter(f => f.key !== fieldKey));
  };

  const toggleField = (field) => {
    setSelectedFieldsList(prev =>
      prev.find(f => f.key === field.key)
        ? prev.filter(f => f.key !== field.key)
        : [...prev, field]
    );
  };

  const addAllFields = () => {
    setSelectedFieldsList([...availableFields]);
  };

  const clearAllFields = () => {
    setSelectedFieldsList([]);
    setInitialLoad(false); // Отключаем автоматическое добавление после очистки
  };

  const updateStatusFilters = (statusValue) => {
    setSettings(prev => ({
      ...prev,
      status_filters: prev.status_filters.includes(statusValue)
        ? prev.status_filters.filter(s => s !== statusValue)
        : [...prev.status_filters, statusValue],
    }));
  };

  const executeExport = async () => {
    try {
      setExporting(true);

      const exportParams = {
        format: settings.format,
        fields: selectedFieldsList.map(f => f.key),
        include_header: settings.include_header,
        mask_passwords: settings.mask_passwords,
        csv_delimiter: settings.csv_delimiter,
        filename: settings.filename || `${type}_export_${new Date().toISOString().slice(0, 10)}`,
      };

      if (settings.export_type === 'selected') {
        exportParams.account_ids = selectedIds;
      }

      if (settings.export_type === 'filtered') {
        Object.assign(exportParams, currentFilters);
        if (settings.status_filters.length > 0) {
          exportParams.status = settings.status_filters;
        }
      }

      let response;
      const method = accountsService[`export${currentFormat?.method.charAt(0).toUpperCase() + currentFormat?.method.slice(1)}`];
      if (!method) throw new Error('Метод экспорта не найден');
      response = await method(exportParams);

      const blob = new Blob([response.data], { type: currentFormat?.mimeType || 'application/octet-stream' });
      const filename = `${exportParams.filename}.${currentFormat?.extension}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Файл ${filename} скачан успешно!`);
      onSuccess?.({
        settings: exportParams,
        fieldsCount: selectedFieldsList.length,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка экспорта: ' + (error.response?.data?.error || error.message));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (availableFields.length > 0 && selectedFieldsList.length === 0 && initialLoad) {
      const defaultKeys = ['login', 'email', 'status', 'createdAt'];
      const defaultFields = availableFields.filter(f => defaultKeys.some(key => f.key.includes(key))).slice(0, 4) || availableFields.slice(0, 4);
      setSelectedFieldsList(defaultFields);
      setInitialLoad(false); // Отключаем после первой загрузки
    }
  }, [availableFields, selectedFieldsList.length, initialLoad]);

  if (fieldsLoading) {
    return (
      <div className="export-panel-loading">
        <CSpinner color="primary" />
        <p>Загрузка конфигурации экспорта...</p>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        Ошибка загрузки полей: {error.message}
      </CAlert>
    );
  }

  return (
    <div className="compact-export-panel">
      <div className="compact-progress">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`progress-dot ${currentStep === step.id ? 'active' : ''} ${steps.findIndex(s => s.id === currentStep) > index ? 'completed' : ''}`}
          >
            <span className="dot-number">{index + 1}</span>
            <span className="dot-label">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="compact-content">
        {currentStep === 'type' && (
          <div className="step-section">
            <h4 className="section-title">Выберите тип экспорта</h4>
            <div className="export-type-grid">
              {exportTypes.map(type => (
                <div
                  key={type.value}
                  className={`type-card ${settings.export_type === type.value ? 'selected' : ''} ${type.disabled ? 'disabled' : ''}`}
                  onClick={() => !type.disabled && setSettings(prev => ({ ...prev, export_type: type.value }))}
                >
                  <CIcon icon={type.icon} size="lg" />
                  <div className="type-info">
                    <h5>{type.title}</h5>
                    <p>{type.description}</p>
                  </div>
                  {settings.export_type === type.value && (
                    <CIcon icon={cilCheckCircle} className="selected-icon" />
                  )}
                </div>
              ))}
            </div>

            {settings.export_type === 'filtered' && availableStatuses.length > 0 && (
              <div className="filter-section">
                <h5>Дополнительные фильтры</h5>
                <div className="status-checkboxes">
                  {availableStatuses.map(status => (
                    <CFormCheck
                      key={status}
                      id={`status-${status}`}
                      label={status}
                      checked={settings.status_filters.includes(status)}
                      onChange={() => updateStatusFilters(status)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'format' && (
          <div className="step-section">
            <CRow className="format-row">
              <CCol md={6}>
                <h5>Формат файла</h5>
                <div className="format-buttons">
                  {availableFormats.map(format => (
                    <button
                      key={format.value}
                      className={`format-btn ${settings.format === format.value ? 'active' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, format: format.value }))}
                    >
                      <CIcon icon={format.icon} />
                      <span>{format.label}</span>
                    </button>
                  ))}
                </div>
              </CCol>

              <CCol md={6}>
                <h5>Настройки</h5>
                <div className="settings-compact">
                  <CInputGroup size="sm" className="mb-2">
                    <CInputGroupText>Файл</CInputGroupText>
                    <CFormInput
                      value={settings.filename}
                      onChange={(e) => setSettings(prev => ({ ...prev, filename: e.target.value }))}
                      placeholder={`${type}_export_${new Date().toISOString().slice(0, 10)}`}
                    />
                    <CInputGroupText>.{currentFormat?.extension}</CInputGroupText>
                  </CInputGroup>

                  <div className="checkbox-row">
                    <CFormCheck
                      id="include_header"
                      label="Заголовки"
                      checked={settings.include_header}
                      onChange={(e) => setSettings(prev => ({ ...prev, include_header: e.target.checked }))}
                      size="sm"
                    />
                    <CFormCheck
                      id="mask_passwords"
                      label="Маскировать"
                      checked={settings.mask_passwords}
                      onChange={(e) => setSettings(prev => ({ ...prev, mask_passwords: e.target.checked }))}
                      size="sm"
                    />
                  </div>
                </div>
              </CCol>
            </CRow>

            <div className="fields-section">
              <div className="fields-header">
                <h5>Поля для экспорта ({selectedFieldsList.length})</h5>
                <div className="fields-actions">
                  <CButton size="sm" color="outline-primary" onClick={addAllFields}>
                    Все ({availableFields.length})
                  </CButton>
                  <CButton size="sm" color="outline-secondary" onClick={clearAllFields}>
                    Очистить
                  </CButton>
                </div>
              </div>

              <div className="fields-container">
                <CInputGroup size="sm" className="search-field">
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск полей..."
                  />
                </CInputGroup>

                <div className="available-fields-list">
                  {availableFields.map(field => (
                    <div
                      key={field.key}
                      className={`field-item ${selectedFieldsList.find(f => f.key === field.key) ? 'selected' : ''}`}
                      onClick={() => toggleField(field)}
                    >
                      <CFormCheck
                        id={`field-${field.key}`}
                        label={field.label}
                        checked={selectedFieldsList.find(f => f.key === field.key)}
                        onChange={() => toggleField(field)}
                      />
                      {field.sensitive && <CBadge color="warning" size="sm">S</CBadge>}
                    </div>
                  ))}
                </div>

                <div className="selected-fields-list">
                  <small className="text-muted">Выбранные поля:</small>
                  {selectedFieldsList.map((field, index) => (
                    <div key={field.key} className="field-item selected">
                      <span className="field-order">{index + 1}</span>
                      <span>{field.label}</span>
                      {field.sensitive && <CBadge color="warning" size="sm">S</CBadge>}
                      <CIcon icon={cilX} size="sm" onClick={() => removeField(field.key)} className="remove-icon" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="step-section">
            <div className="export-ready">
              <div className="ready-icon">
                <CIcon icon={cilCheckCircle} size="xl" />
              </div>
              <h4>Готово к экспорту!</h4>

              <div className="export-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Тип:</span>
                    <span className="value">{exportTypes.find(t => t.value === settings.export_type)?.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Формат:</span>
                    <span className="value">{currentFormat?.label}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Полей:</span>
                    <span className="value">{selectedFieldsList.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Файл:</span>
                    <span className="value">{settings.filename || `${type}_export_${new Date().toISOString().slice(0, 10)}`}.{currentFormat?.extension}</span>
                  </div>
                </div>
              </div>

              <div className="selected-fields-preview">
                <small className="text-muted mb-2 d-block">Выбранные поля:</small>
                <div className="fields-badges">
                  {selectedFieldsList.map((field, index) => (
                    <CBadge
                      key={field.key}
                      color={field.sensitive ? 'warning' : 'info'}
                      className="field-badge"
                    >
                      {index + 1}. {field.label}
                    </CBadge>
                  ))}
                </div>
              </div>

              <CButton
                color="success"
                size="lg"
                onClick={executeExport}
                disabled={exporting || selectedFieldsList.length === 0}
                className="export-button"
              >
                {exporting ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Экспортирую...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilCloudDownload} className="me-2" />
                    Экспортировать ({selectedFieldsList.length} полей)
                  </>
                )}
              </CButton>
            </div>
          </div>
        )}
      </div>

      <div className="compact-navigation">
        {currentStep !== 'type' && (
          <CButton
            color="secondary"
            variant="outline"
            onClick={prevStep}
            disabled={exporting}
            size="sm"
          >
            Назад
          </CButton>
        )}

        {currentStep !== 'preview' && (
          <CButton
            color="primary"
            onClick={nextStep}
            disabled={
              (currentStep === 'type' && !settings.export_type) ||
              (currentStep === 'format' && selectedFieldsList.length === 0)
            }
            size="sm"
          >
            Далее
          </CButton>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;