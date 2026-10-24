import { h, clear, toast, beep, confetti } from '../ui.js';
import { store } from '../state.js';
import { TOPICS, generate, mixedSet, topicsForLevel } from '../lib/mathgen.js';
import { dailyChallenge } from '../lib/banks.js';
import { dateKey } from '../lib/gamify.js';
import { startQuiz } from './quiz.js';
import { makeRng } from '../lib/rng.js';

export default function math(root, { parts, query }) {
  const sub = parts[0];
  if (sub === 'play') return play(root, query);
  if (sub === 'daily') return daily(root);
  if (sub === 'blitz') return blitz(root);
  return picker(root);
}

function picker(root) {
  let level = store.profile.level || 5;
  let selected = new Set();
  let count = 10, diff = 2;
  const host = h('div');
  root.append(h('h1', '➗ Maths'), host);

  function draw() {
    clear(host);
    const topics = TOPICS.filter((t) => t.level <= level);
    const stats = store.profile.topics;
    const grid = h('div', { class: 'grid sm' }, topics.map((t) => {
      const st = stats['math:' + t.id];
      const acc = st ? Math.round((st.correct / st.answered) * 100) : null;
      const on = selected.has(t.id);
      return h('button', { class: 'tile', style: { borderColor: on ? 'var(--brand)' : '', background: on ? 'var(--brand-soft)' : '' }, 'aria-pressed': on, onclick: () => { on ? selected.delete(t.id) : selected.add(t.id); draw(); } },
        h('span', { class: 'big' }, t.emoji), h('b', t.name), h('small', `P${t.level}+ ${acc != null ? `· ${acc}% (${st.answered})` : '· not tried'}`));
    }));
    host.append(
      h('div', { class: 'card' },
        h('label', 'My level'),
        h('div', { class: 'pills' }, [4, 5, 6].map((l) => h('button', { class: 'pill' + (l === level ? ' on' : ''), onclick: () => { level = l; selected = new Set([...selected].filter((id) => TOPICS.find((t) => t.id === id).level <= l)); draw(); } }, `P${l}`))),
        h('p', { class: 'muted small' }, 'Higher levels include the topics from lower levels.')),
      h('div', { class: 'grid' },
        h('a', { class: 'tile ai', href: '#/math/daily' }, h('b', '📅 Daily Challenge'), h('small', 'Same set for everyone today')),
        h('a', { class: 'tile', href: '#/math/blitz' }, h('b', '⚡ 60-second Blitz'), h('small', 'Mental maths speed round')),
        h('a', { class: 'tile', href: '#/worksheets' }, h('b', '🖨️ Printable worksheets'), h('small', 'With answer key & working'))),
      h('h2', 'Choose topics ', h('span', { class: 'muted small' }, selected.size ? `(${selected.size} selected)` : '(none = mixed)')),
      grid,
      h('div', { class: 'card' },
        h('div', { class: 'row' },
          h('div', h('label', 'Questions'), h('div', { class: 'pills' }, [5, 10, 15, 20].map((n) => h('button', { class: 'pill' + (n === count ? ' on' : ''), onclick: () => { count = n; draw(); } }, n)))),
          h('div', h('label', 'Number size'), h('div', { class: 'pills' }, [[1, 'Easier'], [2, 'Normal'], [3, 'Challenge']].map(([d, l]) => h('button', { class: 'pill' + (d === diff ? ' on' : ''), onclick: () => { diff = d; draw(); } }, l))))),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => { location.hash = `#/math/play?topics=${[...selected].join(',')}&n=${count}&d=${diff}&l=${level}`; } }, selected.size ? 'Start practice 🚀' : 'Start mixed practice 🚀'),
          selected.size ? h('button', { class: 'btn ghost', onclick: () => { selected.clear(); draw(); } }, 'Clear') : null)));
  }
  draw();
}

function play(root, query) {
  const n = Math.min(30, Math.max(1, +query.n || 10));
  const d = +query.d || 2;
  const level = +query.l || store.profile.level || 6;
  const ids = (query.topics || '').split(',').filter(Boolean);
  const pool = ids.length ? ids : topicsForLevel(level).map((t) => t.id);
  const build = () => {
    const rng = makeRng(Math.floor(Math.random() * 2 ** 31));
    return Array.from({ length: n }, (_, i) => generate(pool[(i + rng.int(0, pool.length - 1)) % pool.length], { seed: rng.int(1, 2 ** 30), difficulty: d }));
  };
  let stop;
  const go = () => { clear(root); stop = startQuiz(root, { title: 'Maths practice', subject: 'math', questions: build(), backHref: '#/math', again: go }); };
  go();
  return () => stop?.();
}

