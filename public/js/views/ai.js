import { h, clear, md, spinner, toast } from '../ui.js';
import { store, askAI, aiReady, AIError } from '../state.js';
import { PROVIDERS, extractJSON, normalizeQuiz, imageToBase64 } from '../lib/ai.js';
import { TUTOR, FORGE_MCQ, FORGE_OPEN, PASSAGE, SNAP } from '../lib/prompts.js';
import { TOPICS } from '../lib/mathgen.js';
import { startQuiz } from './quiz.js';

export default function ai(root, { parts, query }) {
  const sub = parts[0];
  if (sub && !aiReady()) return locked(root);
  if (sub === 'tutor') return tutor(root, query);
  if (sub === 'forge') return forge(root, query);
  if (sub === 'snap') return snap(root);
  return hub(root);
}

function locked(root) {
  root.append(h('div', { class: 'card' }, h('h1', '🤖 AI is not set up yet'), h('p', 'This feature needs your own AI key. It only takes a minute, and the rest of the app works without it.'), h('a', { class: 'btn accent', href: '#/settings' }, 'Set up AI'), ' ', h('a', { class: 'btn secondary', href: '#/help' }, 'How does it work?')));
}

function hub(root) {
  const ready = aiReady();
  root.append(
    h('h1', '🤖 Ask Ollie (AI)'),
    ready ? null : h('div', { class: 'card warn' }, h('b', 'AI features are optional and use your own key (BYOK). '), 'Add one in ', h('a', { href: '#/settings' }, 'Settings'), ' to unlock the tiles below. Meanwhile, everything else in the app works for free.'),
    h('div', { class: 'grid' },
      tile('💬', 'Tutor chat', 'Ask anything about Maths, English, Science', '#/ai/tutor', ready),
      tile('🏭', 'Question Forge', 'Make new questions on any topic', '#/ai/forge', ready),
      tile('📸', 'Snap & Check', 'Photo of your working → feedback', '#/ai/snap', ready),
      tile('✍️', 'Composition Coach', 'PSLE-style marking & rewrites', '#/english/write', ready),
      tile('🗣️', 'Oral Coach', 'Feedback on spoken answers', '#/english/oral', ready),
      tile('📝', 'Coach’s note', 'Personal plan from your stats', '#/progress', ready)),
    h('div', { class: 'card soft' }, h('b', 'Good to know'), h('ul', [
      'AI can make mistakes. If something looks odd, ask a teacher or parent.',
      'Never type your full name, school, address or phone number.',
      'Your key stays in this browser. Questions are sent straight to the AI company you chose – not through this app’s server.',
      'Ollie is designed to give hints first so you learn, not just copy answers.'].map((t) => h('li', t)))));
}
const tile = (e, t, s, href, ready) => h('a', { class: `tile ai ${ready ? '' : 'locked'}`, href: ready ? href : '#/settings' }, h('span', { class: 'big' }, e), h('b', t), h('small', ready ? s : '🔒 ' + s));

