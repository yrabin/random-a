// Tiny DOM helpers - everything is built with createElement/textContent, so nothing user- or AI-supplied
// is ever parsed as HTML.

// Native append() would print the text "null" for null/false children. Views freely use `cond ? node : null`,
// so make append()/prepend() skip empty values and accept nested arrays.
for (const proto of [Element.prototype, DocumentFragment.prototype]) {
  for (const m of ['append', 'prepend']) {
    const native = proto[m];
    proto[m] = function (...c) { return native.apply(this, c.flat(Infinity).filter((x) => x != null && x !== false)); };
  }
}

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs);
    attrs = null;
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const $ = (sel, root = document) => root.querySelector(sel);

/** Minimal, safe Markdown → DOM (headings, bold, italics, code, lists, paragraphs). */
export function md(text) {
  const frag = document.createDocumentFragment();
  const inline = (s) => {
    const out = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      const t = m[0];
      if (t.startsWith('**')) out.push(h('strong', t.slice(2, -2)));
      else if (t.startsWith('`')) out.push(h('code', t.slice(1, -1)));
      else out.push(h('em', t.slice(1, -1)));
      last = m.index + t.length;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  };
  const lines = String(text).replace(/\r/g, '').split('\n');
  let list = null, para = [];
  const flushPara = () => { if (para.length) { frag.append(h('p', inline(para.join(' ')))); para = []; } };
  const flushList = () => { if (list) { frag.append(list); list = null; } };
  for (const line of lines) {
    const t = line.trim();
    let m;
    if (!t) { flushPara(); flushList(); continue; }
    if ((m = t.match(/^(#{1,4})\s+(.*)$/))) { flushPara(); flushList(); frag.append(h('h' + Math.min(6, m[1].length + 2), inline(m[2]))); continue; }
    if ((m = t.match(/^[-*•]\s+(.*)$/))) { flushPara(); if (!list || list.tagName !== 'UL') { flushList(); list = h('ul'); } list.append(h('li', inline(m[1]))); continue; }
    if ((m = t.match(/^\d+[.)]\s+(.*)$/))) { flushPara(); if (!list || list.tagName !== 'OL') { flushList(); list = h('ol'); } list.append(h('li', inline(m[1]))); continue; }
    flushList();
    para.push(t);
  }
  flushPara(); flushList();
  return h('div', { class: 'md' }, frag);
}

// ---------- feedback: toast, sound, confetti ----------
let toastHost;
export function toast(msg, kind = 'info', ms = 3200) {
  if (!toastHost) { toastHost = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.append(toastHost); }
  const t = h('div', { class: `toast ${kind}` }, msg);
  toastHost.append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

let audioCtx;
export const sound = { enabled: true };
export function beep(kind) {
  if (!sound.enabled) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [[660, 0.08], [880, 0.12]], bad: [[220, 0.18]], level: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]], click: [[500, 0.04]] }[kind] || [];
    let t = audioCtx.currentTime;
    for (const [f, d] of notes) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = kind === 'bad' ? 'triangle' : 'sine';
      o.frequency.value = f; g.gain.value = 0.07;
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + d); t += d;
    }
  } catch { /* audio not available */ }
}

export function confetti(n = 28) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const host = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const bits = ['🎉', '⭐', '✨', '🦦', '🎊', '💧'];
  for (let i = 0; i < n; i++) {
    host.append(h('span', { style: { left: Math.random() * 100 + '%', animationDelay: Math.random() * 0.6 + 's', animationDuration: 1.8 + Math.random() * 1.6 + 's', fontSize: 18 + Math.random() * 18 + 'px' } }, bits[i % bits.length]));
  }
  document.body.append(host);
  setTimeout(() => host.remove(), 4200);
}

export function modal(title, body, actions = []) {
  const back = h('div', { class: 'modal-back', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  const box = h('div', { class: 'modal' },
    h('h2', title), body,
    h('div', { class: 'row end' }, ...actions.map((a) => h('button', { class: `btn ${a.kind || ''}`, onclick: () => { if (a.onClick?.() !== false) close(); } }, a.label)), h('button', { class: 'btn ghost', onclick: close }, 'Close')));
  back.append(box);
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  document.body.append(back);
  return close;
}

export function download(filename, text, type = 'application/json') {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: filename });
  document.body.append(a); a.click(); a.remove();
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function spinner(msg = 'Ollie is thinking…') {
  return h('div', { class: 'thinking', role: 'status' }, h('span', { class: 'otter-bob' }, '🦦'), ' ', msg);
}

/** Draw a bar model (rows of unit segments) as SVG. Built with createElementNS - no HTML parsing. */
export function barModel(rows) {
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, text) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };
  const W = 320, labelW = 78, rowH = 34, gap = 22, top = 8;
  const maxUnits = Math.max(...rows.map((r) => r.segs.reduce((s, x) => s + x.units, 0)));
  const scale = (W - labelW - 8) / maxUnits;
  const svg = mk('svg', { viewBox: `0 0 ${W} ${top + rows.length * (rowH + gap)}`, role: 'img', 'aria-label': 'Bar model of the problem' });
  svg.style.width = '100%'; svg.style.maxWidth = '420px';
  rows.forEach((r, i) => {
    const y = top + i * (rowH + gap);
    svg.append(mk('text', { x: 0, y: y + rowH / 2 + 5, 'font-size': 13, 'font-weight': 800, fill: 'currentColor' }, (r.label || '').slice(0, 11)));
    let x = labelW;
    const total = r.segs.reduce((s, q) => s + q.units, 0);
    r.segs.forEach((sg) => {
      const w = sg.units * scale;
      svg.append(mk('rect', { x, y, width: w, height: rowH, rx: 4, fill: sg.kind === 'b' ? 'var(--accent-soft)' : 'var(--brand-soft)', stroke: sg.kind === 'b' ? 'var(--accent)' : 'var(--brand)', 'stroke-width': 2, 'stroke-dasharray': sg.kind === 'b' ? '5 3' : '0' }));
      if (sg.units > 1 && sg.units <= 12) for (let k = 1; k < sg.units; k++) svg.append(mk('line', { x1: x + k * scale, y1: y, x2: x + k * scale, y2: y + rowH, stroke: sg.kind === 'b' ? 'var(--accent)' : 'var(--brand)', 'stroke-width': 1, opacity: 0.5 }));
      if (sg.text && w > 34) svg.append(mk('text', { x: x + w / 2, y: y + rowH / 2 + 5, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 800, fill: 'currentColor' }, sg.text.length > Math.floor(w / 6.4) ? sg.text.slice(0, Math.max(3, Math.floor(w / 6.4) - 1)) + '…' : sg.text));
      x += w;
    });
    if (r.total) {
      svg.append(mk('path', { d: `M${labelW} ${y + rowH + 5} v5 H${x} v-5`, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, opacity: 0.6 }));
      svg.append(mk('text', { x: (labelW + x) / 2, y: y + rowH + 21, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: 'currentColor' }, r.total));
    }
    void total;
  });
  return svg;
}