function daily(root) {
  const p = store.profile;
  const today = dateKey();
  const level = p.level || 5;
  if (p.daily[today]?.done) {
    root.append(h('div', { class: 'card center' }, h('div', { style: { fontSize: '3rem' } }, '✅'), h('h1', 'Daily Challenge done!'), h('p', `You scored ${p.daily[today].score}/6 today. Come back tomorrow for a new set!`),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, h('a', { class: 'btn', href: '#/math' }, 'More Maths'), h('a', { class: 'btn secondary', href: '#/' }, 'Home'))));
    return;
  }
  const questions = dailyChallenge(today, level, mixedSet);
  return startQuiz(root, {
    title: 'Daily Challenge', subject: 'math', questions, backHref: '#/', mode: 'daily',
    onFinish: ({ right }) => {
      store.profile.daily[today] = { done: true, score: right };
      store.profile.xp += 30;
      const badges = store.bump('dailies');
      toast('🎁 +30 bonus XP for finishing the Daily Challenge!', 'good');
      badges.forEach((b) => toast(`${b.emoji} Badge unlocked: ${b.name}!`, 'good', 4500));
      store.save();
    },
  });
}

// ---- 60 second mental maths blitz ----
function blitzQuestion(level) {
  const r = Math.random;
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const kind = int(0, level >= 5 ? 4 : 3);
  if (kind === 0) { const a = int(12, 99), b = int(11, 99); return [`${a} + ${b}`, a + b]; }
  if (kind === 1) { const a = int(40, 150), b = int(11, a - 1); return [`${a} − ${b}`, a - b]; }
  if (kind === 2) { const a = int(3, 12), b = int(3, 12 + (level - 4) * 3); return [`${a} × ${b}`, a * b]; }
  if (kind === 3) { const b = int(3, 12), c = int(3, 12 + (level - 4) * 3); return [`${b * c} ÷ ${b}`, c]; }
  const pct = [10, 20, 25, 50, 75][int(0, 4)], base = [20, 40, 60, 80, 100, 120, 200][int(0, 6)];
  return [`${pct}% of ${base}`, (pct * base) / 100];
}

function blitz(root) {
  const level = store.profile.level || 5;
  let timeLeft = 60, score = 0, tries = 0, timer, over = false;
  const host = h('div', { class: 'card center' });
  root.append(h('div', { class: 'qbar' }, h('a', { class: 'btn ghost sm', href: '#/math' }, '✕')), host);
  const start = () => {
    clear(host);
    timeLeft = 60; score = 0; tries = 0; over = false;
    const clock = h('div', { class: 'timer', 'aria-live': 'off' }, '60');
    const q = h('div', { class: 'bigtext', style: { fontSize: '2.4rem', fontWeight: 900 } });
    const input = h('input', { type: 'text', inputmode: 'numeric', class: 'num-input', style: { margin: '0 auto', textAlign: 'center' }, 'aria-label': 'Answer', autocomplete: 'off' });
    const scoreEl = h('div', { class: 'muted' }, 'Score: 0');
    let cur;
    const next = () => { cur = blitzQuestion(level); q.textContent = cur[0] + ' = ?'; input.value = ''; input.focus(); };
    input.addEventListener('input', () => {
      if (input.value.trim() === String(cur[1])) {
        score++; tries++; beep('ok'); scoreEl.textContent = `Score: ${score}`;
        store.record({ id: 'blitz', subject: 'math', topic: 'blitz', topicName: 'Speed Blitz' }, true, { quiet: true });
        next();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        if (input.value.trim() !== String(cur[1])) { tries++; beep('bad'); store.record({ id: 'blitz', subject: 'math', topic: 'blitz', topicName: 'Speed Blitz' }, false, { quiet: true }); next(); }
      }
    });
    host.append(h('h2', '⚡ Blitz!'), clock, q, input, scoreEl, h('p', { class: 'muted small' }, 'Answers are checked as you type. Press Enter to skip.'));
    next();
    timer = setInterval(() => {
      timeLeft--; clock.textContent = timeLeft;
      if (timeLeft <= 0) end();
    }, 1000);
  };
  const end = () => {
    if (over) return;
    over = true; clearInterval(timer);
    const best = store.profile.blitzBest || 0;
    const newBest = score > best;
    store.profile.blitzBest = Math.max(best, score);
    store.profile.xp += score * 2;
    store.save();
    if (newBest && score > 0) { confetti(); beep('level'); }
    clear(host);
    host.append(h('div', { style: { fontSize: '3rem' } }, newBest ? '🏆' : '⚡'), h('h1', `${score} correct!`), h('p', `${tries ? Math.round((score / tries) * 100) : 0}% accuracy · +${score * 2} XP${newBest ? ' · NEW PERSONAL BEST!' : ` · best ${store.profile.blitzBest}`}`),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn', onclick: start }, 'Go again'), h('a', { class: 'btn secondary', href: '#/math' }, 'Back')));
  };
  host.append(h('h1', '⚡ 60-second Blitz'), h('p', 'Answer as many mental-maths questions as you can in one minute. Ready?'), h('button', { class: 'btn accent', onclick: start }, 'Start!'));
  return () => clearInterval(timer);
}
