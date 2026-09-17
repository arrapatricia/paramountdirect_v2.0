const path = require('node:path');
const root = path.resolve(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'pdv2-api',
      cwd: path.join(root, 'server'),
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      time: true,
      restart_delay: 3000,
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: 4000 },
    },
    {
      name: 'pdv2-web',
      script: 'serve',
      time: true,
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: path.join(root, 'paramountdirect_v2', 'dist'),
        PM2_SERVE_HOST: '127.0.0.1',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html',
      },
    },
  ],
};
