import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, generate, mixedSet, answerToString } from '../public/js/lib/mathgen.js';
import { checkAnswer } from '../public/js/lib/answer.js';

test('every generator yields a self-consistent question for many seeds', () => {
  for (const t of TOPICS) {
    for (let seed = 1; seed <= 300; seed++) {
      for (const difficulty of [1, 2, 3]) {
        const q = generate(t.id, { seed, difficulty });
        assert.ok(q.q && q.q.length > 10, `${t.id} seed ${seed}: empty question`);
        assert.ok(q.steps.length >= 1, `${t.id}: no steps`);
        assert.ok(q.hint, `${t.id}: no hint`);
        const a = q.answer;
        if (typeof a === 'number') assert.ok(Number.isFinite(a), `${t.id} seed ${seed}: bad answer ${a}`);
        assert.ok(!/NaN|undefined|Infinity/.test(q.q + q.steps.join(' ')), `${t.id} seed ${seed}: bad text: ${q.q}`);
        // Typing the model answer must be marked correct.
        const typed = a && a.linear ? answerToString(q) : answerToString(q).replace(/^\$/, '').replace(/ [^\d].*$/, '');
        const res = checkAnswer(typed, q.answer);
        assert.equal(res, 'correct', `${t.id} seed ${seed}: "${typed}" vs ${JSON.stringify(a)} -> ${res}\n${q.q}`);
      }
    }
  }
});

test('same seed gives same question', () => {
  assert.deepEqual(generate('ratio', { seed: 42 }), generate('ratio', { seed: 42 }));
});

test('mixedSet is deterministic and sized', () => {
  const a = mixedSet({ seed: 'abc', count: 8, level: 6 });
  const b = mixedSet({ seed: 'abc', count: 8, level: 6 });
  assert.equal(a.length, 8);
  assert.deepEqual(a, b);
});

test('spot checks of tricky generators', () => {
  // ratio before/after: verify by brute force the ratios really hold
  for (let seed = 1; seed < 200; seed++) {
    const q = generate('ratiochange', { seed });
    const m = q.q.match(/was (\d+) : (\d+)\. After .* gave \$(\d+) to .*became (\d+) : (\d+)/);
    assert.ok(m, q.q);
    const [a, b, x, c, d] = m.slice(1).map(Number);
    const T = q.answer;
    const A0 = (a * T) / (a + b);
    const A1 = A0 - x;
    assert.ok(Math.abs(A1 * (c + d) - c * T) < 1e-9, `ratio mismatch seed ${seed}: ${q.q}`);
  }
  // assumption (chickens/rabbits)
  for (let seed = 1; seed < 100; seed++) {
    const q = generate('assumption', { seed });
    const [, heads, legs] = q.q.match(/There are (\d+) heads and (\d+) legs/).map(Number);
    const g = q.answer;
    assert.equal(2 * (heads - g) + 4 * g, legs);
  }
  // fraction remainder
  for (let seed = 1; seed < 100; seed++) {
    const q = generate('fracrem', { seed });
    const m = q.q.match(/1\/(\d+) of (?:her|his) money.*1\/(\d+) of the remainder.*had \$(\d+) left/);
    const [d1, d2, left] = m.slice(1).map(Number);
    const M = q.answer;
    assert.equal(M - M / d1 - (M - M / d1) / d2, left);
  }
});