// ---------- Tutor chat ----------
function tutor(root, query) {
  const history = [];
  const log = h('div', { class: 'chat', 'aria-live': 'polite' });
  const input = h('textarea', { placeholder: 'Type your question… (Enter to send, Shift+Enter for a new line)', style: { minHeight: '70px' }, 'aria-label': 'Message' });
  let busy = false;
  const add = (who, text) => { const m = h('div', { class: `msg ${who === 'me' ? 'me' : 'bot'}` }, who === 'me' ? text : md(text)); log.append(m); log.scrollTop = log.scrollHeight; return m; };
  add('bot', 'Hi! I’m Ollie 🦦. Ask me about a Maths problem, a Science idea, an English question… I’ll give you hints first!');
  async function send(text) {
    text = (text || input.value).trim();
    if (!text || busy) return;
    busy = true; input.value = '';
    add('me', text);
    history.push({ role: 'user', content: text });
    const wait = h('div', { class: 'msg bot' }, spinner()); log.append(wait); log.scrollTop = log.scrollHeight;
    try {
      const reply = await askAI({ system: TUTOR, messages: history.slice(-12), maxTokens: 700, temperature: 0.5 });
      wait.remove(); add('bot', reply); history.push({ role: 'assistant', content: reply });
    } catch (e) { wait.remove(); history.pop(); add('bot', e instanceof AIError ? e.message : 'Hmm, something went wrong. Please try again.'); }
    busy = false; input.focus();
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  const chips = ['Explain ratio with a bar model', 'How do I do speed problems?', 'Why does ice melt?', 'Help me write a story opening', 'Quiz me on fractions'];
  root.append(h('div', { class: 'qbar' }, h('a', { class: 'btn ghost sm', href: '#/ai' }, '✕ Back'), h('h2', { style: { margin: 0 } }, '💬 Tutor chat')),
    h('div', { class: 'card' }, log),
    h('div', { class: 'pills', style: { marginBottom: '8px' } }, chips.map((c) => h('button', { class: 'pill', onclick: () => send(c) }, c))),
    input, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => send() }, 'Send ➤'), h('button', { class: 'btn ghost', onclick: () => { history.length = 0; clear(log); add('bot', 'Fresh start! What shall we work on?'); } }, 'Clear chat')));
  if (query.q) send(query.q);
  input.focus();
}

// ---------- Question Forge ----------
function forge(root, query) {
  let mode = query.mode || 'mcq';
  let subject = query.subject || 'math';
  let level = store.profile.level || 5;
  let count = 5;
  const topic = h('input', { type: 'text', placeholder: 'e.g. fractions of a remainder / the water cycle / prepositions', maxlength: 120, 'aria-label': 'Topic' });
  const out = h('div');
  const host = h('div');
  root.append(h('div', { class: 'qbar' }, h('a', { class: 'btn ghost sm', href: '#/ai' }, '✕ Back'), h('h1', { style: { margin: 0 } }, '🏭 Question Forge')), host, out);

  function draw() {
    clear(host);
    host.append(h('div', { class: 'card' },
      h('p', { class: 'muted' }, 'Tell Ollie what you want to practise. The AI writes new PSLE-style questions, and you play them like any quiz (wrong answers go to your Mistake Notebook).'),
      h('label', 'Type'), h('div', { class: 'pills' }, [['mcq', 'Multiple choice'], ['open', 'Open-ended'], ['passage', 'Comprehension passage']].map(([k, l]) => h('button', { class: 'pill' + (k === mode ? ' on' : ''), onclick: () => { mode = k; if (k === 'passage') subject = 'english'; draw(); } }, l))),
      mode === 'passage' ? null : h('div', h('label', 'Subject'), h('div', { class: 'pills' }, [['math', '➗ Maths'], ['english', '📖 English'], ['science', '🔬 Science']].map(([k, l]) => h('button', { class: 'pill' + (k === subject ? ' on' : ''), onclick: () => { subject = k; draw(); } }, l)))),
      h('label', 'Level'), h('div', { class: 'pills' }, [4, 5, 6].map((l) => h('button', { class: 'pill' + (l === level ? ' on' : ''), onclick: () => { level = l; draw(); } }, `P${l}`))),
      h('label', mode === 'passage' ? 'Passage theme (optional)' : 'Topic'), topic,
      subject === 'math' && mode !== 'passage' ? h('div', { class: 'pills', style: { marginTop: '6px' } }, TOPICS.filter((t) => t.level <= level).slice(0, 14).map((t) => h('button', { class: 'pill', onclick: () => { topic.value = t.name; } }, t.name))) : null,
      mode === 'passage' ? null : h('div', h('label', 'How many?'), h('div', { class: 'pills' }, [3, 5, 8].map((n) => h('button', { class: 'pill' + (n === count ? ' on' : ''), onclick: () => { count = n; draw(); } }, n)))),
      h('div', { class: 'row' }, h('button', { class: 'btn accent', onclick: generate }, '✨ Forge questions'))));
  }

  async function generate() {
    clear(out); out.append(spinner('Ollie is writing your questions…'));
    const sys = mode === 'passage' ? PASSAGE : mode === 'open' ? FORGE_OPEN : FORGE_MCQ;
    const subjName = { math: 'Mathematics', english: 'English Language', science: 'Science' }[subject];
    const user = mode === 'passage'
      ? `Level: Primary ${level}. Theme: ${topic.value.trim() || 'your choice (something fun and relatable)'}.`
      : `Subject: ${subjName}. Level: Primary ${level}. Topic: ${topic.value.trim() || 'mixed PSLE topics'}. Number of questions: ${count}. Standard: PSLE (include a mix of easier and harder).`;
    try {
      const raw = await askAI({ system: sys, json: true, maxTokens: mode === 'passage' ? 2600 : 2200, temperature: 0.7, messages: [{ role: 'user', content: user }] });
      const parsed = extractJSON(raw);
      let qs = normalizeQuiz(mode === 'passage' ? { questions: (parsed.questions || []).map((q) => ({ ...q, options: undefined })) } : parsed, { subject, topic: 'forge' });
      if (mode === 'passage') qs = qs.map((q) => ({ ...q, passage: `${parsed.title ? parsed.title + '\n\n' : ''}${parsed.passage || ''}`, topicName: 'AI Comprehension' }));
      clear(out); clear(root);
      startQuiz(root, { title: 'Question Forge', subject, questions: qs, backHref: '#/ai/forge', again: () => { clear(root); forge(root, { mode, subject }); }, againLabel: 'Forge new questions ✨' });
    } catch (e) {
      clear(out);
      out.append(h('div', { class: 'feedback no' }, e instanceof AIError ? e.message : 'Ollie could not make sense of the AI’s reply. Please try again (smaller number of questions may help).'));
    }
  }
  draw();
}

