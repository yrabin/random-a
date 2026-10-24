import { h, clear, md } from '../ui.js';
import { store, aiReady } from '../state.js';
import { makeRng } from '../lib/rng.js';
import { THEMES, KEYWORDS, CER_FRAME } from '../data/science.js';
import { scienceQuestions, scienceOpen } from '../lib/banks.js';
import { startQuiz } from './quiz.js';

const THEME_META = { Diversity: ['🌿', 'Living things, materials, matter'], Cycles: ['♻️', 'Water cycle, life cycles, reproduction'], Systems: ['🫀', 'Plants, digestion, breathing, circuits'], Energy: ['💡', 'Light, heat, photosynthesis, conversions'], Interactions: ['🧲', 'Forces, magnets, environment'] };

export default function science(root, { parts, query }) {
  const sub = parts[0];
  if (sub === 'mcq') return run(root, 'Science quiz', () => scienceQuestions(makeRng(Math.random() * 1e9), 10, query.th || null), '#/science');
  if (sub === 'open') return run(root, 'Open-ended practice', () => scienceOpen(makeRng(Math.random() * 1e9), 6), '#/science');
  if (sub === 'keywords') return keywords(root);
  root.append(
    h('h1', '🔬 Science'),
    h('p', { class: 'muted' }, 'Five MOE themes. Pick one, or mix them all.'),
    h('div', { class: 'grid' },
      h('a', { class: 'tile ai', href: '#/science/mcq' }, h('span', { class: 'big' }, '🎲'), h('b', 'Mixed quiz'), h('small', '10 multiple-choice from all themes')),
      ...THEMES.map((t) => h('a', { class: 'tile', href: `#/science/mcq?th=${t}` }, h('span', { class: 'big' }, THEME_META[t][0]), h('b', t), h('small', THEME_META[t][1])))),
    h('h2', 'Open-ended & revision'),
    h('div', { class: 'grid' },
      h('a', { class: 'tile', href: '#/science/open' }, h('span', { class: 'big' }, '✍️'), h('b', 'Open-ended (CER)'), h('small', 'Write, compare with model answer')),
      h('a', { class: 'tile', href: '#/science/keywords' }, h('span', { class: 'big' }, '🗝️'), h('b', 'Keyword cards'), h('small', 'Must-know science terms')),
      h('a', { class: 'tile ai', href: '#/ai/forge?subject=science' }, h('span', { class: 'big' }, '🤖'), h('b', 'AI Question Forge'), h('small', aiReady() ? 'Create questions on any topic' : 'Needs your own AI key'))),
    h('div', { class: 'card' }, h('h3', 'The CER trick for open-ended answers'), h('ul', CER_FRAME.map(([k, v]) => h('li', h('b', k + ': '), v)))));
}

function run(root, title, build, back) {
  let stop;
  const go = () => { clear(root); stop = startQuiz(root, { title, subject: 'science', questions: build(), backHref: back, again: go }); };
  go();
  return () => stop?.();
}

function keywords(root) {
  let i = 0, shown = false;
  const order = [...KEYWORDS].sort(() => Math.random() - 0.5);
  const host = h('div');
  const draw = () => {
    clear(host);
    const [k, d] = order[i];
    host.append(h('div', { class: 'card center', style: { minHeight: '180px', cursor: 'pointer' }, onclick: () => { shown = !shown; draw(); }, tabindex: 0, role: 'button', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shown = !shown; draw(); } } },
      h('div', { class: 'qmeta' }, `${i + 1} / ${order.length}`), h('h1', k), shown ? h('p', { class: 'bigtext' }, d) : h('p', { class: 'muted' }, 'Tap to reveal the meaning')),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn secondary', onclick: () => { i = (i - 1 + order.length) % order.length; shown = false; draw(); } }, '← Back'),
        h('button', { class: 'btn', onclick: () => { i = (i + 1) % order.length; shown = false; draw(); } }, 'Next →')));
  };
  root.append(h('div', { class: 'qbar' }, h('a', { class: 'btn ghost sm', href: '#/science' }, '✕ Back'), h('h2', { style: { margin: 0 } }, '🗝️ Keyword cards')), host);
  draw();
  void md;
}
