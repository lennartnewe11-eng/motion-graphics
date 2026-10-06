// Minimal static file server (project root) + WebSocket endpoint for frame/audio streaming.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, url === '/' ? '/src/index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('cache-control', 'no-store');
    fs.createReadStream(file).pipe(res);
  });
  const wss = new WebSocketServer({ server, maxPayload: 1 << 30 });
  const handlers = new Map();
  wss.on('connection', (ws, req) => {
    const key = new URL(req.url, 'http://x').searchParams.get('k');
    const h = handlers.get(key);
    ws.on('message', async (data) => {
      if (h) await h(data);
      ws.send('ok');
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => {
    resolve({ server, port: server.address().port, onStream: (k, fn) => handlers.set(k, fn), close: () => { wss.close(); server.close(); } });
  }));
}
