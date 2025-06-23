// backend/src/controllers/phoneController.js

const PhoneService = require('../services/PhoneService');
const logger = require('../utils/logger');

/**
 * КОНТРОЛЛЕР ТЕЛЕФОНОВ С ИМПОРТОМ/ЭКСПОРТОМ
 * 
 * Тонкий контроллер, вся логика в сервисах
 * Динамическое получение метаданных модели
 */

class PhoneController {
  constructor() {
    this.phoneService = new PhoneService();
  }

  /**
   * Получить список телефонов
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
   * Массовое удаление
   */
  bulkDeletePhones = async (req, res, next) => {
    try {
      const { ids } = req.body;
      const result = await this.phoneService.bulkDelete(ids);
      
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

  // ======================
  // МЕТОДЫ ИМПОРТА/ЭКСПОРТА
  // ======================

  /**
   * Получить конфигурацию импорта
   * Возвращает форматы, разделители и настройки
   */
  getImportConfig = async (req, res, next) => {
    try {
      const config = await this.phoneService.getImportConfig();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Получить конфигурацию экспорта
   * Возвращает типы экспорта, форматы и настройки
   */
  getExportConfig = async (req, res, next) => {
    try {
      const config = await this.phoneService.getExportConfig();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Получить доступные поля для экспорта
   * Динамически получает поля из модели
   */
  getExportFields = async (req, res, next) => {
    try {
      const fields = await this.phoneService.getExportFields();
      
      res.json({
        success: true,
        data: fields
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Импорт телефонов из текста
   */
  importPhonesFromText = async (req, res, next) => {
    try {
      const { text, format, delimiter, options } = req.body;
      
      const result = await this.phoneService.importFromText({
        text,
        format,
        delimiter,
        options
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Универсальный экспорт телефонов
   */
  exportPhones = async (req, res, next) => {
    try {
      const params = req.body;
      const result = await this.phoneService.export(params);
      
      // Если это файл для скачивания
      if (result.filename && result.content) {
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('Content-Type', result.contentType);
        return res.send(result.content);
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Экспорт в CSV
   */
  exportPhonesCSV = async (req, res, next) => {
    try {
      const params = { ...req.query, format: 'csv' };
      const result = await this.phoneService.exportCSV(params);
      
      res.setHeader('Content-Disposition', `attachment; filename="phones_${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.send(result.content);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Экспорт в JSON
   */
  exportPhonesJSON = async (req, res, next) => {
    try {
      const params = { ...req.query, format: 'json' };
      const result = await this.phoneService.exportJSON(params);
      
      res.setHeader('Content-Disposition', `attachment; filename="phones_${new Date().toISOString().split('T')[0]}.json"`);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(result.content);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Экспорт в TXT
   */
  exportPhonesTXT = async (req, res, next) => {
    try {
      const params = { ...req.query, format: 'txt' };
      const result = await this.phoneService.exportTXT(params);
      
      res.setHeader('Content-Disposition', `attachment; filename="phones_${new Date().toISOString().split('T')[0]}.txt"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(result.content);
    } catch (error) {
      next(error);
    }
  };
}

// Создаем единственный экземпляр контроллера
const phoneController = new PhoneController();

// Экспортируем методы для использования в роутах
module.exports = {
  // Основные CRUD операции
  getPhones: phoneController.getPhones,
  getPhone: phoneController.getPhone,
  createPhone: phoneController.createPhone,
  updatePhone: phoneController.updatePhone,
  deletePhone: phoneController.deletePhone,
  
  // Операции со статусом
  togglePhoneStatus: phoneController.togglePhoneStatus,
  rebootPhone: phoneController.rebootPhone,
  
  // Статистика и поиск
  getPhoneStats: phoneController.getPhoneStats,
  searchPhones: phoneController.searchPhones,
  
  // Массовые операции
  bulkUpdateStatus: phoneController.bulkUpdateStatus,
  bulkDeletePhones: phoneController.bulkDeletePhones,
  
  // Импорт/Экспорт конфигурация
  getImportConfig: phoneController.getImportConfig,
  getExportConfig: phoneController.getExportConfig,
  getExportFields: phoneController.getExportFields,
  
  // Импорт/Экспорт операции
  importPhonesFromText: phoneController.importPhonesFromText,
  exportPhones: phoneController.exportPhones,
  exportPhonesCSV: phoneController.exportPhonesCSV,
  exportPhonesJSON: phoneController.exportPhonesJSON,
  exportPhonesTXT: phoneController.exportPhonesTXT,
};