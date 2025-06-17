const express = require('express');
const otpController = require('../controllers/otpController');

const router = express.Router();

// POST /api/otp/generate - генерировать OTP код
router.post('/generate', otpController.generateOTP);

// POST /api/otp/validate - валидировать OTP код
router.post('/validate', otpController.validateOTP);

// GET /api/otp/secret - генерировать секретный ключ
router.get('/secret', otpController.generateSecret);

module.exports = router;