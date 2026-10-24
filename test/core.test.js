import test from 'node:test';
import assert from 'node:assert/strict';
import { markToAL, computeAL, plan, postingGroup, daysUntil } from '../public/js/lib/alcalc.js';
import { review, newCard, isDue, INTERVAL_DAYS } from '../public/js/lib/srs.js';
import { levelFromXp, bumpStreak, liveStreak } from '../public/js/lib/gamify.js';
import { createStore } from '../public/js/lib/store.js';

const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };

test('mark to AL boundaries', () => {
  const cases = [[100, 1], [90, 1], [89, 2], [85, 2], [84, 3], [80, 3], [79, 4], [75, 4], [74, 5], [65, 5], [64, 6], [45, 6], [44, 7], [20, 7], [19, 8], [0, 8]];
  for (const [m, al] of cases) assert.equal(markToAL(m), al, `mark ${m}`);
});

test('computeAL and posting group', () => {
  const r = computeAL({ eng: 92, mt: 80, math: 95, sci: 88 });
  assert.deepEqual(r.als, { eng: 1, mt: 3, math: 1, sci: 2 });
  assert.equal(r.total, 7);
  assert.equal(postingGroup(20).group, 1);
  assert.equal(postingGroup(21).group, 2);
  assert.equal(postingGroup(25).group, 3);
  assert.equal(computeAL({ eng: 1, mt: 1, math: 1, sci: 'x' }), null);
});

test('plan picks cheapest gains', () => {
  const p = plan({ eng: 84, mt: 70, math: 60, sci: 79 }, 11); // current AL 3+5+6+4 = 18
  assert.equal(p.current.total, 18);
  assert.ok(p.reachable);
  assert.equal(p.finalTotal, 11);
  assert.equal(p.steps[0].subject, 'eng'); // 1 mark to AL2? eng 84 -> 85 gain 1
  assert.equal(p.steps[0].gain, 1);
});

test('spaced repetition', () => {
  const t0 = 1_000_000;
  let c = newCard({ id: 'x', q: 'q' }, t0);
  assert.ok(isDue(c, t0));
  c = review(c, true, t0);
  assert.equal(c.box, 1);
  assert.ok(!isDue(c, t0 + 1000));
  assert.ok(isDue(c, t0 + 86400000 + 1));
  c = review(c, false, t0);
  assert.equal(c.box, 0);
  for (let i = 0; i < INTERVAL_DAYS.length; i++) c = review(c, true, t0);
  assert.ok(c.mastered);
});

test('streaks and levels', () => {
  assert.equal(levelFromXp(0), 1);
  assert.ok(levelFromXp(600) > 3);
  let s = { count: 0, last: null, best: 0 };
  s = bumpStreak(s, '2025-01-01'); s = bumpStreak(s, '2025-01-02'); s = bumpStreak(s, '2025-01-02');
  assert.equal(s.count, 2);
  s = bumpStreak(s, '2025-01-05');
  assert.equal(s.count, 1);
  assert.equal(s.best, 2);
  assert.equal(liveStreak({ count: 5, last: '2025-01-01' }, '2025-01-10'), 0);
  assert.equal(liveStreak({ count: 5, last: '2025-01-09' }, '2025-01-10'), 5);
});

test('store records answers, mistakes, badges; export hides key', () => {
  const st = createStore(memStorage());
  const r = st.record({ id: 'm1', subject: 'math', topic: 'ratio', topicName: 'Ratio', snapshot: { id: 'm1', q: 'Q?', answer: 5 } }, false);
  assert.ok(r.badges.some((b) => b.id === 'first'));
  assert.equal(st.profile.mistakes.length, 1);
  st.record({ id: 'm2', subject: 'math', topic: 'ratio' }, true);
  assert.equal(st.profile.totals.answered, 2);
  assert.equal(st.profile.totals.combo, 1);
  st.settings.ai.key = 'sk-secret';
  assert.ok(!st.exportData().includes('sk-secret'));
  assert.ok(st.exportData({ includeKey: true }).includes('sk-secret'));
  const backup = st.exportData();
  const st2 = createStore(memStorage());
  st2.importData(backup);
  assert.equal(st2.profile.totals.answered, 2);
  assert.throws(() => st2.importData('{"nope":1}'));
});

test('daysUntil', () => {
  assert.equal(daysUntil('2025-10-10', new Date(2025, 9, 1)), 9);
  assert.equal(daysUntil('', new Date()), null);
});
