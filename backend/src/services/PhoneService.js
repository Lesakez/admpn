// backend/src/services/PhoneService.js

const PhoneRepository = require('../repositories/PhoneRepository');
const ActivityService = require('./ActivityService');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError, ConflictError } = require('../middleware/errorHandler');

class PhoneService {
  constructor() {
    this.phoneRepository = new PhoneRepository();
    this.activityService = new ActivityService();
  }

  /**
   * Получить список телефонов с фильтрацией и пагинацией
   */
  async getPhones(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const result = await this.phoneRepository.findWithFilters(filters, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        phones: result.rows,
        pagination: {
          total: result.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.count / limit),
          hasNext: page < Math.ceil(result.count / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting phones:', error);
      throw new Error('Ошибка получения списка телефонов');
    }
  }

  /**
   * Получить телефон по ID с проектом
   */
  async getPhoneById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new ValidationError('Некорректный ID телефона');
      }

      const phone = await this.phoneRepository.findWithProject(id);
      
      if (!phone) {
        throw new NotFoundError('Устройство не найдено');
      }

      return phone;
    } catch (error) {
      logger.error('Error getting phone by ID:', error);
      throw error;
    }
  }

  /**
   * Создать новый телефон
   */
  async createPhone(phoneData) {
    try {
      const preparedData = this.preparePhoneData(phoneData);
      const phone = await this.phoneRepository.create(preparedData);

      await this.activityService.logPhoneActivity(
        phone.id,
        'create',
        `Создано устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`
      );

      logger.info('Phone created successfully', { phoneId: phone.id, model: phone.model });
      return await this.phoneRepository.findWithProject(phone.id);
    } catch (error) {
      logger.error('Error creating phone:', error);
      throw new Error('Ошибка создания устройства');
    }
  }

  /**
   * Обновить телефон
   */
  async updatePhone(id, updateData) {
    try {
      const phone = await this.getPhoneById(id);
      
      if (updateData.status && updateData.status !== phone.status) {
        updateData = this.handleStatusChange(updateData, phone.status);
      }

      await this.phoneRepository.update(id, updateData);

      await this.activityService.logPhoneActivity(
        phone.id,
        'update',
        `Обновлено устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`
      );

      logger.info('Phone updated successfully', { phoneId: phone.id });
      return await this.phoneRepository.findWithProject(id);
    } catch (error) {
      logger.error('Error updating phone:', error);
      throw error;
    }
  }

  /**
   * Удалить телефон
   */
  async deletePhone(id) {
    try {
      const phone = await this.getPhoneById(id);
      
      const phoneInfo = {
        model: phone.model || phone.device || `ID: ${phone.id}`,
        id: phone.id
      };

      await this.phoneRepository.delete(id);

      await this.activityService.logPhoneActivity(
        phoneInfo.id,
        'delete',
        `Удалено устройство: ${phoneInfo.model}`
      );

      logger.info('Phone deleted successfully', { phoneId: phoneInfo.id });
      return { message: 'Устройство успешно удалено' };
    } catch (error) {
      logger.error('Error deleting phone:', error);
      throw error;
    }
  }

  /**
   * Переключить статус телефона (free <-> busy)
   */
  async togglePhoneStatus(id) {
    try {
      const phone = await this.getPhoneById(id);
      
      const oldStatus = phone.status;
      const newStatus = phone.status === 'free' ? 'busy' : 'free';
      
      const updateData = this.handleStatusChange({ status: newStatus }, oldStatus);
      
      await this.phoneRepository.update(id, updateData);

      await this.activityService.logPhoneActivity(
        phone.id,
        'status_toggle',
        `Изменен статус устройства ${phone.model || phone.device || `ID: ${phone.id}`} с "${oldStatus}" на "${newStatus}"`
      );

      logger.info('Phone status toggled successfully', { 
        phoneId: phone.id, 
        oldStatus, 
        newStatus 
      });

      return await this.phoneRepository.findWithProject(id);
    } catch (error) {
      logger.error('Error toggling phone status:', error);
      throw error;
    }
  }

  /**
   * Перезагрузить телефон
   */
  async rebootPhone(id) {
    try {
      const phone = await this.getPhoneById(id);
      
      await this.phoneRepository.update(id, {
        dateLastReboot: new Date()
      });

      await this.activityService.logPhoneActivity(
        phone.id,
        'reboot',
        `Перезагружено устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`
      );

      logger.info('Phone rebooted successfully', { phoneId: phone.id });
      return await this.phoneRepository.findWithProject(id);
    } catch (error) {
      logger.error('Error rebooting phone:', error);
      throw new Error('Ошибка перезагрузки устройства');
    }
  }

  /**
   * Получить статистику телефонов
   */
  async getPhoneStats() {
    try {
      const stats = await this.phoneRepository.getStatusStats();
      
      const statusCounts = {
        free: 0,
        busy: 0,
        blocked: 0,
        error: 0,
        total: 0
      };

      stats.forEach(stat => {
        const status = stat.status?.toLowerCase() || 'unknown';
        const count = parseInt(stat.count) || 0;
        
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status] = count;
        }
        statusCounts.total += count;
      });

      return statusCounts;
    } catch (error) {
      logger.error('Error getting phone stats:', error);
      throw new Error('Ошибка получения статистики телефонов');
    }
  }

  /**
   * Массовое обновление статуса телефонов
   */
  async bulkUpdateStatus(phoneIds, status) {
    try {
      if (!Array.isArray(phoneIds) || phoneIds.length === 0) {
        throw new Error('Не указаны ID телефонов для обновления');
      }

      const validStatuses = ['free', 'busy', 'blocked', 'error'];
      if (!validStatuses.includes(status)) {
        throw new Error('Некорректный статус');
      }

      const updateData = this.handleStatusChange({ status }, null);
      const updatedCount = await this.phoneRepository.bulkUpdate(phoneIds, updateData);

      await this.activityService.logBulkActivity(
        'phone',
        phoneIds,
        'bulk_status_update',
        `Массовое обновление статуса ${phoneIds.length} устройств на "${status}"`
      );

      logger.info('Bulk phone status update completed', { 
        phoneIds: phoneIds.length, 
        status,
        updatedCount 
      });

      return {
        updatedCount,
        message: `Обновлено ${updatedCount} устройств`
      };
    } catch (error) {
      logger.error('Error bulk updating phone status:', error);
      throw error;
    }
  }

  /**
   * Массовое удаление
   */
  async bulkDelete(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Не указаны ID для удаления');
      }

      const deletedCount = await this.phoneRepository.bulkDelete(ids);

      await this.activityService.logBulkActivity(
        'phone',
        ids,
        'bulk_delete',
        `Массовое удаление ${ids.length} устройств`
      );

      logger.info('Bulk phone delete completed', { 
        phoneIds: ids.length,
        deletedCount 
      });

      return {
        deletedCount,
        message: `Удалено ${deletedCount} устройств`
      };
    } catch (error) {
      logger.error('Error bulk deleting phones:', error);
      throw error;
    }
  }

  /**
   * Поиск телефонов
   */
  async searchPhones(searchText, options = {}) {
    try {
      const { limit = 10 } = options;
      return await this.phoneRepository.search(searchText, { limit });
    } catch (error) {
      logger.error('Error searching phones:', error);
      throw new Error('Ошибка поиска устройств');
    }
  }

  // ========================================================================
  // МЕТОДЫ ИМПОРТА/ЭКСПОРТА
  // ========================================================================

  /**
   * Получить конфигурацию импорта (данные получаем динамически)
   */
  async getImportConfig() {
    try {
      const { Phone } = require('../models');
      const attributes = Phone.rawAttributes;
      
      // Получаем поля динамически из модели
      const importableFields = Object.keys(attributes).filter(fieldName => {
        const field = attributes[fieldName];
        return !field.primaryKey && !field.autoIncrement && 
               !['createdAt', 'updatedAt', 'dateSetStatusFree', 'dateSetStatusBusy', 'dateLastReboot'].includes(fieldName);
      });

      return {
        availableFields: importableFields
      };
    } catch (error) {
      logger.error('Error getting import config:', error);
      throw new Error('Ошибка получения конфигурации импорта');
    }
  }

  /**
   * Получить конфигурацию экспорта
   */
  async getExportConfig() {
    try {
      return {};
    } catch (error) {
      logger.error('Error getting export config:', error);
      throw new Error('Ошибка получения конфигурации экспорта');
    }
  }

  /**
   * Получить доступные поля для экспорта (динамически из модели)
   */
  async getExportFields() {
    try {
      const { Phone } = require('../models');
      const attributes = Phone.rawAttributes;

      const fields = Object.keys(attributes).map(fieldName => {
        const field = attributes[fieldName];
        return {
          key: fieldName,
          label: fieldName,
          type: field.type.constructor.name.toLowerCase(),
          required: fieldName === 'id' || fieldName === 'model' || fieldName === 'device',
          sensitive: false,
          description: '',
          defaultSelected: ['id', 'model', 'device', 'status'].includes(fieldName)
        };
      });

      return fields;
    } catch (error) {
      logger.error('Error getting export fields:', error);
      throw new Error('Ошибка получения полей для экспорта');
    }
  }

  /**
   * Импорт устройств из текста
   */
  async importFromText(params) {
    try {
      const { text, format, delimiter = '\n', options = {} } = params;

      if (!text || !format) {
        throw new ValidationError('Текст и формат обязательны');
      }

      const lines = text.split(delimiter).filter(line => line.trim());
      
      const results = {
        processed: lines.length,
        imported: 0,
        updated: 0,
        errors: 0,
        errorDetails: []
      };

      for (const line of lines) {
        try {
          const phoneData = this.parseImportLine(line.trim(), format);
          if (phoneData) {
            await this.createPhone(phoneData);
            results.imported++;
          }
        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            line: line.trim(),
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error importing phones from text:', error);
      throw error;
    }
  }

  /**
   * Универсальный экспорт
   */
  async export(params) {
    try {
      const { format = 'csv', ...otherParams } = params;

      switch (format) {
        case 'csv':
          return await this.exportCSV(otherParams);
        case 'json':
          return await this.exportJSON(otherParams);
        case 'txt':
          return await this.exportTXT(otherParams);
        default:
          throw new Error(`Неподдерживаемый формат: ${format}`);
      }
    } catch (error) {
      logger.error('Error exporting phones:', error);
      throw error;
    }
  }

  /**
   * Экспорт в CSV
   */
  async exportCSV(params) {
    try {
      const phones = await this.getPhoneDataForExport(params);
      const fields = params.fields || ['id', 'model', 'device', 'status'];
      
      let csv = '';
      if (params.include_headers !== false) {
        csv += fields.join(params.delimiter || ',') + '\n';
      }

      phones.forEach(phone => {
        const row = fields.map(field => phone[field] || '').join(params.delimiter || ',');
        csv += row + '\n';
      });

      return {
        content: csv,
        contentType: 'text/csv',
        filename: `phones_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      logger.error('Error exporting phones to CSV:', error);
      throw error;
    }
  }

  /**
   * Экспорт в JSON
   */
  async exportJSON(params) {
    try {
      const phones = await this.getPhoneDataForExport(params);
      const fields = params.fields;
      
      let data = phones;
      if (fields && Array.isArray(fields)) {
        data = phones.map(phone => {
          const filtered = {};
          fields.forEach(field => {
            filtered[field] = phone[field];
          });
          return filtered;
        });
      }

      return {
        content: JSON.stringify(data, null, 2),
        contentType: 'application/json',
        filename: `phones_${new Date().toISOString().split('T')[0]}.json`
      };
    } catch (error) {
      logger.error('Error exporting phones to JSON:', error);
      throw error;
    }
  }

  /**
   * Экспорт в TXT
   */
  async exportTXT(params) {
    try {
      const phones = await this.getPhoneDataForExport(params);
      
      let txt = '';
      phones.forEach(phone => {
        txt += `${phone.model || ''}:${phone.device || ''}\n`;
      });

      return {
        content: txt,
        contentType: 'text/plain',
        filename: `phones_${new Date().toISOString().split('T')[0]}.txt`
      };
    } catch (error) {
      logger.error('Error exporting phones to TXT:', error);
      throw error;
    }
  }

  // ========================================================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ========================================================================

  /**
   * Подготовить данные телефона для создания
   */
  preparePhoneData(phoneData) {
    const data = { ...phoneData };
    const now = new Date();

    if (data.status === 'free') {
      data.dateSetStatusFree = now;
      data.dateSetStatusBusy = null;
    } else if (data.status === 'busy') {
      data.dateSetStatusBusy = now;
      data.dateSetStatusFree = null;
    }

    data.dateLastReboot = now;
    return data;
  }

  /**
   * Обработать изменение статуса
   */
  handleStatusChange(updateData, currentStatus) {
    const data = { ...updateData };
    const now = new Date();

    if (data.status) {
      if (data.status === 'free') {
        data.dateSetStatusFree = now;
        data.dateSetStatusBusy = null;
      } else if (data.status === 'busy') {
        data.dateSetStatusBusy = now;
        data.dateSetStatusFree = null;
      }
    }

    return data;
  }

  /**
   * Парсинг строки импорта
   */
  parseImportLine(line, format) {
    try {
      switch (format) {
        case 'model:device':
          const [model, device] = line.split(':');
          return model && device ? { model, device } : null;
        
        case 'json':
          return JSON.parse(line);
        
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Получить данные телефонов для экспорта
   */
  async getPhoneDataForExport(params) {
    try {
      const { selectedIds, filters, export_type } = params;

      if (export_type === 'selected' && selectedIds && selectedIds.length > 0) {
        return await this.phoneRepository.findByIds(selectedIds);
      }

      return await this.phoneRepository.findAll(filters || {});
    } catch (error) {
      logger.error('Error getting phone data for export:', error);
      throw error;
    }
  }
}

module.exports = PhoneService;