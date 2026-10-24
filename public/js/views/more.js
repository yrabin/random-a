import { h } from '../ui.js';
import { store } from '../state.js';
import { dueCards } from '../lib/srs.js';

export default function more(root) {
  const due = dueCards(store.profile.mistakes).length;
  const t = (e, title, sub, href, cls = '') => h('a', { class: `tile ${cls}`, href }, h('span', { class: 'big' }, e), h('b', title), h('small', sub));
  root.append(h('h1', 'More'),
    h('div', { class: 'grid' },
      t('🀄', 'Chinese corner', '成语 & 词语', '#/chinese'),
      t('🎯', 'PSLE AL Calculator', 'Scores, targets, countdown', '#/psle'),
      t('📒', 'Mistake Notebook', due ? `${due} due now` : 'Spaced repetition', '#/mistakes', due ? 'ai' : ''),
      t('📊', 'Progress & badges', 'Heat-map, streaks, parent report', '#/progress'),
      t('⏱️', 'Focus timer', 'Study sprints', '#/focus'),
      t('🖨️', 'Worksheets', 'Printable Maths sheets', '#/worksheets'),
      t('⚡', '60-second Blitz', 'Mental maths speed round', '#/math/blitz'),
      t('📘', 'Quick guide', 'How everything works', '#/help'),
      t('⚙️', 'Settings', 'Profile, AI key, backup', '#/settings')));
}
