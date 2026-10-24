import { h, clear, $, modal, sound } from './ui.js';
import { store } from './state.js';
import { levelFromXp, levelTitle, liveStreak } from './lib/gamify.js';

const loaders = {
  '': () => import('./views/home.js'),
  math: () => import('./views/math.js'),
  english: () => import('./views/english.js'),
  science: () => import('./views/science.js'),
  chinese: () => import('./views/chinese.js'),
  psle: () => import('./views/psle.js'),
  mistakes: () => import('./views/mistakes.js'),
  progress: () => import('./views/progress.js'),
  focus: () => import('./views/focus.js'),
  worksheets: () => import('./views/worksheets.js'),
  ai: () => import('./views/ai.js'),
  settings: () => import('./views/settings.js'),
  more: () => import('./views/more.js'),
  help: () => import('./views/help.js'),
};
const TAB_FOR = { '': 'home', math: 'math', english: 'english', science: 'science', ai: 'ai' };

const root = $('#view');
let cleanup = null;
let navToken = 0;

export function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs));
  return { parts, query };
}

async function route() {
  const token = ++navToken;
  const { parts, query } = parseHash();
  const key = parts[0] || '';
  cleanup?.(); cleanup = null;
  const load = loaders[key] || loaders[''];
  clear(root);
  root.append(h('p', { class: 'loading' }, '🦦 Splashing in…'));
  try {
    const mod = await load();
    if (token !== navToken) return;
    clear(root);
    cleanup = mod.default(root, { parts: parts.slice(1), query }) || null;
  } catch (e) {
    console.error(e);
    clear(root);
    root.append(h('div', { class: 'card bad' }, h('h2', 'Oops – something went wrong'), h('p', String(e.message || e)), h('a', { class: 'btn', href: '#/' }, 'Go home')));
  }
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.r === (TAB_FOR[key] ?? 'more')));
  window.scrollTo({ top: 0 });
  document.title = 'PSLE Otter – Ollie’s Study Pond';
}

function applyTheme() {
  const t = store.settings.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  sound.enabled = store.settings.sound !== false;
}

function renderTopStats() {
  const p = store.profile;
  const lvl = levelFromXp(p.xp);
  const el = $('#topStats');
  clear(el);
  el.append(
    h('span', { class: 'chip', title: levelTitle(lvl) }, `⭐ Lv ${lvl}`),
    h('span', { class: 'chip', title: 'Day streak' }, `🔥 ${liveStreak(p.streak)}`),
    h('span', { class: 'chip', title: 'Experience points' }, `${p.xp} XP`));
}

function onboard() {
  const name = h('input', { type: 'text', placeholder: 'e.g. Wei Jie', maxlength: 20, 'aria-label': 'Nickname' });
  let level = 5;
  const pills = [4, 5, 6].map((l) => h('button', { class: 'pill' + (l === level ? ' on' : ''), onclick: (e) => { level = l; pills.forEach((p) => p.classList.remove('on')); e.target.classList.add('on'); } }, `P${l}`));
  const body = h('div', { class: 'stack' },
    h('p', 'Hi! I’m Ollie the otter 🦦. I’ll help you get ready for the PSLE with practice, games and (optionally) AI help.'),
    h('div', h('label', 'What should I call you? (a nickname is fine)'), name),
    h('div', h('label', 'Which level are you in?'), h('div', { class: 'pills' }, pills)),
    h('p', { class: 'muted small' }, 'Your progress stays on this device only. Please don’t type your full name, school or address anywhere in the app.'));
  modal('Welcome to Ollie’s Study Pond!', body, [{
    label: 'Let’s go! 🚀', kind: 'accent',
    onClick: () => {
      store.profile.name = name.value.trim() || 'Student';
      store.profile.level = level;
      store.state.onboarded = true;
      store.save();
      route();
    },
  }]);
}

window.addEventListener('hashchange', route);
store.subscribe(() => { renderTopStats(); applyTheme(); });
applyTheme();
renderTopStats();
route();
if (!store.state.onboarded) onboard();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support is a bonus */ });
}
