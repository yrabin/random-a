import { h, clear, toast, pct } from '../ui.js';
import { store } from '../state.js';
import { dueCards } from '../lib/srs.js';
import { answerToString } from '../lib/mathgen.js';
import { startQuiz } from './quiz.js';

export default function mistakes(root, { parts }) {
  if (parts[0] === 'review') return review(root);
  const p = store.profile;
  const cards = p.mistakes.filter((c) => !c.mastered);
  const due = dueCards(p.mistakes);
  const mastered = p.mistakes.filter((c) => c.mastered).length;
  root.append(
    h('h1', '📒 Mistake Notebook'),
    h('p', { class: 'muted' }, 'Every question you get wrong is saved here. Ollie brings each one back after 1, 2, 4, 8, 16 and 32 days – answer it right every time and it is mastered for good. This is called spaced repetition, and it is one of the best ways to remember.'),
    h('div', { class: 'grid sm' }, stat(due.length, 'due today'), stat(cards.length, 'in notebook'), stat(mastered, 'mastered 🏅')),
    due.length ? h('div', { class: 'row' }, h('a', { class: 'btn accent', href: '#/mistakes/review' }, `Review ${Math.min(due.length, 10)} now 🔁`)) : h('div', { class: 'card good' }, cards.length ? '🎉 Nothing due right now. Come back later!' : '✨ No mistakes saved yet. Go practise – mistakes are how we grow!'),
    cards.length ? h('details', { class: 'card' }, h('summary', `All saved questions (${cards.length})`),
      cards.slice().reverse().map((c) => h('div', { style: { padding: '8px 0', borderBottom: '1px solid var(--line)' } },
        h('div', { class: 'qmeta' }, `${c.snapshot.topicName || c.snapshot.subject} · box ${c.box + 1}/7`), h('div', c.snapshot.q), h('div', { class: 'small' }, 'Answer: ', answerText(c.snapshot)),
        h('button', { class: 'btn ghost sm', onclick: () => { store.removeMistake(c.id); toast('Removed'); location.reload(); } }, 'Remove')))) : null);
}

const stat = (n, l) => h('div', { class: 'card stat', style: { margin: 0 } }, h('b', n), h('span', { class: 'muted' }, l));
function answerText(s) { return s.type === 'mcq' ? s.options[s.answerIndex] : s.type === 'open' ? (s.modelAnswer || s.model) : answerToString(s); }

function review(root) {
  const due = dueCards(store.profile.mistakes).slice(0, 10);
  if (!due.length) { root.append(h('div', { class: 'card center' }, h('h2', 'All caught up! 🎉'), h('a', { class: 'btn', href: '#/mistakes' }, 'Back'))); return; }
  const questions = due.map((c) => ({ ...c.snapshot, _cardId: c.id, _order: undefined }));
  return startQuiz(root, {
    title: 'Mistake review', questions, subject: 'mixed', backHref: '#/mistakes', mode: 'review',
    onAnswer: (q, ok) => {
      const r = store.reviewMistake(q._cardId, ok);
      const rw = store.record({ id: q.id, subject: q.subject || 'math', topic: q.topic, topicName: q.topicName }, ok, { quiet: false });
      if (r?.card.mastered) toast('🏅 Mastered! This card is retired.', 'good');
      return { ...rw, badges: [...(rw.badges || []), ...(r?.badges || [])] };
    },
  });
  void pct;
}
