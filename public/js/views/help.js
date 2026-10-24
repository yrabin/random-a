import { h } from '../ui.js';

const SECTIONS = [
  ['🚀 Getting started', ['Pick your level (P4, P5 or P6) when Ollie asks. You can change it any time in Settings.', 'Answer questions to earn XP, build a streak, and unlock badges.', 'Do the Daily Challenge on the Home page: 6 mixed questions, new every day.']],
  ['➗ Maths', ['Maths questions are generated fresh every time – you will never run out. Tap topics to focus, or start “mixed”.', 'Type fractions like 3/4 or 1 3/4, decimals like 2.5, and money like 12.50 (you don’t need the $ sign).', 'Wrong? Read the step-by-step working. The question also goes into your Mistake Notebook.', 'Try the 60-second Blitz for speed, and the printable worksheets for paper practice.']],
  ['📖 English, 🔬 Science, 🀄 Chinese', ['Multiple-choice quizzes explain every answer.', 'Open-ended questions: write your own answer first, then compare with the model answer and key words, and mark yourself honestly.', 'Composition Lab: get ideas, a plot-twist generator, a free checker, and (with AI) PSLE-style marking.']],
  ['📒 Mistake Notebook', ['Wrong answers come back after 1, 2, 4, 8, 16 and 32 days. Get them right each time and they are mastered. Spend 5 minutes on it each day!']],
  ['🎯 PSLE AL Calculator', ['Enter your marks to see each subject’s AL (1–8) and your total (4–32). Slide the target to see which subjects to improve first.']],
  ['🤖 AI helpers (optional)', ['Go to Settings → AI helper. Choose a provider, paste your own API key, and press “Save & test”.', 'Ask a parent to create the key and set a spending limit. The key stays in your browser.', 'With AI on you get tutor chat, Question Forge, Snap & Check (photo of your working), composition and oral coaches, and coach’s notes.']],
  ['💾 Keeping your progress', ['Everything is saved in this browser only. Use Settings → Download backup now and then. Use Restore backup to move to another device.']],
  ['❓ Something not working?', ['Try reloading the page. If you installed the app and it looks old, close it fully and open it again (it updates itself).', 'Private/incognito windows may not save progress.']],
];

export default function help(root) {
  root.append(h('h1', '📘 Quick guide'),
    ...SECTIONS.map(([t, items]) => h('details', { class: 'card', open: t.startsWith('🚀') }, h('summary', { style: { fontSize: '1.1rem' } }, t), h('ul', items.map((i) => h('li', i))))),
    h('p', { class: 'muted small' }, 'The full user manual and deployment guide are in the project’s docs folder on GitHub.'));
}
