import { h, clear } from '../ui.js';
import { makeRng } from '../lib/rng.js';
import { chineseIdiomQuestions, chineseVocabQuestions } from '../lib/banks.js';
import { IDIOMS } from '../data/chinese.js';
import { startQuiz } from './quiz.js';

export default function chinese(root, { parts }) {
  const sub = parts[0];
  const run = (title, build) => {
    let stop;
    const go = () => { clear(root); stop = startQuiz(root, { title, subject: 'chinese', questions: build(), backHref: '#/chinese', again: go }); };
    go();
    return () => stop?.();
  };
  if (sub === 'idioms') return run('成语 quiz', () => chineseIdiomQuestions(makeRng(Math.random() * 1e9), 8));
  if (sub === 'vocab') return run('词语 quiz', () => chineseVocabQuestions(makeRng(Math.random() * 1e9), 10));
  if (sub === 'list') return list(root);
  root.append(
    h('h1', '🀄 Chinese corner'),
    h('p', { class: 'muted' }, 'A light revision aid for 成语 (idioms) and 词语 (vocabulary), with pinyin. It complements – not replaces – your school’s Chinese lessons. For Malay and Tamil, ask Ollie AI to help you revise.'),
    h('div', { class: 'grid' },
      h('a', { class: 'tile', href: '#/chinese/idioms' }, h('span', { class: 'big' }, '🐉'), h('b', '成语 quiz'), h('small', 'Match idioms to meanings')),
      h('a', { class: 'tile', href: '#/chinese/vocab' }, h('span', { class: 'big' }, '📝'), h('b', '词语 quiz'), h('small', 'Words, pinyin, meanings')),
      h('a', { class: 'tile', href: '#/chinese/list' }, h('span', { class: 'big' }, '📚'), h('b', '成语 reading list'), h('small', 'With example sentences'))));
}

function list(root) {
  root.append(h('div', { class: 'qbar' }, h('a', { class: 'btn ghost sm', href: '#/chinese' }, '✕ Back')), h('h1', '成语 reading list'),
    ...IDIOMS.map(([zh, py, en, ex]) => h('div', { class: 'card' }, h('div', { class: 'bigtext' }, h('b', zh), ' ', h('span', { class: 'muted' }, py)), h('div', en), h('div', { class: 'muted' }, ex))));
}
