import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, parseResponse, chat, extractJSON, normalizeQuiz, isConfigured, AIError } from '../public/js/lib/ai.js';
import { analyze } from '../public/js/lib/compose.js';

test('builds an Anthropic request with browser-access header and image', () => {
  const { url, init } = buildRequest({ provider: 'anthropic', key: 'k' }, { system: 'S', messages: [{ role: 'user', content: 'hi', images: [{ mime: 'image/jpeg', data: 'AAA' }] }] });
  assert.equal(url, 'https://api.anthropic.com/v1/messages');
  assert.equal(init.headers['x-api-key'], 'k');
  assert.equal(init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  const body = JSON.parse(init.body);
  assert.equal(body.system, 'S');
  assert.equal(body.model, 'claude-haiku-5-5');
  assert.equal(body.messages[0].content[0].type, 'image');
});

test('builds openai/gemini/custom requests', () => {
  const o = buildRequest({ provider: 'openai', key: 'k' }, { system: 'S', messages: [{ role: 'user', content: 'x' }] });
  assert.equal(o.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(JSON.parse(o.init.body).messages[0].role, 'system');
  const g = buildRequest({ provider: 'gemini', key: 'k' }, { system: 'S', messages: [{ role: 'assistant', content: 'x' }] });
  assert.match(g.url, /gemini-2\.5-flash:generateContent$/);
  assert.equal(JSON.parse(g.init.body).contents[0].role, 'model');
  assert.ok(!g.url.includes('key=')); // key travels in a header, not the URL
  const c = buildRequest({ provider: 'custom', baseUrl: 'http://localhost:11434/v1/', model: 'llama3' }, { system: 'S', messages: [] });
  assert.equal(c.url, 'http://localhost:11434/v1/chat/completions');
  assert.equal(c.init.headers.authorization, undefined);
  assert.throws(() => buildRequest({ provider: 'custom', baseUrl: '', model: 'm' }, { system: '', messages: [] }), AIError);
});

test('parse responses', () => {
  assert.equal(parseResponse('anthropic', { content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }), 'ab');
  assert.equal(parseResponse('openai', { choices: [{ message: { content: 'z' } }] }), 'z');
  assert.equal(parseResponse('gemini', { candidates: [{ content: { parts: [{ text: 'g' }] } }] }), 'g');
});

test('chat handles success, http errors and network errors', async () => {
  const ok = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ content: [{ type: 'text', text: 'hello' }] }) });
  assert.equal(await chat({ provider: 'anthropic', key: 'k' }, { system: 's', messages: [] }, { fetchImpl: ok }), 'hello');
  const bad = async () => ({ ok: false, status: 401, text: async () => '{"error":{"message":"bad key"}}' });
  await assert.rejects(chat({ provider: 'anthropic', key: 'k' }, { system: 's', messages: [] }, { fetchImpl: bad }), /did not accept the key/);
  const down = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(chat({ provider: 'openai', key: 'k' }, { system: 's', messages: [] }, { fetchImpl: down }), /Could not reach/);
  await assert.rejects(chat({ provider: 'openai', key: '' }, { system: 's', messages: [] }), /not set up/);
  assert.ok(isConfigured({ provider: 'openai', key: 'x' }));
  assert.ok(!isConfigured({ provider: 'custom', baseUrl: 'http://x' }));
});

test('extractJSON copes with fences and chatter', () => {
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Sure! Here you go: {"a":"}{","b":[1,2]} hope that helps'), { a: '}{', b: [1, 2] });
  assert.throws(() => extractJSON('no json here'));
});

test('normalizeQuiz handles letter answers and open questions', () => {
  const q = normalizeQuiz({
    questions: [
      { q: 'Q1', options: ['A. x', 'B. y', 'C. z', 'D. w'], answer: 'B', explanation: 'because' },
      { q: 'Q2', options: ['x', 'y'], answer: 1 },
      { q: 'Q3', model_answer: 'ans', keywords: ['a'] },
      { q: 'bad', options: ['x', 'y'], answer: 9 },
    ],
  });
  assert.equal(q.length, 3);
  assert.equal(q[0].answerIndex, 1);
  assert.equal(q[0].options[0], 'x');
  assert.equal(q[2].type, 'open');
  assert.throws(() => normalizeQuiz({ questions: [] }));
});

test('offline composition analyzer finds typical issues', () => {
  const text = 'I was very happy. I went to the park. I went to the shop. I went home. I said lah. I said it twice. I said it thrice.\n\nSuddenly it rained. Suddenly it stopped.';
  const r = analyze(text);
  assert.ok(r.tips.length > 2);
  assert.ok(r.singlish.includes('lah'));
  assert.ok(r.tellings.some((t) => t.feeling === 'happy'));
  assert.ok(r.weak.some((w) => w.word === 'said'));
  assert.equal(analyze('').words, 0);
});
