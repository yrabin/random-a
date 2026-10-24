import { h, clear, toast, modal, download } from '../ui.js';
import { store, askAI, AIError, storage } from '../state.js';
import { PROVIDERS } from '../lib/ai.js';
import { dateKey } from '../lib/gamify.js';

const AVATARS = ['🦦', '🦁', '🐯', '🐼', '🦊', '🐬', '🦉', '🐙', '🦄', '🐲'];

export default function settings(root) {
  const host = h('div');
  root.append(h('h1', '⚙️ Settings'), host);
  const draw = () => { clear(host); host.append(profileCard(draw), aiCard(draw), appearanceCard(draw), dataCard(draw), aboutCard()); };
  draw();
}

function profileCard(redraw) {
  const p = store.profile;
  const name = h('input', { type: 'text', value: p.name, maxlength: 20, 'aria-label': 'Nickname', onchange: (e) => { p.name = e.target.value.trim() || 'Student'; store.save(); } });
  const profiles = Object.values(store.state.profiles);
  return h('div', { class: 'card' }, h('h2', '👤 Profile'),
    h('label', 'Nickname'), name,
    h('label', 'Level'), h('div', { class: 'pills' }, [4, 5, 6].map((l) => h('button', { class: 'pill' + (l === p.level ? ' on' : ''), onclick: () => { p.level = l; store.save(); redraw(); } }, `P${l}`))),
    h('label', 'Avatar'), h('div', { class: 'pills' }, AVATARS.map((a) => h('button', { class: 'pill' + (a === p.avatar ? ' on' : ''), onclick: () => { p.avatar = a; store.save(); redraw(); }, 'aria-label': 'Avatar ' + a }, a))),
    h('hr'),
    h('b', 'Siblings or friends sharing this device?'),
    h('div', { class: 'row' }, profiles.map((q) => h('button', { class: 'pill' + (q.id === p.id ? ' on' : ''), onclick: () => { store.switchProfile(q.id); redraw(); } }, `${q.avatar} ${q.name} (P${q.level})`)),
      h('button', { class: 'btn secondary sm', onclick: () => { const n = prompt('Nickname for the new profile?'); if (n) { store.addProfile(n.slice(0, 20), p.level); toast('Profile added', 'good'); redraw(); } } }, '＋ Add profile'),
      profiles.length > 1 ? h('button', { class: 'btn ghost sm', onclick: () => { if (confirm(`Delete ${p.name}'s profile and progress?`)) { store.deleteProfile(p.id); redraw(); } } }, '🗑️ Delete this profile') : null));
}

