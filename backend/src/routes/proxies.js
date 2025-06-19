const express = require('express');
const proxyController = require('../controllers/proxyController');
const { validateProxy } = require('../validators/proxyValidator');

const router = express.Router();

// GET /api/proxies - получить список прокси
router.get('/', proxyController.getProxies);

// GET /api/proxies/stats - статистика прокси (ДОБАВЛЕНО)
router.get('/stats', proxyController.getProxyStats);

// GET /api/proxies/:id - получить прокси по ID
router.get('/:id', proxyController.getProxy);

// POST /api/proxies - создать новый прокси
router.post('/', validateProxy, proxyController.createProxy);

// PUT /api/proxies/:id - обновить прокси
router.put('/:id', validateProxy, proxyController.updateProxy);

// DELETE /api/proxies/:id - удалить прокси
router.delete('/:id', proxyController.deleteProxy);

// POST /api/proxies/:id/toggle-status - переключить статус прокси
router.post('/:id/toggle-status', proxyController.toggleProxyStatus);

// POST /api/proxies/bulk-delete - массовое удаление
router.post('/bulk-delete', proxyController.bulkDeleteProxies);

// POST /api/proxies/bulk-update-status - массовое обновление статуса
router.post('/bulk-update-status', proxyController.bulkUpdateStatus);

module.exports = router;