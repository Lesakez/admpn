const { Phone, Project, Activity, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Получить список телефонов
const getPhones = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      projectId,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where[Op.or] = [
        { model: { [Op.like]: `%${search}%` } },
        { device: { [Op.like]: `%${search}%` } },
        { androidVersion: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Phone.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        phones: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить телефон по ID
const getPhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const phone = await Phone.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Устройство не найдено'
      });
    }

    res.json({
      success: true,
      data: phone
    });
  } catch (error) {
    next(error);
  }
};

// Создать телефон
const createPhone = async (req, res, next) => {
  try {
    const phoneData = {
      ...req.body,
      dateSetStatusFree: req.body.status === 'free' ? new Date() : null,
      dateSetStatusBusy: req.body.status === 'busy' ? new Date() : null,
      dateLastReboot: new Date()
    };

    const phone = await Phone.create(phoneData);

    // Логируем активность БЕЗ metadata
    await Activity.create({
      timestamp: new Date(),
      description: `Создано устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`,
      entityType: 'phone',
      entityId: phone.id,
      actionType: 'create'
    });

    logger.info('Phone created', { phoneId: phone.id, model: phone.model });

    // Получаем созданный телефон с проектом
    const createdPhone = await Phone.findByPk(phone.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdPhone
    });
  } catch (error) {
    next(error);
  }
};

// Обновить телефон
const updatePhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const phone = await Phone.findByPk(id);
    
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Устройство не найдено'
      });
    }

    const oldData = { ...phone.dataValues };
    
    // Обновляем даты статуса при изменении статуса
    if (req.body.status && req.body.status !== phone.status) {
      const now = new Date();
      if (req.body.status === 'free') {
        req.body.dateSetStatusFree = now;
        req.body.dateSetStatusBusy = null;
      } else if (req.body.status === 'busy') {
        req.body.dateSetStatusBusy = now;
        req.body.dateSetStatusFree = null;
      }
    }

    await phone.update(req.body);

    // Логируем активность БЕЗ metadata
    await Activity.create({
      timestamp: new Date(),
      description: `Обновлено устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`,
      entityType: 'phone',
      entityId: phone.id,
      actionType: 'update'
    });

    logger.info('Phone updated', { phoneId: phone.id, model: phone.model });

    // Получаем обновленный телефон с проектом
    const updatedPhone = await Phone.findByPk(phone.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedPhone
    });
  } catch (error) {
    next(error);
  }
};

// Удалить телефон
const deletePhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const phone = await Phone.findByPk(id);
    
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Устройство не найдено'
      });
    }

    const deletedData = { 
      model: phone.model || phone.device || `ID: ${phone.id}`,
      id: phone.id 
    };

    await phone.destroy();

    // Логируем активность БЕЗ metadata
    await Activity.create({
      timestamp: new Date(),
      description: `Удалено устройство: ${deletedData.model}`,
      entityType: 'phone',
      entityId: deletedData.id,
      actionType: 'delete'
    });

    logger.info('Phone deleted', { phoneId: deletedData.id, model: deletedData.model });

    res.json({
      success: true,
      message: 'Устройство успешно удалено'
    });
  } catch (error) {
    next(error);
  }
};

// Переключить статус телефона
const togglePhoneStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const phone = await Phone.findByPk(id);
    
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Устройство не найдено'
      });
    }

    const oldStatus = phone.status;
    const newStatus = phone.status === 'free' ? 'busy' : 'free';
    const now = new Date();

    const updateData = { status: newStatus };
    
    if (newStatus === 'free') {
      updateData.dateSetStatusFree = now;
      updateData.dateSetStatusBusy = null;
    } else {
      updateData.dateSetStatusBusy = now;
      updateData.dateSetStatusFree = null;
    }

    await phone.update(updateData);

    // Логируем активность БЕЗ metadata
    await Activity.create({
      timestamp: new Date(),
      description: `Изменен статус устройства ${phone.model || phone.device || `ID: ${phone.id}`} с "${oldStatus}" на "${newStatus}"`,
      entityType: 'phone',
      entityId: phone.id,
      actionType: 'status_toggle'
    });

    logger.info('Phone status toggled', { 
      phoneId: phone.id, 
      model: phone.model,
      oldStatus: oldStatus,
      newStatus: newStatus 
    });

    // Получаем обновленный телефон с проектом
    const updatedPhone = await Phone.findByPk(phone.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedPhone
    });
  } catch (error) {
    next(error);
  }
};

// Перезагрузить телефон
const rebootPhone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const phone = await Phone.findByPk(id);
    
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Устройство не найдено'
      });
    }

    // Обновляем время последней перезагрузки
    await phone.update({
      dateLastReboot: new Date()
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Перезагружено устройство: ${phone.model || phone.device || `ID: ${phone.id}`}`,
      entityType: 'phone',
      entityId: phone.id,
      actionType: 'reboot'
    });

    logger.info('Phone rebooted', { phoneId: phone.id, model: phone.model });

    // Получаем обновленный телефон с проектом
    const updatedPhone = await Phone.findByPk(phone.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedPhone,
      message: 'Устройство перезагружено'
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику телефонов
const getPhoneStats = async (req, res, next) => {
  try {
    const stats = await Phone.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const totalCount = await Phone.count();

    // Формируем статистику по статусам
    const statusCounts = {
      total: totalCount,
      free: 0,
      busy: 0,
      disabled: 0
    };

    stats.forEach(stat => {
      if (stat.status && statusCounts.hasOwnProperty(stat.status)) {
        statusCounts[stat.status] = parseInt(stat.count);
      }
    });

    res.json({
      success: true,
      data: statusCounts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPhones,
  getPhone,
  createPhone,
  updatePhone,
  deletePhone,
  togglePhoneStatus,
  rebootPhone,
  getPhoneStats
};