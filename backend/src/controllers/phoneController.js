const PhoneService = require('../services/PhoneService');
const logger = require('../utils/logger');

/**
 * РЕФАКТОРИНГ КОНТРОЛЛЕРА ТЕЛЕФОНОВ
 * 
 * ДО: Толстый контроллер с 50+ строк логики в каждом методе
 * ПОСЛЕ: Тонкий контроллер, вся логика в сервисах
 * 
 * ПРЕИМУЩЕСТВА:
 * ✅ Легко тестировать
 * ✅ Переиспользуемая логика
 * ✅ Четкое разделение ответственности
 * ✅ Централизованная обработка ошибок
 * ✅ Единообразные ответы API
 */

class PhoneController {
  constructor() {
    this.phoneService = new PhoneService();
  }

  /**
   * Получить список телефонов
   * ДО: 25+ строк с фильтрацией и запросами
   * ПОСЛЕ: 5 строк, вся логика в сервисе
   */
  getPhones = async (req, res, next) => {
    try {
      const { page, limit, status, projectId, search, ...otherFilters } = req.query;
      
      const filters = { status, projectId, search, ...otherFilters };
      const pagination = { page, limit };
      
      const result = await this.phoneService.getPhones(filters, pagination);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Получить телефон по ID
   * ДО: 15+ строк с проверками и включениями
   * ПОСЛЕ: 3 строки
   */
  getPhone = async (req, res, next) => {
    try {
      const phone = await this.phoneService.getPhoneById(req.params.id);
      
      res.json({
        success: true,
        data: phone
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Создать телефон
   * ДО: 30+ строк с подготовкой данных и логированием
   * ПОСЛЕ: 3 строки
   */
  createPhone = async (req, res, next) => {
    try {
      const phone = await this.phoneService.createPhone(req.body);
      
      res.status(201).json({
        success: true,
        data: phone
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Обновить телефон
   * ДО: 35+ строк с логикой обновления статуса
   * ПОСЛЕ: 3 строки
   */
  updatePhone = async (req, res, next) => {
    try {
      const phone = await this.phoneService.updatePhone(req.params.id, req.body);
      
      res.json({
        success: true,
        data: phone
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Удалить телефон
   * ДО: 20+ строк с логированием
   * ПОСЛЕ: 3 строки
   */
  deletePhone = async (req, res, next) => {
    try {
      const result = await this.phoneService.deletePhone(req.params.id);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Переключить статус телефона
   * ДО: 40+ строк сложной логики
   * ПОСЛЕ: 3 строки
   */
  togglePhoneStatus = async (req, res, next) => {
    try {
      const phone = await this.phoneService.togglePhoneStatus(req.params.id);
      
      res.json({
        success: true,
        data: phone
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Перезагрузить телефон
   * ДО: 25+ строк с обновлением и логированием
   * ПОСЛЕ: 3 строки
   */
  rebootPhone = async (req, res, next) => {
    try {
      const phone = await this.phoneService.rebootPhone(req.params.id);
      
      res.json({
        success: true,
        data: phone,
        message: 'Устройство успешно перезагружено'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Получить статистику телефонов
   * Новый метод для дашборда
   */
  getPhoneStats = async (req, res, next) => {
    try {
      const stats = await this.phoneService.getPhoneStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Массовое обновление статуса
   * Новый метод для управления несколькими устройствами
   */
  bulkUpdateStatus = async (req, res, next) => {
    try {
      const { phoneIds, status } = req.body;
      const result = await this.phoneService.bulkUpdateStatus(phoneIds, status);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Поиск телефонов
   * Новый метод для быстрого поиска
   */
  searchPhones = async (req, res, next) => {
    try {
      const { q: searchText, limit = 10 } = req.query;
      
      if (!searchText || searchText.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const phones = await this.phoneService.searchPhones(searchText, { limit });
      
      res.json({
        success: true,
        data: phones
      });
    } catch (error) {
      next(error);
    }
  };
}

// Создаем единственный экземпляр контроллера
const phoneController = new PhoneController();

// Экспортируем методы для использования в роутах
module.exports = {
  getPhones: phoneController.getPhones,
  getPhone: phoneController.getPhone,
  createPhone: phoneController.createPhone,
  updatePhone: phoneController.updatePhone,
  deletePhone: phoneController.deletePhone,
  togglePhoneStatus: phoneController.togglePhoneStatus,
  rebootPhone: phoneController.rebootPhone,
  getPhoneStats: phoneController.getPhoneStats,
  bulkUpdateStatus: phoneController.bulkUpdateStatus,
  searchPhones: phoneController.searchPhones
};