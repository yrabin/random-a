// The practice engine used by every subject: numeric answers, multiple choice and open-ended self-marking.
import { h, clear, md, toast, beep, confetti, modal, spinner, shuffle, pct } from '../ui.js';
import { store, askAI, aiReady, AIError } from '../state.js';
import { checkAnswer } from '../lib/answer.js';
import { answerToString } from '../lib/mathgen.js';
import { levelTitle } from '../lib/gamify.js';
import { EXPLAIN, SIMPLER, MARK_OPEN } from '../lib/prompts.js';
import { extractJSON } from '../lib/ai.js';

const CHEER = ['Nice one!', 'Splash-tastic! 🌊', 'You got it!', 'Otter-ly brilliant!', 'Yes! Keep swimming!', 'Correct! 🎉', 'Smart cookie!'];
const OOPS = ['Not quite – let’s learn from it.', 'Close! Check the working below.', 'Mistakes help us grow. 💪', 'No worries, Ollie saved this to your Mistake Notebook.', 'Almost! Look at the steps.'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

/**
 * opts: { title, questions[], subject, backHref, endless?: () => question, count?, onAnswer?(q, ok) -> rewards,
 *         onFinish?(summary), mode?: 'practice'|'review'|'daily', againLabel }
 */
export function startQuiz(root, opts) {
  const state = { i: 0, results: [], rewards: { xp: 0, badges: [], levelUp: null }, startedAt: Date.now(), answered: false };
  const total = opts.questions.length;
  let alive = true;

  const record = opts.onAnswer || ((q, ok) => store.record({ id: q.id, subject: q.subject || opts.subject, topic: q.topic, topicName: q.topicName, snapshot: stripFns(q) }, ok));

  function render() {
    if (!alive) return;
    clear(root);
    if (state.i >= total) return summary();
    const q = opts.questions[state.i];
    state.answered = false;
    const card = h('div', { class: 'card' });
    root.append(
      h('div', { class: 'qbar' },
        h('a', { class: 'btn ghost sm', href: opts.backHref || '#/', 'aria-label': 'Quit' }, '✕'),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': state.i }, h('i', { style: { width: pct(state.i, total) + '%' } })),
        h('span', { class: 'chip', style: { background: 'var(--brand-soft)', color: 'var(--brand)' } }, `${state.i + 1}/${total}`),
        store.profile.totals.combo >= 3 ? h('span', { class: 'chip', style: { background: 'var(--accent-soft)', color: '#a04a00' }, title: 'Correct in a row' }, `🔥 ${store.profile.totals.combo}`) : null),
      card);
    card.append(h('div', { class: 'qmeta' }, `${q.topicName || ''}${q.level ? ' · P' + q.level : ''}`));
    if (q.passage) card.append(h('div', { class: 'passage' }, q.passage));
    card.append(h('p', { class: 'qtext' }, q.q));
    const body = h('div');
    card.append(body);
    const feedback = h('div', { 'aria-live': 'polite' });
    card.append(feedback);
    const type = q.type || 'num';
    if (type === 'mcq') renderMcq(q, body, feedback);
    else if (type === 'open') renderOpen(q, body, feedback);
    else renderNum(q, body, feedback);
    root.focus?.();
  }

  function finishAnswer(q, ok, feedback, { explanation, extra, userAnswer } = {}) {
    state.answered = true;
    const rw = record(q, ok) || {};
    state.results.push({ q, ok });
    state.rewards.xp += rw.gain || 0;
    if (rw.badges?.length) state.rewards.badges.push(...rw.badges);
    if (rw.levelUp) state.rewards.levelUp = rw.levelUp;
    beep(ok ? 'ok' : 'bad');
    clear(feedback);
    const box = h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
      h('div', ok ? `${rnd(CHEER)}${rw.gain ? `  +${rw.gain} XP` : ''}` : rnd(OOPS)));
    feedback.append(box);
    if (extra) box.append(extra);
    if (explanation?.length) {
      box.append(h('div', { class: 'small', style: { marginTop: '6px' } }, 'How to solve it:'),
        h('ol', { class: 'steps' }, explanation.map((s) => h('li', s))));
    }
    if (rw.badges?.length) rw.badges.forEach((b) => toast(`${b.emoji} Badge unlocked: ${b.name}!`, 'good', 4500));
    if (rw.levelUp) { beep('level'); confetti(); toast(`🎊 Level ${rw.levelUp}: ${levelTitle(rw.levelUp)}!`, 'good', 5000); }
    const actions = h('div', { class: 'row' });
    if (aiReady()) actions.append(h('button', { class: 'btn accent sm', onclick: () => aiExplain(q, userAnswer, ok, feedback) }, '🤖 Explain with AI'));
    const next = h('button', { class: 'btn', id: 'nextBtn', onclick: () => { state.i++; render(); window.scrollTo({ top: 0 }); } }, state.i + 1 >= total ? 'Finish 🏁' : 'Next →');
    actions.append(next);
    feedback.append(actions);
    next.focus();
  }

  function renderNum(q, body, feedback) {
    const input = h('input', { type: 'text', class: 'num-input', inputmode: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Your answer', placeholder: q.answer?.linear ? 'e.g. 5a + 3' : q.answer?.frac ? 'e.g. 3/4' : 'Your answer' });
    const unit = q.unit && q.unit !== '$' ? h('span', { class: 'muted' }, q.unit) : null;
    const dollar = q.unit === '$' ? h('b', '$') : null;
    const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '1.2em' } });
    let hintShown = false;
    const hintBtn = h('button', { class: 'btn secondary sm', onclick: () => { if (!hintShown) { hintShown = true; body.append(h('div', { class: 'hintbox' }, '💡 ' + q.hint)); } } }, '💡 Hint');
    const checkBtn = h('button', { class: 'btn', onclick: () => check() }, 'Check ✔');
    const check = () => {
      if (state.answered) return;
      const res = checkAnswer(input.value.replace(/^\$/, ''), q.answer);
      if (res === 'invalid') { msg.textContent = q.answer?.linear ? 'Type an expression such as 5a + 3.' : 'Please type a number (like 12, 3.5 or 3/4).'; input.focus(); return; }
      msg.textContent = '';
      input.disabled = true; checkBtn.disabled = true; hintBtn.disabled = true;
      const ok = res === 'correct' || res === 'unsimplified';
      finishAnswer(q, ok, feedback, {
        explanation: q.steps, userAnswer: input.value,
        extra: h('div', { class: 'small', style: { marginTop: '4px' } },
          ok ? (res === 'unsimplified' ? 'Right value! In the exam, write fractions in simplest form. ✏️' : '') : ['Correct answer: ', h('b', answerToString(q))]),
      });
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    body.append(h('div', { class: 'row' }, dollar, input, unit), msg, h('div', { class: 'row' }, checkBtn, hintBtn));
    setTimeout(() => input.focus(), 30);
  }

  function renderMcq(q, body, feedback) {
    const order = q._order || (q._order = shuffle(q.options.map((o, i) => i)));
    const opts_ = h('div', { class: 'opts', role: 'group', 'aria-label': 'Choices' });
    const btns = order.map((origIdx, pos) => {
      const b = h('button', { class: 'opt', onclick: () => pick(origIdx, b) }, h('span', { class: 'k' }, 'ABCD'[pos]), h('span', q.options[origIdx]));
      b.dataset.i = origIdx;
      return b;
    });
    opts_.append(...btns);
    function pick(idx) {
      if (state.answered) return;
      const ok = idx === q.answerIndex;
      btns.forEach((b) => { b.disabled = true; if (+b.dataset.i === q.answerIndex) b.classList.add('right'); else if (+b.dataset.i === idx) b.classList.add('wrong'); });
      finishAnswer(q, ok, feedback, {
        userAnswer: q.options[idx],
        extra: q.explanation ? h('div', { class: 'small', style: { marginTop: '6px' } }, '💡 ', q.explanation) : null,
      });
    }
    const keyHandler = (e) => {
      if (!document.body.contains(opts_)) { document.removeEventListener('keydown', keyHandler); return; }
      if (state.answered || e.target.matches('input,textarea')) return;
      const k = e.key.toUpperCase();
      const pos = 'ABCD'.indexOf(k) >= 0 ? 'ABCD'.indexOf(k) : '1234'.indexOf(k);
      if (pos >= 0 && pos < order.length) pick(order[pos]);
    };
    document.addEventListener('keydown', keyHandler);
    body.append(opts_);
    if (q.hint) body.append(h('p', { class: 'muted small' }, `💡 ${q.hint}`));
  }

  function renderOpen(q, body, feedback) {
    const ta = h('textarea', { 'aria-label': 'Your answer', placeholder: 'Type your answer in full sentences…', style: { minHeight: '110px' } });
    const reveal = h('button', { class: 'btn', onclick: show }, 'Show model answer');
    body.append(ta, h('div', { class: 'row' }, reveal));
    function show() {
      reveal.disabled = true; ta.disabled = true;
      const mine = ta.value.toLowerCase();
      const found = (q.keywords || []).filter((k) => mine.includes(k.toLowerCase()));
      const missing = (q.keywords || []).filter((k) => !found.includes(k));
      const panel = h('div', { class: 'card soft' },
        h('b', 'Model answer'), h('p', q.modelAnswer || q.model),
        q.keywords?.length ? h('p', { class: 'small' }, 'Key words: ', ...q.keywords.map((k) => h('span', { class: 'tag', style: { marginRight: '4px', opacity: found.includes(k) ? 1 : .6 } }, (found.includes(k) ? '✓ ' : '') + k))) : null,
        missing.length && ta.value ? h('p', { class: 'small muted' }, `Words not found in your answer: ${missing.join(', ')}`) : null,
        q.explanation ? h('p', { class: 'small' }, q.explanation) : null,
        h('p', { class: 'small' }, 'Be honest – does your answer say the same thing?'));
      const aiOut = h('div');
      const row = h('div', { class: 'row' },
        h('button', { class: 'btn good', onclick: () => end(true) }, '✅ I got it'),
        h('button', { class: 'btn danger', onclick: () => end(false) }, '❌ Not yet'),
        aiReady() && ta.value.trim() ? h('button', { class: 'btn accent sm', onclick: aiMark }, '🤖 Mark with AI') : null);
      panel.append(row, aiOut);
      feedback.append(panel);
      async function aiMark() {
        clear(aiOut); aiOut.append(spinner());
        try {
          const txt = await askAI({ system: MARK_OPEN, json: true, messages: [{ role: 'user', content: `Question: ${q.q}\nModel answer: ${q.modelAnswer}\nKeywords: ${(q.keywords || []).join(', ')}\nStudent answer: <<<${ta.value.slice(0, 1500)}>>>` }], maxTokens: 400 });
          const j = extractJSON(txt);
          clear(aiOut);
          aiOut.append(h('div', { class: `feedback ${j.verdict === 'correct' ? 'ok' : j.verdict === 'partly' ? 'meh' : 'no'}` }, `🤖 ${j.verdict}: ${j.feedback}`));
        } catch (e) { clear(aiOut); aiOut.append(h('div', { class: 'feedback no' }, e instanceof AIError ? e.message : 'The AI reply could not be read. Please judge yourself this time.')); }
      }
      function end(ok) {
        row.remove();
        feedback.querySelector('.card.soft')?.remove();
        finishAnswer(q, ok, feedback, { userAnswer: ta.value, extra: h('div', { class: 'small' }, 'Model answer: ' + (q.modelAnswer || q.model)) });
      }
    }
  }

  async function aiExplain(q, userAnswer, ok, feedback) {
    const slot = h('div', { class: 'card soft' }, spinner());
    feedback.append(slot);
    const correct = q.type === 'mcq' ? q.options[q.answerIndex] : q.type === 'open' ? q.modelAnswer : answerToString(q);
    const msgs = [{ role: 'user', content: `Subject: ${q.subject || opts.subject}. Topic: ${q.topicName || ''}.\nQuestion: ${q.q}\n${q.passage ? 'Passage: ' + q.passage + '\n' : ''}Student's answer: ${userAnswer || '(none)'} (${ok ? 'correct' : 'wrong'}).\nCorrect answer: ${correct}\n${q.steps ? 'Model working: ' + q.steps.join(' | ') : ''}` }];
    try {
      const text = await askAI({ system: EXPLAIN, messages: msgs, maxTokens: 700 });
      clear(slot); slot.append(md(text));
      const simpler = h('button', { class: 'btn secondary sm', onclick: async () => {
        simpler.disabled = true; slot.append(spinner());
        try {
          const t2 = await askAI({ system: SIMPLER, messages: [...msgs, { role: 'assistant', content: text }, { role: 'user', content: 'Please explain it more simply.' }], maxTokens: 500 });
          slot.querySelector('.thinking')?.remove(); slot.append(h('hr'), md(t2));
        } catch (e) { slot.querySelector('.thinking')?.remove(); slot.append(h('p', e.message)); }
      } }, '🙈 Simpler please');
      slot.append(simpler);
    } catch (e) { clear(slot); slot.append(h('p', e instanceof AIError ? e.message : 'Something went wrong with the AI.')); }
  }

  function summary() {
    const right = state.results.filter((r) => r.ok).length;
    const mins = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
    const acc = pct(right, state.results.length);
    if (acc >= 80) { confetti(); beep('level'); }
    const wrong = state.results.filter((r) => !r.ok);
    const emoji = acc >= 90 ? '🏆' : acc >= 70 ? '🌟' : acc >= 50 ? '👍' : '💪';
    const msg = acc >= 90 ? 'Outstanding! You are on fire!' : acc >= 70 ? 'Great job – nearly there!' : acc >= 50 ? 'Good effort! Review the mistakes and try again.' : 'Every expert was once a beginner. Review and retry!';
    root.append(h('div', { class: 'card center' },
      h('div', { style: { fontSize: '3rem' } }, emoji),
      h('h1', opts.title || 'Done!'),
      h('div', { class: 'big-score' }, `${right}/${state.results.length}`),
      h('p', { class: 'muted' }, `${acc}% correct · about ${mins} min · +${state.rewards.xp} XP`),
      h('p', { class: 'bubble', style: { display: 'inline-block' } }, msg),
      state.rewards.badges.length ? h('p', state.rewards.badges.map((b) => `${b.emoji} ${b.name}  `)) : null,
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        opts.again ? h('button', { class: 'btn', onclick: () => opts.again() }, opts.againLabel || 'Practise again 🔁') : null,
        wrong.length && opts.mode !== 'review' ? h('a', { class: 'btn secondary', href: '#/mistakes' }, `📒 Review ${wrong.length} mistake${wrong.length > 1 ? 's' : ''}`) : null,
        h('a', { class: 'btn secondary', href: opts.backHref || '#/' }, 'Back'))));
    if (wrong.length) {
      root.append(h('details', { class: 'card' }, h('summary', `See the ${wrong.length} question${wrong.length > 1 ? 's' : ''} I missed`),
        wrong.map(({ q }) => h('div', { style: { marginTop: '10px' } }, h('b', q.q), h('div', { class: 'small' }, 'Answer: ', q.type === 'mcq' ? q.options[q.answerIndex] : q.type === 'open' ? (q.modelAnswer || q.model) : answerToString(q))))));
    }
    opts.onFinish?.({ right, total: state.results.length, acc });
  }

  render();
  return () => { alive = false; };
}

function stripFns(q) {
  const copy = JSON.parse(JSON.stringify(q, (k, v) => (typeof v === 'function' || k === '_order' ? undefined : v)));
  return copy;
}
