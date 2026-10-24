import { h, clear, md, spinner, pct } from '../ui.js';
import { store, askAI, aiReady, AIError } from '../state.js';
import { BADGES, levelFromXp, levelTitle, liveStreak } from '../lib/gamify.js';
import { summarize, lastDays } from '../lib/report.js';
import { COACH_NOTE, PARENT_SUMMARY } from '../lib/prompts.js';
import { SUBJECT_META } from '../lib/banks.js';

export default function progress(root) {
  const p = store.profile;
  const lvl = levelFromXp(p.xp);
  const days = lastDays(28);
  const maxDay = Math.max(1, ...days.map((d) => p.days[d]?.answered || 0));
  const level = (n) => (n === 0 ? '' : n < maxDay * 0.25 ? 'l1' : n < maxDay * 0.5 ? 'l2' : n < maxDay * 0.8 ? 'l3' : 'l4');
  const topics = Object.entries(p.topics).sort((a, b) => b[1].answered - a[1].answered);
  const aiOut = h('div');

  root.append(
    h('div', { class: 'row between' }, h('h1', `📊 ${p.name}’s progress`), h('button', { class: 'btn secondary sm no-print', onclick: () => window.print() }, '🖨️ Print for parents')),
    h('div', { class: 'grid sm' },
      stat(`Lv ${lvl}`, levelTitle(lvl)), stat(p.xp, 'XP'), stat(liveStreak(p.streak), 'day streak 🔥'), stat(p.streak.best || 0, 'best streak'),
      stat(p.totals.answered, 'questions'), stat(pct(p.totals.correct, p.totals.answered) + '%', 'accuracy'), stat(p.totals.focusMinutes || 0, 'focus minutes')),

    h('div', { class: 'card' }, h('h3', 'Last 4 weeks'),
      h('div', { class: 'cal', style: { gridTemplateColumns: 'repeat(14, 1fr)' } }, days.map((d) => h('i', { class: level(p.days[d]?.answered || 0), title: `${d}: ${p.days[d]?.answered || 0} questions` }))),
      h('p', { class: 'muted small' }, 'Darker = more questions that day.')),

    h('div', { class: 'card' }, h('h3', 'By subject'),
      Object.entries(SUBJECT_META).map(([k, m]) => { const s = p.subjects[k]; const a = s ? pct(s.correct, s.answered) : 0; return h('div', { style: { margin: '8px 0' } }, h('div', { class: 'row between', style: { margin: 0 } }, h('b', `${m.emoji} ${m.name}`), h('span', { class: 'muted small' }, s ? `${a}% of ${s.answered}` : 'not started')), h('div', { class: `bar ${a >= 75 ? 'good' : a >= 50 ? 'warn' : s ? 'bad' : ''}` }, h('i', { style: { width: a + '%' } }))); })),

    topics.length ? h('div', { class: 'card' }, h('h3', 'Topic heat-map'),
      h('div', { class: 'heat' }, topics.map(([k, v]) => { const a = pct(v.correct, v.answered); const bg = v.answered < 3 ? 'var(--card)' : a >= 80 ? 'var(--good-soft)' : a >= 55 ? 'var(--warn-soft)' : 'var(--bad-soft)'; return h('div', { style: { background: bg } }, v.name, h('div', { class: 'small muted' }, `${a}% · ${v.answered} Qs`)); })),
      h('p', { class: 'muted small' }, 'Green ≥ 80%, yellow 55–79%, red < 55% (needs 3+ questions). Practise the red ones first!')) : h('div', { class: 'card' }, 'Answer a few questions to see your topic heat-map here.'),

    h('div', { class: 'card' }, h('h3', `Badges (${Object.keys(p.badges).length}/${BADGES.length})`),
      h('div', { class: 'grid sm' }, BADGES.map((b) => { const got = p.badges[b.id]; return h('div', { class: 'card', style: { margin: 0, opacity: got ? 1 : .45, textAlign: 'center' }, title: b.desc }, h('div', { style: { fontSize: '2rem' } }, got ? b.emoji : '🔒'), h('b', b.name), h('div', { class: 'small muted' }, b.desc)); }))),

    h('div', { class: 'card no-print' }, h('h3', '🤖 Coach’s note & parent summary'),
      h('p', { class: 'muted small' }, 'Sends only anonymous statistics (no name) to your chosen AI service.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn accent', disabled: !aiReady(), onclick: () => gen(COACH_NOTE, 'Write the coach’s note for this student.') }, '📝 Coach’s note for me'),
        h('button', { class: 'btn secondary', disabled: !aiReady(), onclick: () => gen(PARENT_SUMMARY, 'Write the weekly parent update.') }, '👪 Weekly parent update'),
        aiReady() ? null : h('a', { href: '#/settings', class: 'small' }, 'Needs an AI key')),
      aiOut));

  async function gen(system, ask) {
    clear(aiOut); aiOut.append(spinner());
    try {
      const text = await askAI({ system, maxTokens: 500, temperature: 0.6, messages: [{ role: 'user', content: `${ask}\nStats JSON:\n${JSON.stringify(summarize(p))}` }] });
      clear(aiOut); aiOut.append(h('div', { class: 'card soft' }, md(text)));
    } catch (e) { clear(aiOut); aiOut.append(h('div', { class: 'feedback no' }, e instanceof AIError ? e.message : 'Something went wrong.')); }
  }
}
const stat = (n, l) => h('div', { class: 'card stat', style: { margin: 0 } }, h('b', n), h('span', { class: 'muted small' }, l));
