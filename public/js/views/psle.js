import { h, clear, toast } from '../ui.js';
import { store } from '../state.js';
import { AL_BANDS, SUBJECTS, computeAL, plan, markToAL, daysUntil } from '../lib/alcalc.js';
import { dateKey } from '../lib/gamify.js';

export default function psle(root) {
  const p = store.profile;
  const last = p.scores[p.scores.length - 1];
  const marks = { ...(last ? last.marks : { eng: 70, mt: 70, math: 70, sci: 70 }) };
  let target = p.goals.targetTotal || 12;
  const host = h('div');
  root.append(h('h1', '🎯 PSLE AL Calculator & Planner'), host);

  function draw() {
    clear(host);
    const res = computeAL(marks);
    const pl = res ? plan(marks, target) : null;
    const days = daysUntil(p.goals.psleDate);

    const inputs = h('div', { class: 'grid sm' }, SUBJECTS.map((s) => {
      const al = markToAL(marks[s.id]);
      const inp = h('input', { type: 'number', min: 0, max: 100, value: marks[s.id], inputmode: 'numeric', 'aria-label': s.name + ' mark', class: 'num-input', style: { maxWidth: '100%' } });
      inp.addEventListener('change', () => { marks[s.id] = Math.max(0, Math.min(100, Math.floor(+inp.value || 0))); draw(); });
      return h('div', { class: 'card', style: { margin: 0 } }, h('label', `${s.emoji} ${s.name}`), inp, h('div', { style: { marginTop: '8px' } }, h('span', { class: 'al' }, `AL${al}`)));
    }));

    host.append(
      h('div', { class: 'card' }, h('h3', 'Enter your marks (out of 100)'), inputs,
        res ? h('div', { class: 'center', style: { marginTop: '12px' } }, h('div', { class: 'muted' }, 'PSLE AL score (lower is better)'), h('div', { class: 'big-score' }, res.total), h('div', { class: 'tag' }, res.posting.label)) : null,
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn secondary', onclick: () => {
            const label = prompt('Name this score (e.g. "Prelim Paper"):', 'Practice paper');
            if (label === null) return;
            p.scores.push({ date: dateKey(), label: label.slice(0, 40), marks: { ...marks }, total: res.total }); store.save(); toast('Saved to your score history 📈', 'good'); draw();
          } }, '💾 Save to my score history'))),

      h('div', { class: 'card' }, h('h3', '🎯 Target planner'),
        h('label', 'My target AL total'),
        h('div', { class: 'row' }, h('input', { type: 'range', min: 4, max: 30, value: target, 'aria-label': 'Target total', oninput: (e) => { target = +e.target.value; p.goals.targetTotal = target; store.save(); draw(); } }), h('b', { style: { fontSize: '1.6rem' } }, target)),
        !pl ? null : pl.steps.length === 0
          ? h('div', { class: 'feedback ok' }, '🎉 Your current marks already meet this target. Aim to stay steady!')
          : h('div', h('p', `To go from ${pl.current.total} to ${target}, here is the cheapest route (smallest mark jumps first):`),
              h('table', h('thead', h('tr', h('th', 'Subject'), h('th', 'AL'), h('th', 'Mark needed'), h('th', 'Gain'))),
                h('tbody', pl.steps.map((st) => { const s = SUBJECTS.find((x) => x.id === st.subject); return h('tr', h('td', `${s.emoji} ${s.name}`), h('td', `AL${st.fromAL} → AL${st.toAL}`), h('td', h('b', st.targetMark)), h('td', `+${st.gain}`)); }))),
              !pl.reachable ? h('p', { class: 'hint' }, 'That target needs every subject at AL1 – the lowest possible total is 4.') : null,
              h('p', { class: 'muted small' }, 'Tip: improving a subject that is just below a boundary is usually the quickest win.'))),

      h('div', { class: 'card' }, h('h3', '📅 Countdown'),
        h('label', 'PSLE Written Exam start date (check the SEAB schedule)'),
        h('input', { type: 'date', value: p.goals.psleDate || '', 'aria-label': 'PSLE date', onchange: (e) => { p.goals.psleDate = e.target.value; store.save(); draw(); } }),
        days != null ? h('p', days >= 0 ? `⏳ ${days} day${days === 1 ? '' : 's'} to go. ${days > 0 ? `That is about ${Math.ceil(days / 7)} weeks – a little each day adds up!` : 'Good luck!'}` : 'That date has passed. Update it for next year, or celebrate! 🎉') : null),

      p.scores.length ? h('div', { class: 'card' }, h('h3', '📈 My score history'), trend(p.scores),
        h('table', h('thead', h('tr', h('th', 'Date'), h('th', 'Paper'), h('th', 'E / MT / M / S'), h('th', 'AL'))),
          h('tbody', [...p.scores].reverse().slice(0, 12).map((s) => h('tr', h('td', s.date), h('td', s.label), h('td', `${s.marks.eng} / ${s.marks.mt} / ${s.marks.math} / ${s.marks.sci}`), h('td', h('b', s.total))))))) : null,

      h('details', { class: 'card' }, h('summary', 'How AL scores work'),
        h('table', h('thead', h('tr', h('th', 'Marks'), h('th', 'AL'))), h('tbody', AL_BANDS.map((b) => h('tr', h('td', b.min === b.max ? b.min : `${b.min}–${b.max}`), h('td', `AL${b.al}`))))),
        h('p', 'Your PSLE score is the sum of 4 subject ALs (English, Mother Tongue, Maths, Science): the lowest is 4 (best), the highest 32.'),
        h('p', { class: 'muted small' }, 'This tool follows the AL system introduced for the 2021 PSLE cohort. Posting groups, Higher Mother Tongue adjustments, Foundation-level subjects and tie-breakers can change – always confirm with the latest MOE/SEAB information and your school.')));
  }
  draw();
}

function trend(scores) {
  const pts = scores.slice(-12);
  if (pts.length < 2) return h('p', { class: 'muted small' }, 'Save another score to see your trend line.');
  const W = 300, H = 80, min = 4, max = 32;
  const x = (i) => 10 + (i * (W - 20)) / (pts.length - 1);
  const y = (v) => 8 + ((v - min) / (max - min)) * (H - 16);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'AL total over time (lower is better)'); svg.style.width = '100%'; svg.style.maxWidth = '420px';
  const poly = document.createElementNS(ns, 'polyline');
  poly.setAttribute('points', pts.map((s, i) => `${x(i)},${y(s.total)}`).join(' '));
  poly.setAttribute('fill', 'none'); poly.setAttribute('stroke', 'currentColor'); poly.setAttribute('stroke-width', '3'); poly.style.color = 'var(--brand)';
  svg.append(poly);
  pts.forEach((s, i) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(s.total)); c.setAttribute('r', 4); c.setAttribute('fill', 'var(--accent)'); svg.append(c); });
  return h('div', svg, h('div', { class: 'muted small' }, 'AL total (lower is better) ↓'));
}
