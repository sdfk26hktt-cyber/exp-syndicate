import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_err) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/resolve-media', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          let targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }
          targetUrl = targetUrl.trim();
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
          }

          let finalUrl = targetUrl;
          try {
            const headRes = await fetch(targetUrl, {
              method: 'HEAD',
              redirect: 'follow',
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            finalUrl = headRes.url || targetUrl;
          } catch (_err) {
            const getRes = await fetch(targetUrl, {
              method: 'GET',
              redirect: 'follow',
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            finalUrl = getRes.url || targetUrl;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ originalUrl: targetUrl, resolvedUrl: finalUrl }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/messages/upload-attachment', async (req, res) => {
        try {
          if (req.method === 'POST') {
            req.body = await parseJsonBody(req);
          }
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          const { default: uploadHandler } = await import('./api/messages/upload-attachment.js');
          await uploadHandler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/messages/send-sms', async (req, res) => {
        try {
          if (req.method === 'POST') {
            req.body = await parseJsonBody(req);
          }
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          const { default: sendHandler } = await import('./api/messages/send-sms.js');
          await sendHandler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/admin/set-agent-password', async (req, res) => {
        try {
          if (req.method === 'POST') {
            req.body = await parseJsonBody(req);
          }
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          const { default: setPasswordHandler } = await import('./api/admin/set-agent-password.js');
          await setPasswordHandler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/calendar', async (req, res) => {
        try {
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          res.send = (data) => {
            res.end(data);
            return res;
          };
          const { default: calendarHandler } = await import('./api/calendar.js');
          await calendarHandler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    react(),
    ...(command === 'serve' ? [apiDevPlugin()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: 'EXP Syndicate Dashboard',
        short_name: 'Syndicate',
        description: 'Manage your syndicate agents and track onboarding progress.',
        theme_color: '#0C0F24',
        background_color: '#0C0F24',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
}))