function aiCard(redraw) {
  const cfg = store.settings.ai;
  cfg.provider ||= 'anthropic';
  const prov = PROVIDERS[cfg.provider];
  const key = h('input', { type: 'password', value: cfg.key || '', placeholder: prov.needsKey ? 'Paste your API key' : '(optional)', autocomplete: 'off', 'aria-label': 'API key', onchange: (e) => { cfg.key = e.target.value.trim(); store.save(); } });
  const show = h('label', { class: 'inline small' }, h('input', { type: 'checkbox', onchange: (e) => { key.type = e.target.checked ? 'text' : 'password'; } }), 'Show key');
  const model = h('input', { type: 'text', value: cfg.model || '', placeholder: prov.model || 'model name', 'aria-label': 'Model', onchange: (e) => { cfg.model = e.target.value.trim(); store.save(); } });
  const base = h('input', { type: 'url', value: cfg.baseUrl || '', placeholder: prov.base || 'http://localhost:11434/v1', 'aria-label': 'Base URL', onchange: (e) => { cfg.baseUrl = e.target.value.trim(); store.save(); } });
  const result = h('div', { 'aria-live': 'polite' });
  return h('div', { class: 'card ai' }, h('h2', '🤖 AI helper (optional, bring your own key)'),
    h('p', { class: 'muted' }, 'The app is fully usable without this. Add a key to unlock the tutor chat, composition coach, oral coach, photo checking, Question Forge and coach’s notes. Your key is saved only in this browser and is sent only to the AI company you choose.'),
    h('label', 'Provider'),
    h('select', { 'aria-label': 'Provider', onchange: (e) => { cfg.provider = e.target.value; cfg.model = ''; store.save(); redraw(); } }, Object.entries(PROVIDERS).map(([k, v]) => h('option', { value: k, selected: k === cfg.provider }, v.label))),
    h('p', { class: 'small muted' }, prov.note, ' ', prov.keyUrl ? h('a', { href: prov.keyUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Get a key →') : null),
    cfg.provider === 'custom' ? h('div', h('label', 'Base URL'), base) : null,
    h('label', 'API key'), key, show,
    h('label', `Model ${prov.model ? '(leave blank for ' + prov.model + ')' : ''}`), model,
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: async (e) => {
        cfg.key = key.value.trim(); cfg.model = model.value.trim(); if (cfg.provider === 'custom') cfg.baseUrl = base.value.trim(); store.save();
        e.target.disabled = true; clear(result); result.append('Testing…');
        try { const t = await askAI({ system: 'You are a friendly otter. Reply in at most 12 words.', messages: [{ role: 'user', content: 'Say hello and tell me you are working.' }], maxTokens: 60 }); clear(result); result.append(h('div', { class: 'feedback ok' }, '✅ Works! Ollie says: ' + t)); }
        catch (er) { clear(result); result.append(h('div', { class: 'feedback no' }, er instanceof AIError ? er.message : 'Test failed: ' + er.message)); }
        e.target.disabled = false;
      } }, 'Save & test'),
      cfg.key ? h('button', { class: 'btn ghost', onclick: () => { cfg.key = ''; store.save(); redraw(); toast('Key removed from this browser'); } }, 'Remove key') : null),
    result,
    h('details', h('summary', 'Safety tips for parents'), h('ul', [
      'Create a separate API key just for this app and set a low monthly spending limit in the provider’s console.',
      'Typical use by a student costs cents per month on a small model; use the cheapest model (the default).',
      'Anyone using this browser profile can use the key. Use a private/child profile and remove the key if you hand over the device.',
      'The key is stored in the browser’s local storage. Do not enter it on a shared or public computer.'].map((t) => h('li', t)))));
}

function appearanceCard(redraw) {
  const s = store.settings;
  return h('div', { class: 'card' }, h('h2', '🎨 Appearance & sound'),
    h('label', 'Theme'), h('div', { class: 'pills' }, [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => h('button', { class: 'pill' + ((s.theme || 'auto') === k ? ' on' : ''), onclick: () => { s.theme = k; store.save(); redraw(); } }, l))),
    h('label', { class: 'inline', style: { marginTop: '10px' } }, h('input', { type: 'checkbox', checked: s.sound !== false, onchange: (e) => { s.sound = e.target.checked; store.save(); } }), 'Sound effects'));
}

function dataCard(redraw) {
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async () => {
    const f = file.files[0]; if (!f) return;
    try { store.importData(await f.text()); toast('Backup restored ✅', 'good'); redraw(); } catch (e) { toast(e.message || 'Could not read that file', 'bad'); }
  } });
  return h('div', { class: 'card' }, h('h2', '💾 Your data'),
    h('p', { class: 'muted' }, 'Progress lives only in this browser on this device. Download a backup now and then (and before changing devices or clearing browser data).'),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => download(`psle-otter-backup-${dateKey()}.json`, store.exportData()) }, '⬇️ Download backup'),
      h('button', { class: 'btn secondary', onclick: () => file.click() }, '⬆️ Restore backup'), file,
      h('button', { class: 'btn danger', onclick: () => { if (confirm('Erase ALL progress and settings on this device? This cannot be undone.')) { store.resetAll(); location.hash = '#/'; location.reload(); } } }, 'Erase everything')),
    storage.volatile ? h('p', { class: 'feedback no' }, 'Your browser is blocking local storage (private mode?), so progress will be lost when you close the tab.') : null,
    h('p', { class: 'small muted' }, 'Backups do not include your AI key.'));
}

function aboutCard() {
  return h('div', { class: 'card' }, h('h2', 'ℹ️ About'),
    h('p', 'PSLE Otter is a free, open-source study buddy. It is not affiliated with the Singapore Ministry of Education or SEAB. Content is practice material written for revision; always follow your school’s teachers and the latest official syllabus.'),
    h('p', { class: 'small muted' }, 'Version 1.0.0 · Works offline once loaded · No tracking, no ads, no accounts.'),
    h('a', { href: '#/help', class: 'btn secondary sm' }, '📘 Quick guide'));
}
