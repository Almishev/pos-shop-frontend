import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3001, // Use port 3001 instead of default 5173
    proxy: {
      '/api': {
        target: 'http://localhost:8087',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1.0'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Ensure Authorization header is forwarded
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            
            // For OPTIONS requests, ensure all CORS headers are set
            if (req.method === 'OPTIONS') {
              proxyReq.setHeader('Access-Control-Request-Method', req.headers['access-control-request-method'] || 'POST');
              proxyReq.setHeader('Access-Control-Request-Headers', req.headers['access-control-request-headers'] || 'authorization,content-type');
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // For OPTIONS requests, ensure CORS headers are present in response
            if (req.method === 'OPTIONS') {
              proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Requested-With';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
              proxyRes.headers['Access-Control-Max-Age'] = '86400';
            }
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy] Error:', err.message, req.url);
          });
        }
      }
    }
  }
})
