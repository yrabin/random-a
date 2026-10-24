import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.js';

function start(env = {}) {
  return new Promise((resolve) => {
    const s = http.createServer(createApp({ env })).listen(0, () => resolve({ s, base: `http://127.0.0.1:${s.address().port}` }));
  });
}

test('serves the app with security headers, compression and caching', async () => {
  const { s, base } = await start();
  try {
    const r = await fetch(base + '/', { headers: { 'accept-encoding': 'gzip' } });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(/<title>PSLE Otter/.test(await r.text()));
    const etag = r.headers.get('etag');
    const r2 = await fetch(base + '/', { headers: { 'if-none-match': etag } });
    assert.equal(r2.status, 304);
    assert.equal((await fetch(base + '/healthz')).status, 200);
    assert.equal((await fetch(base + '/js/app.js')).headers.get('content-type'), 'text/javascript; charset=utf-8');
  } finally { s.close(); }
});

test('rejects traversal, unknown paths and non-GET methods', async () => {
  const { s, base } = await start();
  try {
    for (const p of ['/../server.js', '/%2e%2e/server.js', '/..%2fserver.js', '/nope.txt', '/js']) {
      const st = (await fetch(base + p)).status;
      assert.ok([403, 404].includes(st), `${p} -> ${st}`);
    }
    assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  } finally { s.close(); }
});

test('BASIC_AUTH gates everything except /healthz', async () => {
  const { s, base } = await start({ BASIC_AUTH: 'fam:pw' });
  try {
    assert.equal((await fetch(base + '/')).status, 401);
    assert.equal((await fetch(base + '/healthz')).status, 200);
    const ok = 'Basic ' + Buffer.from('fam:pw').toString('base64');
    const bad = 'Basic ' + Buffer.from('fam:no').toString('base64');
    assert.equal((await fetch(base + '/', { headers: { authorization: ok } })).status, 200);
    assert.equal((await fetch(base + '/', { headers: { authorization: bad } })).status, 401);
  } finally { s.close(); }
});

test('EXTRA_CONNECT_SRC extends the CSP', async () => {
  const { s, base } = await start({ EXTRA_CONNECT_SRC: 'http://192.168.1.5:11434' });
  try {
    assert.match((await fetch(base + '/')).headers.get('content-security-policy'), /192\.168\.1\.5:11434/);
  } finally { s.close(); }
});
