const { createProxyMiddleware } = require('http-proxy-middleware');
const { HOST } = require('./config')
//设置代理
module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api',
      {
        target: HOST,
        changeOrigin: true
      })
  );
  app.use(
    createProxyMiddleware('/commonstatic',
      {
        target: HOST,
        changeOrigin: true
      })

  );
};

