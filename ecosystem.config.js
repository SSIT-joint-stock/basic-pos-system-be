
module.exports = {
  apps: [
    {
      name: 'basic-pos-system-be',
      script: 'make prod',
      max_memory_restart: '512M',
      watch: false,
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};