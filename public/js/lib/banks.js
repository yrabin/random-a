// Turns the static content banks into quiz questions (all in the shape quiz.js expects).
import { VOCAB, GRAMMAR, SINGLISH, SYNTHESIS, IDIOMS as EN_IDIOMS, CLOZE, EDITING } from '../data/english.js';
import { MCQ as SCI_MCQ, OPEN as SCI_OPEN } from '../data/science.js';
import { IDIOMS as ZH_IDIOMS, VOCAB as ZH_VOCAB } from '../data/chinese.js';
import { makeRng } from './rng.js';

const mc = (id, subject, topic, topicName, q, a, w, explanation) => ({ id, type: 'mcq', subject, topic, topicName, q, options: [a, ...w], answerIndex: 0, explanation });

export function vocabQuestions(rng, n) {
  const picks = rng.sample(VOCAB, n);
  return picks.map(([word, meaning, example]) => {
    const wrong = rng.sample(VOCAB.filter((v) => v[0] !== word), 3).map((v) => v[1]);
    const q = mc(`vocab:${word}`, 'english', 'vocab', 'Vocabulary', `What does "${word}" mean?`, meaning, wrong, `Example: ${example}`);
    return q;
  });
}

export function vocabUseQuestions(rng, n) {
  // "Which word fits the sentence?" built from the example sentence by blanking the word.
  const picks = rng.sample(VOCAB.filter((v) => new RegExp(`\\b${v[0]}`, 'i').test(v[2])), n);
  return picks.map(([word, meaning, example]) => {
    const wrong = rng.sample(VOCAB.filter((v) => v[0] !== word), 3).map((v) => v[0]);
    const sentence = example.replace(new RegExp(`\\b${word}\\w*`, 'i'), '______');
    return mc(`vocabuse:${word}`, 'english', 'vocab', 'Vocabulary', `Choose the best word: ${sentence}`, word, wrong, `"${word}" means ${meaning}.`);
  });
}

export function grammarQuestions(rng, n, topic = null) {
  const pool = topic ? GRAMMAR.filter((g) => g.t === topic) : GRAMMAR;
  return rng.sample(pool, Math.min(n, pool.length)).map((g, i) => mc(`gram:${g.q}`, 'english', 'grammar', 'Grammar: ' + g.t, g.q, g.a, g.w, g.e));
}

export const grammarTopics = () => [...new Set(GRAMMAR.map((g) => g.t))];

export function singlishQuestions(rng, n) {
  return rng.sample(SINGLISH, Math.min(n, SINGLISH.length)).map((g) => mc(`sing:${g.a}`, 'english', 'singlish', 'Spot the Singlish', g.q, g.a, g.w, g.e));
}

export function synthesisQuestions(rng, n) {
  return rng.sample(SYNTHESIS, Math.min(n, SYNTHESIS.length)).map((s) => ({
    id: `syn:${s.q}`, type: 'open', subject: 'english', topic: 'synthesis', topicName: 'Synthesis & Transformation',
    q: s.q, modelAnswer: s.a, keywords: [], explanation: 'Other correct answers are possible – check meaning, grammar and punctuation.',
  }));
}

/** One grammar-cloze passage becomes a run of questions that all show the same passage with numbered blanks. */
export function clozeQuestions(rng, index = null) {
  const c = index == null ? rng.pick(CLOZE) : CLOZE[index % CLOZE.length];
  const passage = `${c.title}\n\n` + c.text.replace(/\((\d+)\)/g, '($1) ______');
  return c.blanks.map((b, i) => ({ ...mc(`cloze:${c.title}:${i + 1}`, 'english', 'cloze', 'Grammar Cloze', `Blank (${i + 1}): choose the best word.`, b.a, b.w, b.e), passage }));
}

export function editingQuestions(rng, n) {
  return rng.sample(EDITING, Math.min(n, EDITING.length)).map((x) => mc(`edit:${x.a}`, 'english', 'editing', 'Editing', 'Which sentence has a mistake?', x.a, x.w, x.e));
}

export function idiomQuestions(rng, n) {
  return rng.sample(EN_IDIOMS, n).map(([phrase, meaning, ex]) => {
    const wrong = rng.sample(EN_IDIOMS.filter((i) => i[0] !== phrase), 3).map((i) => i[1]);
    return mc(`idiom:${phrase}`, 'english', 'idioms', 'Idioms', `What does the idiom "${phrase}" mean?`, meaning, wrong, `Example: ${ex}`);
  });
}

export function scienceQuestions(rng, n, theme = null) {
  const pool = theme ? SCI_MCQ.filter((s) => s.th === theme) : SCI_MCQ;
  return rng.sample(pool, Math.min(n, pool.length)).map((s) => mc(`sci:${s.q}`, 'science', s.th, `${s.th}: ${s.t}`, s.q, s.a, s.w, s.e));
}

export function scienceOpen(rng, n) {
  return rng.sample(SCI_OPEN, Math.min(n, SCI_OPEN.length)).map((o) => ({
    id: `scio:${o.q}`, type: 'open', subject: 'science', topic: o.th, topicName: `${o.th}: open-ended`, q: o.q, modelAnswer: o.model, keywords: o.keywords,
    explanation: 'Tip: use Claim → Evidence → Reasoning.',
  }));
}

export function chineseIdiomQuestions(rng, n) {
  return rng.sample(ZH_IDIOMS, n).map(([zh, py, meaning, ex]) => {
    const wrong = rng.sample(ZH_IDIOMS.filter((i) => i[0] !== zh), 3).map((i) => i[2]);
    return mc(`zhi:${zh}`, 'chinese', 'idioms', '成语 Idioms', `${zh} (${py})\nWhat does this idiom mean?`, meaning, wrong, `例句: ${ex}`);
  });
}

export function chineseVocabQuestions(rng, n) {
  return rng.sample(ZH_VOCAB, n).map(([zh, py, meaning]) => {
    const wrong = rng.sample(ZH_VOCAB.filter((i) => i[0] !== zh), 3).map((i) => i[2]);
    return mc(`zhv:${zh}`, 'chinese', 'vocab', '词语 Vocabulary', `${zh}  (${py})\nWhat does it mean in English?`, meaning, wrong, `${zh} ${py} = ${meaning}`);
  });
}

export const SUBJECT_META = {
  math: { name: 'Maths', emoji: '➗' },
  english: { name: 'English', emoji: '📖' },
  science: { name: 'Science', emoji: '🔬' },
  chinese: { name: 'Chinese', emoji: '🀄' },
};

/** The Daily Challenge: same 6 questions for everyone on a given date (per level). */
export function dailyChallenge(dateKey, level, mathMixedSet) {
  const rng = makeRng(`daily:${dateKey}:${level}`);
  const qs = [
    ...mathMixedSet({ seed: `d:${dateKey}:${level}`, count: 3, level }),
    ...grammarQuestions(rng, 1),
    ...scienceQuestions(rng, 1),
    ...vocabQuestions(rng, 1),
  ];
  return qs.map((q, i) => ({ ...q, id: `${q.id}#daily${i}` }));
}
