// PSLE Otter static server - zero dependencies.
//   PORT (default 8080)   HOST (default 0.0.0.0)
//   BASIC_AUTH=user:pass  optional password gate for public deployments (/healthz stays open)
//   EXTRA_CONNECT_SRC     extra origins the browser may call, e.g. "http://192.168.1.50:11434"
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt']);

export function createApp({ root = path.join(__dirname, 'public'), env = process.env } = {}) {
  const connect = ["'self'", 'https:', 'http://localhost:*', 'http://127.0.0.1:*', ...(env.EXTRA_CONNECT_SRC ? env.EXTRA_CONNECT_SRC.split(/[\s,]+/).filter(Boolean) : [])].join(' ');
  const headers = {
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src ${connect}; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
  const expectedAuth = env.BASIC_AUTH ? Buffer.from(env.BASIC_AUTH) : null;
  const cache = new Map(); // file -> {mtimeMs, etag, raw, gzip, br}

  function load(file, ext) {
    const st = fs.statSync(file);
    const hit = cache.get(file);
    if (hit && hit.mtimeMs === st.mtimeMs) return hit;
    const raw = fs.readFileSync(file);
    const entry = {
      mtimeMs: st.mtimeMs, raw,
      etag: '"' + crypto.createHash('sha1').update(raw).digest('base64url').slice(0, 22) + '"',
      gzip: COMPRESSIBLE.has(ext) && raw.length > 512 ? zlib.gzipSync(raw, { level: 9 }) : null,
      br: COMPRESSIBLE.has(ext) && raw.length > 512 ? zlib.brotliCompressSync(raw) : null,
    };
    cache.set(file, entry);
    return entry;
  }

  function authorised(req) {
    if (!expectedAuth) return true;
    const h = req.headers.authorization || '';
    if (!h.startsWith('Basic ')) return false;
    const given = Buffer.from(Buffer.from(h.slice(6), 'base64').toString());
    return given.length === expectedAuth.length && crypto.timingSafeEqual(given, expectedAuth);
  }

  return function handler(req, res) {
    const send = (code, body, extra = {}) => { res.writeHead(code, { ...headers, ...extra }); res.end(req.method === 'HEAD' ? undefined : body); };
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/healthz') return send(200, 'ok', { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      if (!authorised(req)) return send(401, 'Password required', { 'WWW-Authenticate': 'Basic realm="PSLE Otter", charset="UTF-8"' });

      let rel;
      try { rel = decodeURIComponent(url.pathname); } catch { return send(400, 'Bad request'); }
      if (rel.includes('\0')) return send(400, 'Bad request');
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.normalize(path.join(root, rel));
      if (file !== root && !file.startsWith(root + path.sep)) return send(403, 'Forbidden');
      let st;
      try { st = fs.statSync(file); } catch { return send(404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' }); }
      if (!st.isFile()) return send(404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });

      const ext = path.extname(file).toLowerCase();
      const entry = load(file, ext);
      const long = rel.startsWith('/icons/');
      const base = {
        'Content-Type': MIME[ext] || 'application/octet-stream', ETag: entry.etag, Vary: 'Accept-Encoding',
        'Cache-Control': long ? 'public, max-age=86400' : 'no-cache',
      };
      if (req.headers['if-none-match'] === entry.etag) return send(304, undefined, base);
      const ae = req.headers['accept-encoding'] || '';
      if (entry.br && /\bbr\b/.test(ae)) return send(200, entry.br, { ...base, 'Content-Encoding': 'br', 'Content-Length': entry.br.length });
      if (entry.gzip && /\bgzip\b/.test(ae)) return send(200, entry.gzip, { ...base, 'Content-Encoding': 'gzip', 'Content-Length': entry.gzip.length });
      return send(200, entry.raw, { ...base, 'Content-Length': entry.raw.length });
    } catch (err) {
      console.error('request error', err);
      if (!res.headersSent) send(500, 'Server error');
      else res.end();
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  const host = process.env.HOST || '0.0.0.0';
  const server = http.createServer(createApp());
  server.keepAliveTimeout = 65_000;
  server.listen(port, host, () => console.log(`PSLE Otter listening on http://${host}:${port}${process.env.BASIC_AUTH ? ' (password protected)' : ''}`));
  const stop = () => { console.log('Shutting down…'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
