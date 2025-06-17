const express = require('express');
const proxyController = require('../controllers/proxyController');
const { validateProxy } = require('../validators/proxyValidator');

const router = express.Router();

// GET /api/proxies - получить список прокси
router.get('/', proxyController.getProxies);

// GET /api/proxies/:id - получить прокси по ID
router.get('/:id', proxyController.getProxy);

// POST /api/proxies - создать новый прокси
router.post('/', validateProxy, proxyController.createProxy);

// PUT /api/proxies/:id - обновить прокси
router.put('/:id', validateProxy, proxyController.updateProxy);

// DELETE /api/proxies/:id - удалить прокси
router.delete('/:id', proxyController.deleteProxy);

// POST /api/proxies/:id/toggle - переключить статус прокси
router.post('/:id/toggle', proxyController.toggleProxyStatus);

module.exports = router;