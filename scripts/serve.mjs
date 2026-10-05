/** Serve the bundled game with Node.js; no dependency installation required. */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.ISLAND_DRIVE_PORT || 5178);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary', '.woff': 'font/woff', '.woff2': 'font/woff2', '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8' };
try { await stat(resolve(root, 'index.html')); } catch { console.error('找不到 dist/index.html。請先執行 npm install 和 npm run build。'); process.exit(1); }
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  let file;
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    file = resolve(root, `.${name === '/' ? '/index.html' : name}`);
    if (!file.startsWith(root + sep)) throw new Error('Invalid path');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': /(?:index\.html|sw\.js|precache\.json)$/.test(file) ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') response.end();
    else { const stream = createReadStream(file); stream.on('error', () => response.destroy()); stream.pipe(response); }
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('找不到這個檔案。'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `連接埠 ${port} 已使用，請開啟 http://localhost:${port}/ 或設定 ISLAND_DRIVE_PORT。` : error.message); process.exit(1); });
server.listen(port, '0.0.0.0', () => console.log(`島嶼公路已啟動： http://localhost:${port}/\n手機請用同一個 Wi-Fi，開啟這台電腦的區網 IP 與連接埠 ${port}。\n按 Ctrl+C 停止。`));
