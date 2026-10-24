import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, parseLinear, checkAnswer, fracStr } from '../public/js/lib/answer.js';

test('parseNumber handles common student formats', () => {
  assert.equal(parseNumber('45 km/h').value, 45);
  assert.equal(parseNumber('$12.50').value, 12.5);
  assert.equal(parseNumber('1,200').value, 1200);
  assert.equal(parseNumber('35%').value, 35);
  assert.equal(parseNumber('3/4').value, 0.75);
  assert.equal(parseNumber('1 3/4').value, 1.75);
  assert.equal(parseNumber('-2.5').value, -2.5);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber('12 5'), null);
  assert.equal(parseNumber(''), null);
});

test('checkAnswer: numbers, money, fractions', () => {
  assert.equal(checkAnswer('18', 18), 'correct');
  assert.equal(checkAnswer('18.0', 18), 'correct');
  assert.equal(checkAnswer('17', 18), 'wrong');
  assert.equal(checkAnswer('153.86 cm2', 153.86), 'correct');
  assert.equal(checkAnswer('hello', 5), 'invalid');
  assert.equal(checkAnswer('1/2', { frac: [1, 2] }), 'correct');
  assert.equal(checkAnswer('2/4', { frac: [1, 2] }), 'unsimplified');
  assert.equal(checkAnswer('1 1/2', { frac: [3, 2] }), 'correct');
  assert.equal(checkAnswer('3/2', { frac: [3, 2] }), 'correct');
  assert.equal(checkAnswer('0.5', { frac: [1, 2] }), 'correct');
  assert.equal(checkAnswer('1/3', { frac: [1, 2] }), 'wrong');
});

test('algebra expressions', () => {
  assert.deepEqual(parseLinear('5a + 4'), { coef: 5, const: 4, letter: 'a' });
  assert.deepEqual(parseLinear('4 + 5a'), { coef: 5, const: 4, letter: 'a' });
  assert.deepEqual(parseLinear('a - 2'), { coef: 1, const: -2, letter: 'a' });
  assert.equal(parseLinear('3a + 2b'), null);
  assert.equal(checkAnswer('4+5a', { linear: { coef: 5, const: 4 } }), 'correct');
  assert.equal(checkAnswer('5a-4', { linear: { coef: 5, const: 4 } }), 'wrong');
});

test('fracStr', () => {
  assert.equal(fracStr(6, 8), '3/4');
  assert.equal(fracStr(7, 4), '1 3/4');
  assert.equal(fracStr(8, 4), '2');
});
