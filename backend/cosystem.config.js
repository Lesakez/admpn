module.exports = {
  apps: [
    {
      name: 'adminpanel-backend',
      script: 'src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // Настройки автоперезапуска
      watch: false,
      max_memory_restart: '1G',
      
      // Логирование
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Поведение при сбоях
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Дополнительные настройки
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    }
  ]
};