import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAR, SINGLISH, VOCAB, SYNTHESIS, IDIOMS } from '../public/js/data/english.js';
import { MCQ, OPEN, THEMES } from '../public/js/data/science.js';
import { IDIOMS as ZH, VOCAB as ZHV } from '../public/js/data/chinese.js';

const checkMcq = (name, items) => items.forEach((it, i) => {
  assert.ok(it.q && it.a && Array.isArray(it.w) && it.w.length === 3, `${name}[${i}] shape`);
  const all = [it.a, ...it.w];
  assert.equal(new Set(all).size, 4, `${name}[${i}] duplicate options: ${it.q}`);
  assert.ok(it.e, `${name}[${i}] needs explanation`);
});

test('MCQ banks are well-formed', () => {
  checkMcq('GRAMMAR', GRAMMAR);
  checkMcq('SINGLISH', SINGLISH);
  checkMcq('SCIENCE', MCQ);
  MCQ.forEach((m) => assert.ok(THEMES.includes(m.th), m.th));
});
test('other banks are well-formed', () => {
  assert.ok(VOCAB.length >= 50 && new Set(VOCAB.map((v) => v[0])).size === VOCAB.length);
  SYNTHESIS.forEach((s) => assert.ok(s.q && s.a));
  IDIOMS.forEach((s) => assert.equal(s.length, 3));
  OPEN.forEach((o) => assert.ok(o.q && o.model && o.keywords.length >= 2));
  ZH.forEach((z) => assert.equal(z.length, 4));
  ZHV.forEach((z) => assert.equal(z.length, 3));
});
