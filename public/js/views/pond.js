// "Ollie's pond": a small SVG scene that grows with the student's level, badges and streak.
import { levelFromXp, liveStreak } from '../lib/gamify.js';
import { makeRng } from '../lib/rng.js';

const ns = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs = {}, text) => {
  const e = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
};

export function pond(profile, hour = new Date().getHours()) {
  const lvl = levelFromXp(profile.xp);
  const badges = Object.keys(profile.badges).length;
  const streak = liveStreak(profile.streak);
  const night = hour >= 19 || hour < 6;
  const dusk = !night && (hour >= 17 || hour < 8);
  const rng = makeRng(profile.created || 1);
  const sky = night ? ['#0b1d3a', '#1d3b6b'] : dusk ? ['#ff9a6c', '#ffd7a8'] : ['#8fd8f5', '#e4f7ff'];

  const svg = mk('svg', { viewBox: '0 0 320 150', role: 'img', 'aria-label': `Ollie's pond. Level ${lvl}, ${badges} badges, ${streak} day streak.` });
  svg.classList.add('pond');
  const defs = mk('defs');
  const g = mk('linearGradient', { id: 'pondSky', x1: 0, y1: 0, x2: 0, y2: 1 });
  g.append(mk('stop', { offset: '0', 'stop-color': sky[0] }), mk('stop', { offset: '1', 'stop-color': sky[1] }));
  const w = mk('linearGradient', { id: 'pondWater', x1: 0, y1: 0, x2: 0, y2: 1 });
  w.append(mk('stop', { offset: '0', 'stop-color': night ? '#14486b' : '#2fb6c4' }), mk('stop', { offset: '1', 'stop-color': night ? '#0a2a45' : '#0e7c86' }));
  defs.append(g, w);
  svg.append(defs, mk('rect', { width: 320, height: 150, fill: 'url(#pondSky)', rx: 14 }));

  if (night) for (let i = 0; i < 18; i++) svg.append(mk('circle', { cx: rng.int(8, 312), cy: rng.int(6, 60), r: rng.chance(0.2) ? 1.6 : 0.9, fill: '#fff', opacity: 0.8 }));
  else svg.append(mk('circle', { cx: dusk ? 40 : 270, cy: dusk ? 80 : 28, r: 14, fill: dusk ? '#fff3c4' : '#ffe27a', opacity: 0.95 }));

  // Skyline grows with level (silhouette of Marina Bay)
  const sil = night ? '#0a1730' : dusk ? '#9a5b6a' : '#7fb2c4';
  if (lvl >= 2) {
    let x = 0;
    while (x < 320) { const bw = rng.int(14, 26), bh = rng.int(14, 38); svg.append(mk('rect', { x, y: 88 - bh, width: bw, height: bh, fill: sil, opacity: 0.85 })); x += bw + rng.int(0, 4); }
  }
  if (lvl >= 4) { // three towers + sky-park boat
    for (const x of [110, 132, 154]) svg.append(mk('path', { d: `M${x} 88 L${x + 4} 38 L${x + 14} 38 L${x + 18} 88 Z`, fill: sil }));
    svg.append(mk('path', { d: 'M100 38 Q135 30 172 38 L168 43 Q135 38 104 43 Z', fill: sil }));
  }
  if (lvl >= 6) svg.append(mk('circle', { cx: 230, cy: 60, r: 24, fill: 'none', stroke: sil, 'stroke-width': 3 }), mk('rect', { x: 227, y: 82, width: 6, height: 8, fill: sil }));
  if (lvl >= 8) { // durian domes
    svg.append(mk('ellipse', { cx: 60, cy: 88, rx: 22, ry: 14, fill: sil }), mk('ellipse', { cx: 92, cy: 88, rx: 18, ry: 11, fill: sil }));
  }

  // water
  svg.append(mk('rect', { x: 0, y: 88, width: 320, height: 62, fill: 'url(#pondWater)' }));
  for (let i = 0; i < 6; i++) svg.append(mk('path', { d: `M${i * 56 - 10} ${100 + (i % 3) * 12} q14 -6 28 0 t28 0`, fill: 'none', stroke: '#fff', 'stroke-width': 1.5, opacity: 0.35 }));

  // lily pads (one per level, up to 8) and flowers for badges
  const padX = [24, 70, 120, 188, 242, 290, 160, 52];
  for (let i = 0; i < Math.min(lvl, 8); i++) {
    const cx = padX[i], cy = 118 + (i % 3) * 9;
    svg.append(mk('ellipse', { cx, cy, rx: 15, ry: 5.5, fill: '#3cb371' }), mk('path', { d: `M${cx} ${cy} l12 -3`, stroke: '#2a8f58', 'stroke-width': 1.2 }));
    if (i < badges) svg.append(mk('circle', { cx: cx - 3, cy: cy - 5, r: 4, fill: '#ff8fb1' }), mk('circle', { cx: cx - 3, cy: cy - 5, r: 1.6, fill: '#ffd24d' }));
  }

  // fish for badges
  for (let i = 0; i < Math.min(badges, 8); i++) {
    const f = mk('g', {});
    f.classList.add('pond-fish');
    f.style.animationDelay = `${-i * 1.7}s`;
    f.style.animationDuration = `${9 + (i % 4) * 2}s`;
    const y = 124 + (i % 4) * 6;
    f.append(mk('ellipse', { cx: 0, cy: y, rx: 7, ry: 3.5, fill: ['#ffb347', '#ff7f7f', '#ffd966', '#c8a2ff'][i % 4] }), mk('path', { d: `M-6 ${y} l-6 -4 v8 z`, fill: ['#ffb347', '#ff7f7f', '#ffd966', '#c8a2ff'][i % 4] }), mk('circle', { cx: 3, cy: y - 1, r: 0.9, fill: '#14323a' }));
    svg.append(f);
  }

  // Ollie
  const o = mk('text', { x: 160, y: 118, 'text-anchor': 'middle', 'font-size': 34 }, profile.avatar || '🦦');
  o.classList.add('pond-ollie');
  svg.append(o);

  // fireflies for streak days
  for (let i = 0; i < Math.min(streak, 7); i++) {
    const c = mk('circle', { cx: rng.int(20, 300), cy: rng.int(30, 84), r: 2.2, fill: '#fff59d' });
    c.classList.add('pond-fly'); c.style.animationDelay = `${-i * 0.7}s`;
    svg.append(c);
  }
  return svg;
}
