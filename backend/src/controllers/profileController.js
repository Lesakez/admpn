const { Profile, Activity, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Создать профили (пакетно)
const createProfiles = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const profiles = req.body;
    
    if (!Array.isArray(profiles)) {
      return res.status(400).json({
        success: false,
        error: 'Ожидается массив профилей'
      });
    }

    // Проверяем дубликаты profileId
    const existingProfiles = await Profile.findAll({
      where: {
        profileId: { [Op.in]: profiles.map(p => p.profileId) }
      },
      transaction
    });

    const existingIds = existingProfiles.map(p => p.profileId);
    const newProfiles = profiles.filter(p => !existingIds.includes(p.profileId));
    const duplicates = profiles.filter(p => existingIds.includes(p.profileId));

    if (newProfiles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Все профили уже существуют',
        details: { duplicates: duplicates.length }
      });
    }

    // Создаем новые профили
    const createdProfiles = await Profile.bulkCreate(newProfiles, { 
      transaction,
      validate: true 
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Создано ${createdProfiles.length} профилей`,
      entityType: 'profile',
      entityId: 0,
      actionType: 'bulk_create',
      metadata: {
        count: createdProfiles.length,
        duplicates: duplicates.length
      }
    }, { transaction });

    await transaction.commit();

    logger.info('Profiles created', { 
      created: createdProfiles.length,
      duplicates: duplicates.length 
    });

    res.status(201).json({
      success: true,
      data: {
        created: createdProfiles.length,
        duplicates: duplicates.length,
        profiles: createdProfiles
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Получить список профилей
const getProfiles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      folderName,
      userId,
      search,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (folderName) {
      if (folderName === '[Пусто]') {
        where[Op.or] = [
          { folderName: '' },
          { folderName: null }
        ];
      } else {
        where.folderName = folderName;
      }
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { profileId: { [Op.like]: `%${search}%` } },
        { userId: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Profile.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        profiles: rows,
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

// Получить профиль по ID
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const profile = await Profile.findByPk(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профиль не найден'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Обновить профиль
const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const profile = await Profile.findByPk(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профиль не найден'
      });
    }

    const oldData = { ...profile.dataValues };
    await profile.update(req.body);

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Обновлен профиль: ${profile.name}`,
      entityType: 'profile',
      entityId: profile.id,
      actionType: 'update',
      metadata: {
        oldData: oldData,
        newData: req.body
      }
    });

    logger.info('Profile updated', { profileId: profile.id, name: profile.name });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Обновить профили (пакетно)
const updateProfiles = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const profiles = req.body;
    
    if (!Array.isArray(profiles)) {
      return res.status(400).json({
        success: false,
        error: 'Ожидается массив профилей'
      });
    }

    let updatedCount = 0;

    for (const profileData of profiles) {
      const profile = await Profile.findOne({
        where: { profileId: profileData.profileId },
        transaction
      });

      if (profile) {
        await profile.update(profileData, { transaction });
        updatedCount++;
      }
    }

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Обновлено ${updatedCount} профилей`,
      entityType: 'profile',
      entityId: 0,
      actionType: 'bulk_update',
      metadata: {
        count: updatedCount
      }
    }, { transaction });

    await transaction.commit();

    logger.info('Profiles bulk updated', { count: updatedCount });

    res.json({
      success: true,
      data: {
        updated: updatedCount
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Удалить профиль
const deleteProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const profile = await Profile.findByPk(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профиль не найден'
      });
    }

    const deletedData = { name: profile.name, id: profile.id };

    await profile.destroy();

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Удален профиль: ${deletedData.name}`,
      entityType: 'profile',
      entityId: deletedData.id,
      actionType: 'delete'
    });

    logger.info('Profile deleted', { profileId: deletedData.id, name: deletedData.name });

    res.json({
      success: true,
      message: 'Профиль успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

// Получить папки
const getFolders = async (req, res, next) => {
  try {
    const folders = await Profile.findAll({
      attributes: [
        'folderName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        folderName: { [Op.not]: null }
      },
      group: ['folderName'],
      order: [['folderName', 'ASC']]
    });

    const folderList = folders.map(folder => ({
      name: folder.folderName || 'Без папки',
      count: parseInt(folder.dataValues.count)
    }));

    res.json({
      success: true,
      data: folderList
    });
  } catch (error) {
    next(error);
  }
};

// Создать папку
const createFolder = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Название папки обязательно'
      });
    }

    // Проверяем, не существует ли уже папка
    const existingProfile = await Profile.findOne({
      where: { folderName: name }
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        error: `Папка с именем '${name}' уже существует`
      });
    }

    // Создаем временный профиль для папки
    const profile = await Profile.create({
      profileId: `temp-${name}-${Date.now()}`,
      name: 'Temporary Profile for Folder',
      folderName: name,
      workspaceId: '0',
      workspaceName: 'Default',
      proxy: 'none'
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Создана папка: ${name}`,
      entityType: 'folder',
      entityId: 0,
      actionType: 'create'
    });

    logger.info('Folder created', { folderName: name });

    res.status(201).json({
      success: true,
      data: {
        message: `Папка '${name}' успешно создана`,
        folder: name
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfiles,
  getProfiles,
  getProfile,
  updateProfile,
  updateProfiles,
  deleteProfile,
  getFolders,
  createFolder
};