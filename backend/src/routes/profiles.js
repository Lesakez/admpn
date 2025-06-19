const express = require('express');
const profileController = require('../controllers/profileController');
const { validateProfile, validateProfiles } = require('../validators/profileValidator');

const router = express.Router();

// GET /api/profiles - получить список профилей
router.get('/', profileController.getProfiles);

// GET /api/profiles/stats - статистика профилей
router.get('/stats', profileController.getProfileStats);

// GET /api/profiles/:id - получить профиль по ID
router.get('/:id', profileController.getProfile);

// POST /api/profiles - создать профили (пакетно)
router.post('/', validateProfiles, profileController.createProfiles);

// PUT /api/profiles/:id - обновить профиль
router.put('/:id', validateProfile, profileController.updateProfile);

// POST /api/profiles/update - обновить профили пакетно
router.post('/update', validateProfiles, profileController.updateProfiles);

// DELETE /api/profiles/:id - удалить профиль
router.delete('/:id', profileController.deleteProfile);

// POST /api/profiles/bulk-delete - массовое удаление
router.post('/bulk-delete', profileController.bulkDeleteProfiles);

// POST /api/profiles/bulk-update-status - массовое обновление статуса
router.post('/bulk-update-status', profileController.bulkUpdateStatus);

module.exports = router;