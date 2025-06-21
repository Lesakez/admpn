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
      // Подготавливаем данные с правильными датами статуса
      const preparedData = this.preparePhoneData(phoneData);
      
      const phone = await this.phoneRepository.create(preparedData);

      // Логируем создание
      await this.activityService.logPhoneActivity(
        phone.id,
        'create',
        `Создано устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`
      );

      logger.info('Phone created successfully', { phoneId: phone.id, model: phone.model });

      // Возвращаем с проектом
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
      
      // Обрабатываем изменение статуса
      if (updateData.status && updateData.status !== phone.status) {
        updateData = this.handleStatusChange(updateData, phone.status);
      }

      await this.phoneRepository.update(id, updateData);

      // Логируем обновление
      await this.activityService.logPhoneActivity(
        phone.id,
        'update',
        `Обновлено устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`
      );

      logger.info('Phone updated successfully', { phoneId: phone.id });

      // Возвращаем обновленный телефон
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

      // Логируем удаление
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

      // Логируем изменение статуса
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

      // Возвращаем обновленный телефон
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

      // Логируем перезагрузку
      await this.activityService.logPhoneActivity(
        phone.id,
        'reboot',
        `Перезагружено устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`
      );

      logger.info('Phone rebooted successfully', { phoneId: phone.id });

      // Возвращаем обновленный телефон
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
      
      // Преобразуем в удобный формат
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

      // Логируем массовое обновление
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

  // ========================================================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ========================================================================

  /**
   * Подготовить данные телефона для создания
   */
  preparePhoneData(phoneData) {
    const data = { ...phoneData };
    const now = new Date();

    // Устанавливаем правильные даты для статуса
    if (data.status === 'free') {
      data.dateSetStatusFree = now;
      data.dateSetStatusBusy = null;
    } else if (data.status === 'busy') {
      data.dateSetStatusBusy = now;
      data.dateSetStatusFree = null;
    }

    // Устанавливаем дату последней перезагрузки
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
}

module.exports = PhoneService;