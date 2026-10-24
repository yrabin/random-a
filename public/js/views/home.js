import { h, clear } from '../ui.js';
import { store, aiReady } from '../state.js';
import { dateKey, levelFromXp, xpForLevel, levelTitle, liveStreak } from '../lib/gamify.js';
import { daysUntil } from '../lib/alcalc.js';
import { dueCards } from '../lib/srs.js';
import { TOPICS } from '../lib/mathgen.js';

const TIPS = [
  'Draw a bar model for every ratio and fraction problem – even when it looks easy.',
  'Read the question twice and underline the numbers and units.',
  'Check your answer by putting it back into the story of the question.',
  'In Science open-ended answers, use Claim → Evidence → Reasoning.',
  'For compositions, show the feeling – don’t just say "she was sad".',
  'Little and often beats cramming: 20 focused minutes a day is powerful.',
  'Sleep is a study tool. Your brain files away what you learnt while you rest.',
  'Always write the unit (cm², km/h, $) in your final answer.',
  'In Maths, "of" usually means multiply. "Per" usually means divide.',
  'Stuck? Try a simpler version of the problem with smaller numbers first.',
];

export default function home(root) {
  const p = store.profile;
  const lvl = levelFromXp(p.xp);
  const into = p.xp - xpForLevel(lvl), span = xpForLevel(lvl + 1) - xpForLevel(lvl);
  const today = dateKey();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const days = daysUntil(p.goals.psleDate);
  const due = dueCards(p.mistakes).length;
  const dailyDone = p.daily[today]?.done;
  const tip = TIPS[new Date().getDate() % TIPS.length];

  // weakest math topic (min 3 attempts)
  const weak = Object.entries(p.topics)
    .filter(([k, v]) => k.startsWith('math:') && v.answered >= 3)
    .map(([k, v]) => ({ id: k.slice(5), name: v.name, acc: v.correct / v.answered }))
    .sort((a, b) => a.acc - b.acc)[0];

  root.append(
    h('div', { class: 'ollie' },
      h('div', { class: 'face', 'aria-hidden': 'true' }, '🦦'),
      h('div', { class: 'bubble' }, `${greet}, ${p.name}! `, h('span', { class: 'muted' }, `Level ${lvl} · ${levelTitle(lvl)}`))),
    h('div', { style: { height: '10px' } }),

    h('div', { class: 'grid' },
      h('div', { class: 'card' },
        h('b', `Level ${lvl} → ${lvl + 1}`),
        h('div', { class: 'bar', style: { margin: '8px 0' } }, h('i', { style: { width: Math.min(100, (into / span) * 100) + '%' } })),
        h('div', { class: 'small muted' }, `${into}/${span} XP · 🔥 ${liveStreak(p.streak)}-day streak`)),
      days != null && days >= 0
        ? h('div', { class: 'card soft center' }, h('div', { class: 'big-score' }, days), h('div', { class: 'muted' }, days === 0 ? 'PSLE day – you can do it!' : `day${days === 1 ? '' : 's'} to the PSLE`), h('a', { class: 'small', href: '#/psle' }, 'Change date'))
        : h('a', { class: 'card soft tile', href: '#/psle' }, h('b', '📅 Set your PSLE countdown'), h('small', 'Pick your exam date and a target AL score.'))),

    h('a', { class: `card tile ${dailyDone ? '' : 'ai'}`, href: '#/math/daily', style: { marginTop: '4px' } },
      h('b', dailyDone ? '✅ Daily Challenge complete!' : '📅 Today’s Daily Challenge'),
      h('small', dailyDone ? 'Come back tomorrow for a fresh set. Streak safe!' : '6 mixed questions · Maths, English & Science · earns bonus XP')),

    h('h2', 'Practise'),
    h('div', { class: 'grid sm' },
      tile('➗', 'Maths', 'Unlimited fresh questions', '#/math'),
      tile('📖', 'English', 'Vocab, grammar, writing, oral', '#/english'),
      tile('🔬', 'Science', 'MCQ & open-ended', '#/science'),
      tile('🀄', 'Chinese', '成语 & vocabulary', '#/chinese'),
      tile('📒', 'Mistake Notebook', due ? `${due} due for review` : 'Fix errors for good', '#/mistakes', due ? 'ai' : ''),
      tile('🎯', 'PSLE AL Calculator', 'Scores, targets, planner', '#/psle')),

    weak ? h('div', { class: 'card warn' }, h('b', '🦦 Ollie suggests: '), `Your accuracy in “${weak.name}” is ${Math.round(weak.acc * 100)}%. `, h('a', { href: `#/math/play?topics=${weak.id}&n=8` }, 'Practise it now →')) : null,

    h('div', { class: 'card' }, h('b', '💡 Tip of the day'), h('p', { style: { margin: '4px 0 0' } }, tip)),

    !aiReady()
      ? h('a', { class: 'card tile ai', href: '#/settings' }, h('b', '🤖 Unlock AI helpers (optional)'), h('small', 'Everything works without a key. Add your own AI key to get a tutor, composition marking, custom questions and more.'))
      : h('a', { class: 'card tile ai', href: '#/ai' }, h('b', '🤖 Ask Ollie (AI is on)'), h('small', 'Tutor chat, question forge, composition coach, photo marking…')));
  void TOPICS;
}

function tile(emoji, title, sub, href, cls = '') {
  return h('a', { class: `tile ${cls}`, href }, h('span', { class: 'big' }, emoji), h('b', title), h('small', sub));
}
