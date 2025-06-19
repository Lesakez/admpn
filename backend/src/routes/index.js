const express = require('express');
const rateLimit = require('express-rate-limit');

// Import route modules
const accountRoutes = require('./accounts');
const profileRoutes = require('./profiles');
const proxyRoutes = require('./proxies');
const projectRoutes = require('./projects');
const phoneRoutes = require('./phones');
const zennoposterRoutes = require('./zennoposter');
const activityRoutes = require('./activity');
const otpRoutes = require('./otp');
const configRoutes = require('./config'); // Подключаем config routes

const router = express.Router();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

router.use(limiter);

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'AdminPanel ZDE API',
    version: '1.0.0',
    description: 'Backend API for ZennoPoster and Account Management',
    endpoints: {
      accounts: '/api/accounts',
      profiles: '/api/profiles',
      proxies: '/api/proxies',
      projects: '/api/projects',
      phones: '/api/phones',
      zennoposter: '/api/zp',
      activity: '/api/activity',
      otp: '/api/otp',
      config: '/api/config' // Добавляем config в список эндпоинтов
    }
  });
});

// Mount routes
router.use('/accounts', accountRoutes);
router.use('/old-accounts', accountRoutes); // Compatibility with old API
router.use('/profiles', profileRoutes);
router.use('/proxies', proxyRoutes);
router.use('/projects', projectRoutes);
router.use('/phones', phoneRoutes);
router.use('/zp', zennoposterRoutes);
router.use('/activity', activityRoutes);
router.use('/otp', otpRoutes);
router.use('/config', configRoutes); // Подключаем config routes

module.exports = router;