// ---------- Snap & Check ----------
function snap(root) {
  let image = null;
  const out = h('div');
  const preview = h('div');
  const note = h('textarea', { placeholder: 'Optional: what is the question? (helps Ollie read your handwriting)', style: { minHeight: '70px' }, 'aria-label': 'Note' });
  const file = h('input', { type: 'file', accept: 'image/*', capture: 'environment', 'aria-label': 'Take or choose a photo' });
  const vision = PROVIDERS[store.settings.ai.provider]?.vision;
  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    try { image = await imageToBase64(f); clear(preview); preview.append(h('img', { src: image.preview, alt: 'Your working', style: { maxWidth: '100%', maxHeight: '320px', borderRadius: '12px' } })); } catch { toast('Could not read that image.', 'bad'); }
  });
  const go = async () => {
    if (!image) { toast('Take or choose a photo first.', 'bad'); return; }
    clear(out); out.append(spinner('Ollie is reading your working…'));
    try {
      const text = await askAI({ system: SNAP, maxTokens: 800, messages: [{ role: 'user', content: note.value.trim() || 'Please check my working.', images: [{ mime: image.mime, data: image.data }] }] });
      clear(out); out.append(h('div', { class: 'card soft' }, md(text)));
    } catch (e) { clear(out); out.append(h('div', { class: 'feedback no' }, e instanceof AIError ? e.message : 'Something went wrong.')); }
  };
  root.append(h('div', { class: 'qbar' }, h('a', { class: 'btn ghost sm', href: '#/ai' }, '✕ Back'), h('h1', { style: { margin: 0 } }, '📸 Snap & Check')),
    vision ? null : h('div', { class: 'card warn' }, 'Your selected AI provider may not understand photos. Choose Anthropic, OpenAI or Gemini in Settings for best results.'),
    h('div', { class: 'card' }, h('p', 'Take a clear, well-lit photo of your handwritten working (one question at a time, no faces or personal details in the picture). Ollie will check each step and give a hint for the first mistake.'),
      file, preview, note, h('div', { class: 'row' }, h('button', { class: 'btn accent', onclick: go }, 'Check my working 🔍')),
      h('p', { class: 'muted small' }, 'The photo is shrunk on your device and sent only to the AI service you chose. It is not saved by this app.')),
    out);
}
