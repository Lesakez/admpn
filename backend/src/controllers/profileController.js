const { Profile, Project } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Получить список профилей с фильтрацией и пагинацией
const getProfiles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { folder_name: { [Op.like]: `%${search}%` } },
        { workspace_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Profile.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      attributes: [
        'id',
        'profile_id',
        'name',
        'folder_id',
        'folder_name', 
        'workspace_id',
        'workspace_name',
        'proxy',
        'user_id',
        'status',
        'created_at',
        'updated_at'
      ]
    });

    // Преобразуем данные для frontend (snake_case -> camelCase)
    const profiles = rows.map(profile => ({
      id: profile.id,
      profileId: profile.profile_id,
      profileName: profile.name, // ИСПРАВЛЕНО: name это название профиля
      folderId: profile.folder_id,
      folderName: profile.folder_name,
      workspaceId: profile.workspace_id,
      workspaceName: profile.workspace_name,
      proxy: profile.proxy,
      userId: profile.user_id,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }));

    res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
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
    
    const profile = await Profile.findByPk(id, {
      attributes: [
        'id',
        'profile_id',
        'name',
        'folder_id',
        'folder_name', 
        'workspace_id',
        'workspace_name',
        'proxy',
        'user_id',
        'status',
        'created_at',
        'updated_at'
      ]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профиль не найден'
      });
    }

    res.json({
      success: true,
      data: {
        id: profile.id,
        profileId: profile.profile_id,
        profileName: profile.name,
        folderId: profile.folder_id,
        folderName: profile.folder_name,
        workspaceId: profile.workspace_id,
        workspaceName: profile.workspace_name,
        proxy: profile.proxy,
        userId: profile.user_id,
        status: profile.status,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Создать новые профили (пакетно)
const createProfiles = async (req, res, next) => {
  try {
    // Поддерживаем как один профиль, так и массив
    const profilesData = Array.isArray(req.body) ? req.body : [req.body];
    
    const createdProfiles = [];
    
    for (const profileData of profilesData) {
      // Преобразуем camelCase в snake_case для БД
      const dbData = {
        profile_id: profileData.profileId || null,
        name: profileData.profileName, // ИСПРАВЛЕНО: name это название профиля
        folder_id: profileData.folderId || null,
        folder_name: profileData.folderName,
        workspace_id: profileData.workspaceId,
        workspace_name: profileData.workspaceName,
        proxy: profileData.proxy || null,
        user_id: profileData.userId || null,
        status: profileData.status || 'created'
      };

      const profile = await Profile.create(dbData);
      
      // Преобразуем обратно в camelCase для ответа
      createdProfiles.push({
        id: profile.id,
        profileId: profile.profile_id,
        profileName: profile.name,
        folderId: profile.folder_id,
        folderName: profile.folder_name,
        workspaceId: profile.workspace_id,
        workspaceName: profile.workspace_name,
        proxy: profile.proxy,
        userId: profile.user_id,
        status: profile.status,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      });
    }
    
    logger.info('Profiles created successfully', { count: createdProfiles.length });

    res.status(201).json({
      success: true,
      data: createdProfiles.length === 1 ? createdProfiles[0] : createdProfiles
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

    // Преобразуем camelCase в snake_case для БД
    const updateData = {};
    if (req.body.profileId !== undefined) updateData.profile_id = req.body.profileId;
    if (req.body.profileName !== undefined) updateData.name = req.body.profileName;
    if (req.body.folderId !== undefined) updateData.folder_id = req.body.folderId;
    if (req.body.folderName !== undefined) updateData.folder_name = req.body.folderName;
    if (req.body.workspaceId !== undefined) updateData.workspace_id = req.body.workspaceId;
    if (req.body.workspaceName !== undefined) updateData.workspace_name = req.body.workspaceName;
    if (req.body.proxy !== undefined) updateData.proxy = req.body.proxy;
    if (req.body.userId !== undefined) updateData.user_id = req.body.userId;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    await profile.update(updateData);
    
    logger.info('Profile updated successfully', { profileId: id });

    res.json({
      success: true,
      data: {
        id: profile.id,
        profileId: profile.profile_id,
        profileName: profile.name,
        folderId: profile.folder_id,
        folderName: profile.folder_name,
        workspaceId: profile.workspace_id,
        workspaceName: profile.workspace_name,
        proxy: profile.proxy,
        userId: profile.user_id,
        status: profile.status,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Обновить профили пакетно
const updateProfiles = async (req, res, next) => {
  try {
    const profilesData = Array.isArray(req.body) ? req.body : [req.body];
    
    const updatedProfiles = [];
    
    for (const profileData of profilesData) {
      if (!profileData.id) {
        continue; // Пропускаем записи без ID
      }
      
      const profile = await Profile.findByPk(profileData.id);
      if (!profile) {
        continue; // Пропускаем несуществующие профили
      }

      // Преобразуем camelCase в snake_case для БД
      const updateData = {};
      if (profileData.profileId !== undefined) updateData.profile_id = profileData.profileId;
      if (profileData.profileName !== undefined) updateData.name = profileData.profileName;
      if (profileData.folderId !== undefined) updateData.folder_id = profileData.folderId;
      if (profileData.folderName !== undefined) updateData.folder_name = profileData.folderName;
      if (profileData.workspaceId !== undefined) updateData.workspace_id = profileData.workspaceId;
      if (profileData.workspaceName !== undefined) updateData.workspace_name = profileData.workspaceName;
      if (profileData.proxy !== undefined) updateData.proxy = profileData.proxy;
      if (profileData.userId !== undefined) updateData.user_id = profileData.userId;
      if (profileData.status !== undefined) updateData.status = profileData.status;

      await profile.update(updateData);
      
      updatedProfiles.push({
        id: profile.id,
        profileId: profile.profile_id,
        profileName: profile.name,
        folderId: profile.folder_id,
        folderName: profile.folder_name,
        workspaceId: profile.workspace_id,
        workspaceName: profile.workspace_name,
        proxy: profile.proxy,
        userId: profile.user_id,
        status: profile.status,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      });
    }
    
    logger.info('Profiles updated successfully', { count: updatedProfiles.length });

    res.json({
      success: true,
      data: updatedProfiles
    });
  } catch (error) {
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

    await profile.destroy();
    
    logger.info('Profile deleted successfully', { profileId: id });

    res.json({
      success: true,
      message: 'Профиль успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику профилей
const getProfileStats = async (req, res, next) => {
  try {
    // Получаем статистику по статусам
    const statusStats = await Profile.findAll({
      attributes: [
        'status',
        [Profile.sequelize.fn('COUNT', Profile.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Общая статистика
    const total = await Profile.count();

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое удаление профилей
const bulkDeleteProfiles = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив ID обязателен'
      });
    }

    const deletedCount = await Profile.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    logger.info('Bulk delete profiles', { count: deletedCount });

    res.json({
      success: true,
      data: {
        deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое обновление статуса
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив ID обязателен'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус обязателен'
      });
    }

    const [updatedCount] = await Profile.update(
      { status },
      {
        where: {
          id: {
            [Op.in]: ids
          }
        }
      }
    );

    logger.info('Bulk update profile status', { count: updatedCount, status });

    res.json({
      success: true,
      data: {
        updatedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfiles,
  getProfile,
  createProfiles,
  updateProfile,
  updateProfiles,
  deleteProfile,
  getProfileStats,
  bulkDeleteProfiles,
  bulkUpdateStatus
};