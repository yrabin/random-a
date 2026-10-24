import { h, clear, beep, toast, confetti } from '../ui.js';
import { store } from '../state.js';

const PRESETS = [[15, 3], [25, 5], [40, 10]];
const PLAN = ['Pick ONE topic.', 'Put your phone out of reach.', 'Have water and paper ready.', 'Write down any distracting thoughts and return to them later.'];

export default function focus(root) {
  let [work, rest] = PRESETS[1];
  let phase = 'idle', left = 0, tick = null, endAt = 0;
  const host = h('div');
  root.append(h('h1', '⏱️ Focus timer'), host);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  function draw() {
    clear(host);
    if (phase === 'idle') {
      host.append(h('div', { class: 'card' },
        h('p', 'Study in short, focused bursts, then take a real break. Every completed focus session earns XP and counts towards the “Deep focus” badge.'),
        h('div', { class: 'pills' }, PRESETS.map(([w, r]) => h('button', { class: 'pill' + (w === work ? ' on' : ''), onclick: () => { work = w; rest = r; draw(); } }, `${w} min + ${r} break`))),
        h('div', { class: 'timer' }, fmt(work * 60)),
        h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn accent', onclick: () => start('work', work * 60) }, '▶ Start focusing')),
        h('details', h('summary', 'Before you start'), h('ul', PLAN.map((x) => h('li', x))))),
        h('div', { class: 'card soft' }, `Sessions so far: ${store.profile.totals.focusSessions || 0} · Total focus: ${store.profile.totals.focusMinutes || 0} min`));
    } else {
      const isWork = phase === 'work';
      host.append(h('div', { class: 'card center' }, h('div', { style: { fontSize: '3rem' } }, isWork ? '📚' : '☕'), h('h2', isWork ? 'Focus time' : 'Break time'), h('div', { class: 'timer', id: 'clock', role: 'timer' }, fmt(left)),
        h('p', { class: 'muted' }, isWork ? 'Stay with one task. You’ve got this!' : 'Stand up, stretch, drink water, look at something far away.'),
        h('button', { class: 'btn secondary', onclick: stop }, 'Stop')));
    }
  }
  function start(ph, secs) {
    phase = ph; left = secs; endAt = Date.now() + secs * 1000;
    clearInterval(tick);
    tick = setInterval(() => {
      left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      const c = document.getElementById('clock'); if (c) c.textContent = fmt(left);
      document.title = `${fmt(left)} – PSLE Otter`;
      if (left <= 0) done();
    }, 500);
    draw();
  }
  function done() {
    clearInterval(tick);
    beep('level');
    if (phase === 'work') {
      store.profile.totals.focusMinutes = (store.profile.totals.focusMinutes || 0) + work;
      store.profile.xp += work;
      const badges = store.bump('focusSessions');
      confetti(14);
      toast(`🎉 Focus session done! +${work} XP`, 'good');
      badges.forEach((b) => toast(`${b.emoji} Badge unlocked: ${b.name}!`, 'good', 4500));
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Time for a break! 🦦');
      start('rest', rest * 60);
    } else { phase = 'idle'; document.title = 'PSLE Otter'; toast('Break over – ready for another round?'); draw(); }
  }
  function stop() { clearInterval(tick); phase = 'idle'; document.title = 'PSLE Otter'; draw(); }
  draw();
  return () => { clearInterval(tick); document.title = 'PSLE Otter'; };
}
