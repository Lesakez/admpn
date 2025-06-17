const express = require('express');
const zennoposterController = require('../controllers/zennoposterController');

const router = express.Router();

// === УСТРОЙСТВА ===
// GET /api/zp/free-phone - получить свободный телефон
router.get('/free-phone', zennoposterController.getFreePhone);

// POST /api/zp/free-phone/:id - освободить телефон
router.post('/free-phone/:id', zennoposterController.releasePhone);

// === ПРОКСИ ===
// GET /api/zp/free-proxy - получить свободный прокси
router.get('/free-proxy', zennoposterController.getFreeProxy);

// POST /api/zp/free-proxy/:id - освободить прокси
router.post('/free-proxy/:id', zennoposterController.releaseProxy);

// POST /api/zp/change-ip/:id - сменить IP прокси
router.post('/change-ip/:id', zennoposterController.changeProxyIP);

// === АККАУНТЫ ===
// GET /api/zp/free-old-account - получить свободный аккаунт
router.get('/free-old-account', zennoposterController.getFreeAccount);

// POST /api/zp/release-old-account/:id - освободить аккаунт
router.post('/release-old-account/:id', zennoposterController.releaseAccount);

// POST /api/zp/update-old-account/:id - обновить аккаунт
router.post('/update-old-account/:id', zennoposterController.updateAccount);

// GET /api/zp/old-accounts/count - количество аккаунтов
router.get('/old-accounts/count', zennoposterController.getAccountsCount);

// POST /api/zp/old-accounts/bulk-status - массовое обновление статуса
router.post('/old-accounts/bulk-status', zennoposterController.bulkUpdateAccountsStatus);

// === ПРОФИЛИ ===
// GET /api/zp/profile-by-account/:user_id - получить профиль по user_id
router.get('/profile-by-account/:user_id', zennoposterController.getProfileByAccount);

// POST /api/zp/update-profile-account-status/:user_id - обновить статус профиля
router.post('/update-profile-account-status/:user_id', zennoposterController.updateProfileAccountStatus);

// GET /api/zp/random-profile-account - получить случайный профиль
router.get('/random-profile-account', zennoposterController.getRandomProfileAccount);

// === ПРОЕКТЫ ===
// GET /api/zp/project/:name - получить проект по имени
router.get('/project/:name', zennoposterController.getProjectByName);

// GET /api/zp/stock-project - получить стоковый проект
router.get('/stock-project', zennoposterController.getStockProject);

// === КОНФИГУРАЦИЯ ===
// POST /api/zp/config/timeout - установить таймаут ресурсов
router.post('/config/timeout', zennoposterController.setResourceTimeout);

// === СТАТИСТИКА ===
// POST /api/zp/stat - добавить статистику
router.post('/stat', zennoposterController.addStat);

// POST /api/zp/account - сохранить аккаунт
router.post('/account', zennoposterController.saveAccount);

module.exports = router;