import { h, clear } from '../ui.js';
import { store } from '../state.js';
import { TOPICS, mixedSet, answerToString } from '../lib/mathgen.js';

// Printable Maths worksheets. The seed makes a sheet reproducible: the same seed always gives the same sheet.
export default function worksheets(root, { query }) {
  let level = +query.l || store.profile.level || 5;
  let count = +query.n || 10;
  let seed = query.seed || Math.random().toString(36).slice(2, 8);
  let selected = new Set((query.topics || '').split(',').filter(Boolean));
  let showSteps = query.steps === '1';
  const host = h('div');
  root.append(h('h1', { class: 'no-print' }, '🖨️ Printable worksheets'), host);

  function draw() {
    clear(host);
    const topics = TOPICS.filter((t) => t.level <= level);
    const qs = mixedSet({ seed, count, level, topics: [...selected].filter((id) => topics.some((t) => t.id === id)) });
    host.append(
      h('div', { class: 'card no-print' },
        h('p', { class: 'muted' }, 'Make a fresh Maths worksheet with an answer key. Use your browser’s Print button (or “Save as PDF”). The same Sheet Code always produces the same sheet, so you can share it with a friend or reprint it later.'),
        h('div', { class: 'row' },
          h('div', h('label', 'Level'), h('div', { class: 'pills' }, [4, 5, 6].map((l) => h('button', { class: 'pill' + (l === level ? ' on' : ''), onclick: () => { level = l; draw(); } }, `P${l}`)))),
          h('div', h('label', 'Questions'), h('div', { class: 'pills' }, [6, 10, 15, 20].map((n) => h('button', { class: 'pill' + (n === count ? ' on' : ''), onclick: () => { count = n; draw(); } }, n))))),
        h('details', h('summary', 'Choose topics (optional)'), h('div', { class: 'pills' }, topics.map((t) => h('button', { class: 'pill' + (selected.has(t.id) ? ' on' : ''), onclick: () => { selected.has(t.id) ? selected.delete(t.id) : selected.add(t.id); draw(); } }, `${t.emoji} ${t.name}`)))),
        h('label', { class: 'inline' }, h('input', { type: 'checkbox', checked: showSteps, onchange: (e) => { showSteps = e.target.checked; draw(); } }), 'Include worked solutions in the answer key'),
        h('div', { class: 'row' },
          h('div', { style: { flex: 1, minWidth: '140px' } }, h('label', 'Sheet code'), h('input', { type: 'text', value: seed, 'aria-label': 'Sheet code', onchange: (e) => { seed = e.target.value.trim() || seed; draw(); } })),
          h('button', { class: 'btn secondary', onclick: () => { seed = Math.random().toString(36).slice(2, 8); draw(); } }, '🎲 New sheet'),
          h('button', { class: 'btn', onclick: () => window.print() }, '🖨️ Print'))),
      h('div', { class: 'card' },
        h('div', { class: 'row between' }, h('h2', { style: { margin: 0 } }, `PSLE Maths Practice – P${level}`), h('div', 'Name: ____________________  Date: __________')),
        h('div', { class: 'muted small' }, `Sheet code: ${seed} · ${count} questions · Show your working. Write units in your answers.`),
        h('ol', { style: { paddingLeft: '1.4em' } }, qs.map((q) => h('li', { class: 'ws-q', style: { margin: '14px 0' } }, h('div', q.q), h('div', { style: { height: '90px', border: '1px dashed var(--line)', borderRadius: '8px', margin: '6px 0' } }), h('div', 'Ans: ______________________'))))),
      h('div', { class: 'card answer-key' },
        h('h2', 'Answer key'), h('div', { class: 'muted small' }, `Sheet code: ${seed}`),
        h('ol', { style: { paddingLeft: '1.4em' } }, qs.map((q) => h('li', { style: { margin: '8px 0' } }, h('b', answerToString(q)), showSteps ? h('ul', { class: 'small' }, q.steps.map((s) => h('li', s))) : null)))));
  }
  draw();
}
