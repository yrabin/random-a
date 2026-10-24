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

import * as banks from '../public/js/lib/banks.js';
import { makeRng } from '../public/js/lib/rng.js';
import { mixedSet } from '../public/js/lib/mathgen.js';

test('banks build valid questions', () => {
  const r = makeRng(5);
  const all = [
    ...banks.vocabQuestions(r, 10), ...banks.vocabUseQuestions(r, 10), ...banks.grammarQuestions(r, 20), ...banks.singlishQuestions(r, 5),
    ...banks.idiomQuestions(r, 8), ...banks.clozeQuestions(r), ...banks.clozeQuestions(r, 2), ...banks.editingQuestions(r, 12), ...banks.scienceQuestions(r, 20), ...banks.chineseIdiomQuestions(r, 8), ...banks.chineseVocabQuestions(r, 8),
  ];
  for (const q of all) {
    assert.equal(q.options.length, 4, q.q);
    assert.equal(new Set(q.options).size, 4, 'dup options: ' + q.q);
    assert.ok(!q.q.includes('undefined'));
  }
  assert.ok(banks.vocabUseQuestions(r, 5).every((q) => q.q.includes('______')));
  const d1 = banks.dailyChallenge('2026-01-01', 6, mixedSet);
  const d2 = banks.dailyChallenge('2026-01-01', 6, mixedSet);
  assert.equal(d1.length, 6);
  assert.deepEqual(d1.map((q) => q.q), d2.map((q) => q.q));
});
