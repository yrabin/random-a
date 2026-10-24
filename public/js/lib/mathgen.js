// Procedural PSLE-style Mathematics question generators (P4 - P6).
// Every generator returns { q, answer, unit?, steps[], hint, dp? } where `answer` is a number,
// {frac:[n,d]} or {linear:{coef,const}}. Everything is computed - nothing is hard-coded - so
// the worked solutions are always consistent with the answer.
import { makeRng } from './rng.js';
import { gcd, lcm, fracStr } from './answer.js';

class Person {
  constructor(name, female) {
    this.name = name;
    this.s = female ? 'she' : 'he';
    this.p = female ? 'her' : 'his';
    this.o = female ? 'her' : 'him';
  }
  toString() { return this.name; }
}
const NAMES = [['Wei Jie', 0], ['Aisha', 1], ['Priya', 1], ['Ethan', 0], ['Mei Ling', 1], ['Hafiz', 0], ['Jia Hui', 1], ['Arjun', 0], ['Siti', 1], ['Marcus', 0], ['Xin Yi', 1], ['Daniel', 0], ['Nurul', 1], ['Kavya', 1], ['Zhi Hao', 0], ['Alicia', 1]].map(([n, f]) => new Person(n, f));
const MR = ['Mr Tan', 'Mr Lim', 'Mr Rahman', 'Mr Singh', 'Mr Ong'];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const sg = (n) => (n < 0 ? `−${-n}` : String(n));
const SNACKS = [['packets of kaya toast', 3], ['bowls of chicken rice', 4], ['cups of ice kachang', 3], ['pieces of curry puff', 2], ['cartons of soya milk', 2]];
const pickTwo = (r) => {
  const a = r.pick(NAMES);
  let b = r.pick(NAMES);
  while (b === a) b = r.pick(NAMES);
  return [a, b];
};
const $ = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString('en-US') : String(Math.round(n * 1e4) / 1e4));
const f = (n, d) => fracStr(n, d);
const roundTo = (x, dp) => Math.round(x * 10 ** dp) / 10 ** dp;
// Bar-model description drawn by the UI after answering: rows of segments sized by `units`.
const seg = (units, text = '', kind = 'a') => ({ units, text, kind });
const bar = (label, segs, total = '') => ({ label, segs, total });

function multistep(r, d) {
  const [a] = pickTwo(r);
  const [item1, p1] = r.pick(SNACKS);
  let [item2, p2] = r.pick(SNACKS);
  if (item2 === item1) { item2 = 'bottles of green tea'; p2 = 2; }
  const n1 = r.int(2, 4 + d * 2), n2 = r.int(2, 3 + d * 2);
  const total = n1 * p1 + n2 * p2;
  const pay = Math.ceil((total + 1) / 10) * 10 + (r.chance() ? 10 : 0);
  return {
    q: `${a} bought ${n1} ${item1} at ${$(p1)} each and ${n2} ${item2} at ${$(p2)} each. ${a.s[0].toUpperCase() + a.s.slice(1)} paid with a ${$(pay)} note. How much change did ${a.s} receive?`,
    answer: pay - total, unit: '$', dp: 0,
    steps: [`${n1} × ${$(p1)} = ${$(n1 * p1)}`, `${n2} × ${$(p2)} = ${$(n2 * p2)}`, `Total = ${$(n1 * p1)} + ${$(n2 * p2)} = ${$(total)}`, `Change = ${$(pay)} − ${$(total)} = ${$(pay - total)}`],
    hint: 'Find the cost of each kind of food first, then add them up.',
  };
}

function lcmHcf(r) {
  const pairs = [[6, 8], [8, 12], [12, 18], [9, 15], [10, 25], [12, 20], [15, 20], [18, 24], [14, 21], [16, 24]];
  const [x, y] = r.pick(pairs);
  if (r.chance()) {
    const L = lcm(x, y);
    return {
      q: `Bus A leaves the interchange every ${x} minutes and Bus B every ${y} minutes. Both leave together at 7.00 a.m. After how many minutes will they next leave together?`,
      answer: L, unit: 'minutes',
      steps: [`Multiples of ${x}: ${[1, 2, 3, 4].map((k) => k * x).join(', ')} …`, `Multiples of ${y}: ${[1, 2, 3, 4].map((k) => k * y).join(', ')} …`, `We want the Lowest Common Multiple (LCM) of ${x} and ${y} = ${L}.`, `They next leave together after ${L} minutes.`],
      hint: 'This is a Lowest Common Multiple question.',
    };
  }
  const G = gcd(x * 3, y * 3);
  const who = r.pick(NAMES);
  const a = x * 3, b = y * 3;
  return {
    q: `${who} has two ribbons, ${a} cm and ${b} cm long. ${who.s[0].toUpperCase() + who.s.slice(1)} cuts them into equal pieces with no ribbon left over. What is the greatest possible length of each piece?`,
    answer: G, unit: 'cm',
    steps: [`Factors of ${a} and ${b} must both divide exactly.`, `Greatest Common Factor (HCF) of ${a} and ${b} = ${G}.`, `The longest piece is ${G} cm.`],
    hint: 'The pieces must divide both lengths exactly – think Highest Common Factor.',
  };
}

function fracAddSub(r) {
  const d1 = r.pick([2, 3, 4, 5, 6]);
  const d2 = d1 * r.pick([2, 3]);
  const L = d2;
  const n1 = r.int(1, d1 - 1), n2 = r.int(1, d2 - 1);
  const a = n1 * (L / d1);
  const add = r.chance();
  if (!add && a < 2) return fracAddSub(r);
  const sub2 = add ? n2 : r.int(1, a - 1);
  const ansN = add ? a + sub2 : a - sub2;
  const who = r.pick(NAMES);
  return {
    q: add
      ? `${who} drank ${f(n1, d1)} L of water in the morning and ${f(sub2, d2)} L in the afternoon. How many litres of water did ${who} drink altogether? (Give your answer in simplest form.)`
      : `A jug has ${f(n1, d1)} L of milk. ${who} pours out ${f(sub2, d2)} L. How much milk is left? (Give your answer in simplest form.)`,
    answer: { frac: [ansN, L] }, unit: 'L',
    steps: [
      `Make the denominators the same: ${n1}/${d1} = ${a}/${L}.`,
      add ? `${a}/${L} + ${sub2}/${L} = ${ansN}/${L}` : `${a}/${L} − ${sub2}/${L} = ${ansN}/${L}`,
      `Simplify: ${f(ansN, L)}`,
    ],
    hint: 'Make the denominators the same before adding or subtracting.',
  };
}

function fracOfQty(r) {
  const den = r.pick([3, 4, 5, 6, 8]);
  const num = r.int(1, den - 1);
  const unitQty = r.int(3, 12);
  const total = den * unitQty;
  const [a] = pickTwo(r);
  const thing = r.pick(['stickers', 'marbles', 'storybooks', 'beads']);
  const mode = r.int(0, 1);
  if (mode === 0) {
    return {
      q: `${a} has ${total} ${thing}. ${num}/${den} of them are red. How many red ${thing} are there?`,
      answer: num * unitQty, unit: thing,
      steps: [`1 unit = ${total} ÷ ${den} = ${unitQty}`, `${plural(num, 'unit')} = ${num} × ${unitQty} = ${num * unitQty}`],
      model: [bar(`${total} ${thing}`, [seg(num, `${num} red`, 'a'), seg(den - num, 'not red', 'b')], String(total))],
      hint: 'Divide by the denominator first, then multiply by the numerator.',
    };
  }
  return {
    q: `${a} gave away ${num}/${den} of ${a.p} ${thing} and had ${total - num * unitQty} left. How many ${thing} did he have at first?`,
    answer: total, unit: thing,
    steps: [`After giving away ${num}/${den}, he kept ${den - num}/${den}.`, `${plural(den - num, 'unit')} = ${total - num * unitQty}`, `1 unit = ${total - num * unitQty} ÷ ${den - num} = ${unitQty}`, `${den} units (the whole) = ${den} × ${unitQty} = ${total}`],
    model: [bar('At first', [seg(num, 'gave away', 'b'), seg(den - num, `left: ${total - num * unitQty}`, 'a')], '?')],
    hint: 'Draw a bar model with the right number of equal units.',
  };
}

function decimalOps(r) {
  const mode = r.int(0, 2);
  const a = r.int(11, 99) / 10 + r.int(1, 9) / 100;
  const b = r.int(11, 99) / 10 + r.int(1, 9) / 100;
  if (mode === 0) {
    const ans = roundTo(a + b, 2);
    return { q: `Mei Ling's ribbon is ${a.toFixed(2)} m long. Her sister's ribbon is ${b.toFixed(2)} m long. What is the total length of the two ribbons?`, answer: ans, unit: 'm', dp: 2, steps: [`Line up the decimal points.`, `${a.toFixed(2)} + ${b.toFixed(2)} = ${ans.toFixed(2)}`], hint: 'Line up the decimal points.' };
  }
  if (mode === 1) {
    const hi = Math.max(a, b), lo = Math.min(a, b);
    const ans = roundTo(hi - lo, 2);
    return { q: `A watermelon weighs ${hi.toFixed(2)} kg. A pineapple weighs ${lo.toFixed(2)} kg. How much heavier is the watermelon?`, answer: ans, unit: 'kg', dp: 2, steps: [`${hi.toFixed(2)} − ${lo.toFixed(2)} = ${ans.toFixed(2)}`], hint: 'Subtract the smaller weight from the larger one.' };
  }
  const n = r.int(3, 9), price = r.int(12, 49) / 10;
  const ans = roundTo(n * price, 2);
  return { q: `One notebook costs ${$(price)}. How much do ${n} notebooks cost?`, answer: ans, unit: '$', dp: 2, steps: [`${n} × ${$(price)} = ${$(ans)}`], hint: 'Multiply the price of one by the number of notebooks.' };
}

function angles(r) {
  const k = r.int(0, 3);
  if (k === 0) {
    const a = r.int(5, 16) * 5;
    return { q: `Angles on a straight line: one angle is ${a}°. Find the other angle, x.`, answer: 180 - a, unit: '°', steps: ['Angles on a straight line add up to 180°.', `x = 180° − ${a}° = ${180 - a}°`], hint: 'Angles on a straight line add up to 180°.' };
  }
  if (k === 1) {
    const a = r.int(4, 10) * 10, b = r.int(3, 9) * 10, c = 360 - a - b;
    return { q: `Three angles meet at a point and measure ${a}°, ${b}° and x. Find x.`, answer: c, unit: '°', steps: ['Angles at a point add up to 360°.', `x = 360° − ${a}° − ${b}° = ${c}°`], hint: 'Angles at a point add up to 360°.' };
  }
  if (k === 2) {
    const a = r.int(3, 8) * 10, b = r.int(4, 9) * 10;
    return { q: `In a triangle, two angles are ${a}° and ${b}°. Find the third angle.`, answer: 180 - a - b, unit: '°', steps: ['Angles in a triangle add up to 180°.', `Third angle = 180° − ${a}° − ${b}° = ${180 - a - b}°`], hint: 'Angles in a triangle add up to 180°.' };
  }
  const apex = r.int(2, 8) * 10;
  return { q: `Triangle ABC is isosceles with AB = AC. Angle BAC = ${apex}°. Find angle ABC.`, answer: (180 - apex) / 2, unit: '°', steps: ['Angles in a triangle add up to 180°.', `Angle ABC + angle ACB = 180° − ${apex}° = ${180 - apex}°`, 'The base angles of an isosceles triangle are equal.', `Angle ABC = ${180 - apex}° ÷ 2 = ${(180 - apex) / 2}°`], hint: 'Base angles of an isosceles triangle are equal.' };
}

function areaPerim(r) {
  const k = r.int(0, 2);
  if (k === 0) {
    const W = r.int(8, 20), H = r.int(6, 14), w = r.int(2, 5), h = r.int(2, 4);
    return { q: `A rectangle measures ${W} cm by ${H} cm. A smaller rectangle ${w} cm by ${h} cm is cut out of one corner (an L-shape remains). Find the area of the L-shape.`, answer: W * H - w * h, unit: 'cm²', steps: [`Big rectangle: ${W} × ${H} = ${W * H} cm²`, `Cut-out: ${w} × ${h} = ${w * h} cm²`, `L-shape = ${W * H} − ${w * h} = ${W * H - w * h} cm²`], hint: 'Whole shape minus the part that is cut out.' };
  }
  if (k === 1) {
    const s = r.int(4, 15);
    return { q: `A square has an area of ${s * s} cm². What is its perimeter?`, answer: 4 * s, unit: 'cm', steps: [`Side × side = ${s * s}, so side = ${s} cm.`, `Perimeter = 4 × ${s} = ${4 * s} cm`], hint: 'Find the side length first.' };
  }
  const W = r.int(10, 30), P = 2 * (W + r.int(5, 20));
  const L = P / 2 - W;
  return { q: `The perimeter of a rectangular garden is ${P} m. Its length is ${W} m. Find its area.`, answer: W * L, unit: 'm²', steps: [`Length + breadth = ${P} ÷ 2 = ${P / 2} m`, `Breadth = ${P / 2} − ${W} = ${L} m`, `Area = ${W} × ${L} = ${W * L} m²`], hint: 'Half of the perimeter is length + breadth.' };
}

function timeDur(r) {
  const sh = r.int(7, 11), sm = r.pick([0, 5, 10, 15, 20, 30, 40, 45, 50]);
  const dur = r.int(65, 260);
  const total = sh * 60 + sm + dur;
  const eh = Math.floor(total / 60), em = total % 60;
  const t12 = (h, m) => `${((h + 11) % 12) + 1}.${String(m).padStart(2, '0')} ${h >= 12 ? 'p.m.' : 'a.m.'}`;
  return {
    q: `A movie started at ${t12(sh, sm)} and ended at ${t12(eh, em)} How many minutes long was the movie?`,
    answer: dur, unit: 'minutes',
    steps: [`From ${t12(sh, sm)} to the next hour, then count on.`, `${Math.floor(dur / 60)} h ${dur % 60} min = ${Math.floor(dur / 60)} × 60 + ${dur % 60} = ${dur} minutes`],
    hint: 'Count the hours first, then the extra minutes.',
  };
}

function pattern(r) {
  const a = r.int(2, 9), step = r.int(2, 7), n = r.int(15, 40);
  const seq = [0, 1, 2, 3].map((i) => a + i * step);
  return {
    q: `Look at the number pattern: ${seq.join(', ')}, … What is the ${n}th number in the pattern?`,
    answer: a + (n - 1) * step,
    steps: [`The pattern goes up by ${step} each time.`, `The ${n}th number = first number + ${n - 1} steps`, `= ${a} + ${n - 1} × ${step} = ${a + (n - 1) * step}`],
    hint: 'How many "jumps" are there from the 1st number to the nth number?',
  };
}

function factorsMultiples(r) {
  const k = r.int(0, 1);
  if (k === 0) {
    const n = r.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 48]);
    const fs = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) fs.push(i);
    return { q: `How many factors does ${n} have?`, answer: fs.length, steps: [`Factors of ${n}: ${fs.join(', ')}`, `Count = ${fs.length}`], hint: 'List them in pairs: 1 × ?, 2 × ?, …' };
  }
  const m = r.int(3, 9), lo = r.int(10, 40), hi = lo + r.int(40, 100);
  let c = 0;
  for (let i = lo; i <= hi; i++) if (i % m === 0) c++;
  return { q: `How many multiples of ${m} are there from ${lo} to ${hi} (including both ${lo} and ${hi} if they are multiples)?`, answer: c, steps: [`First multiple ≥ ${lo}: ${Math.ceil(lo / m) * m}`, `Last multiple ≤ ${hi}: ${Math.floor(hi / m) * m}`, `Count = (${Math.floor(hi / m) * m} − ${Math.ceil(lo / m) * m}) ÷ ${m} + 1 = ${c}`], hint: 'Find the first and last multiples in the range.' };
}

function fracRemaining(r) {
  const [a] = pickTwo(r);
  const d1 = r.pick([3, 4, 5]);
  const d2 = r.pick([2, 3, 4]);
  const M = d1 * d2 * r.int(1, 6) * 5;
  const rem = ((d1 - 1) * M) / d1;
  const left = rem - rem / d2;
  return {
    q: `${a} spent 1/${d1} of ${a.p} money on a book. ${a.s[0].toUpperCase() + a.s.slice(1)} then spent 1/${d2} of the remainder on lunch. ${a.s[0].toUpperCase() + a.s.slice(1)} had ${$(left)} left. How much money did ${a.s} have at first?`,
    answer: M, unit: '$', dp: 0,
    steps: [
      `After the book, ${d1 - 1}/${d1} of the money remained. Call this the "remainder".`,
      `After lunch, ${d2 - 1}/${d2} of the remainder was left = ${$(left)}.`,
      `Remainder = ${$(left)} ÷ ${d2 - 1} × ${d2} = ${$(rem)}`,
      `Money at first = ${$(rem)} ÷ ${d1 - 1} × ${d1} = ${$(M)}`,
    ],
    model: [
      bar('Money', [seg(1, 'book', 'b'), seg(d1 - 1, 'remainder', 'a')], '?'),
      bar('Remainder', [seg(1, 'lunch', 'b'), seg(d2 - 1, `left ${$(left)}`, 'a')]),
    ],
    hint: 'Work backwards: the "remainder" is the new whole for the second fraction.',
  };
}

function fracMulDiv(r) {
  const k = r.int(0, 2);
  if (k === 0) {
    const dn = r.pick([2, 3, 4, 5]);
    const nn = r.int(1, dn - 1);
    const pieces = r.int(3, 9);
    const nice = fracStr(nn * pieces, dn);
    return { q: `A rope is ${nice} m long. It is cut into pieces of ${nn}/${dn} m each. How many pieces are there?`, answer: pieces, steps: [`Number of pieces = ${nice} ÷ ${nn}/${dn}`, `= ${nn * pieces}/${dn} × ${dn}/${nn} = ${pieces}`], hint: 'Dividing by a fraction is the same as multiplying by its reciprocal.' };
  }
  if (k === 1) {
    const n1 = r.int(1, 4), d1 = r.pick([5, 6, 7, 8]), n2 = r.int(1, 3), d2 = r.pick([3, 4, 5]);
    const N = n1 * n2, D = d1 * d2;
    const who = r.pick(NAMES);
    return { q: `${who} used ${n2}/${d2} of a ${n1}/${d1} kg bag of flour to bake cookies. What fraction of a kilogram of flour did ${who.s} use? (Simplest form)`, answer: { frac: [N, D] }, unit: 'kg', steps: [`${n2}/${d2} × ${n1}/${d1} = (${n2} × ${n1}) / (${d2} × ${d1}) = ${N}/${D}`, `Simplest form: ${f(N, D)}`], hint: '"Of" means multiply.' };
  }
  const w = r.int(2, 9), dn = r.pick([3, 4, 5, 6]);
  return { q: `${w} litres of juice is poured equally into ${dn} bottles. What fraction of a litre is in each bottle? (Simplest form; a mixed number is fine.)`, answer: { frac: [w, dn] }, unit: 'L', steps: [`${w} ÷ ${dn} = ${w}/${dn}`, `Simplest form: ${f(w, dn)}`], hint: 'A fraction is a division: numerator ÷ denominator.' };
}

function percentOf(r) {
  const k = r.int(0, 2);
  if (k === 0) {
    const pct = r.pick([10, 20, 25, 30, 40, 50, 60, 75]);
    const total = r.pick([40, 60, 80, 120, 200, 240, 400, 600]);
    const [what, sub] = r.pick([['pupils in a school hall', 'boys'], ['visitors at the zoo', 'children'], ['stamps in a collection', 'rare stamps'], ['passengers on a train', 'tourists']]);
    return { q: `There were ${total} ${what}. ${pct}% of them were ${sub}. How many ${sub} were there?`, answer: (pct * total) / 100, steps: [`${pct}% of ${total} = ${pct}/100 × ${total}`, `= ${(pct * total) / 100}`], hint: 'Turn the percentage into a fraction out of 100.' };
  }
  if (k === 1) {
    const price = r.pick([40, 60, 80, 120, 150, 200]), pct = r.pick([10, 20, 25, 30, 40, 50]);
    const disc = (price * pct) / 100, fin = price - disc;
    return { q: `A school bag costs ${$(price)}. It is on sale at ${pct}% discount. What is the sale price?`, answer: fin, unit: '$', dp: 2, steps: [`Discount = ${pct}% of ${$(price)} = ${$(disc)}`, `Sale price = ${$(price)} − ${$(disc)} = ${$(fin)}`, `(Shortcut: pay ${100 - pct}% → ${100 - pct}/100 × ${price} = ${fin})`], hint: 'Find the discount first, then subtract it.' };
  }
  const price = r.pick([20, 30, 50, 80, 100, 120, 200, 250]);
  const tot = roundTo(price * 1.09, 2);
  return { q: `A restaurant bill is ${$(price)} before GST. GST is 9%. How much must the family pay in total?`, answer: tot, unit: '$', dp: 2, steps: [`GST = 9% of ${$(price)} = ${$(roundTo(price * 0.09, 2))}`, `Total = ${$(price)} + ${$(roundTo(price * 0.09, 2))} = ${$(tot)}`, `(Shortcut: 109% of ${price} = ${tot.toFixed(2)})`], hint: 'Total = 100% + 9% = 109% of the original price.' };
}

function percentChange(r) {
  const base = r.pick([20, 25, 40, 50, 80, 120, 200]);
  const pct = r.pick([10, 20, 25, 50, 15, 5]);
  const newV = (base * (100 + pct)) / 100;
  if (!Number.isInteger(newV)) return percentChange(r);
  return { q: `The price of a pair of shoes went up from ${$(base)} to ${$(newV)}. What is the percentage increase?`, answer: pct, unit: '%', steps: [`Increase = ${newV} − ${base} = ${newV - base}`, `Percentage increase = increase ÷ original × 100%`, `= ${newV - base} ÷ ${base} × 100% = ${pct}%`], hint: 'Always compare the change with the ORIGINAL amount.' };
}

function ratioShare(r) {
  const [x, y] = r.pick([[2, 3], [3, 5], [4, 5], [3, 7], [2, 5], [5, 7], [1, 4]]);
  const unit = r.int(4, 25) * (r.chance() ? 5 : 1);
  const total = (x + y) * unit;
  const [a, b] = pickTwo(r);
  const ask = r.int(0, 1);
  if (ask === 0) {
    return { q: `${a} and ${b} shared ${$(total)} in the ratio ${x} : ${y}. How much more money did ${b} get than ${a}?`, answer: (y - x) * unit, unit: '$', dp: 0, steps: [`Total units = ${x} + ${y} = ${x + y}`, `1 unit = ${$(total)} ÷ ${x + y} = ${$(unit)}`, `Difference = ${y} − ${x} = ${plural(y - x, 'unit')}`, `${y - x} × ${$(unit)} = ${$((y - x) * unit)}`], model: [bar(a.name, [seg(x, `${x} units`, 'a')]), bar(b.name, [seg(y, `${y} units`, 'b')])].map((r, i) => (i === 0 ? { ...r, total: `${$(total)} altogether` } : r)), hint: 'Draw one bar for each person; find the value of 1 unit.' };
  }
  return { q: `The ratio of ${a}'s stickers to ${b}'s stickers is ${x} : ${y}. ${b} has ${y * unit} stickers. How many stickers do they have altogether?`, answer: total, unit: 'stickers', steps: [`${y} units = ${y * unit}`, `1 unit = ${y * unit} ÷ ${y} = ${unit}`, `Total = ${x + y} units = ${x + y} × ${unit} = ${total}`], model: [bar(a.name, [seg(x, `${x} units`, 'a')]), bar(b.name, [seg(y, `${y} units = ${y * unit}`, 'b')])], hint: 'Find the value of 1 unit first.' };
}

function average(r) {
  const n = r.int(3, 5), avg = r.int(60, 85);
  const k = r.int(0, 1);
  if (k === 0) {
    const want = avg + r.int(1, 4);
    const sumNow = avg * n;
    const needed = want * (n + 1) - sumNow;
    if (needed > 100) return average(r);
    const who = r.pick(NAMES);
    return { q: `${who}'s average mark for ${n} tests was ${avg}. What mark must ${who.s} score in the next test so the average of all ${n + 1} tests becomes ${want}?`, answer: needed, steps: [`Total of ${n} tests = ${n} × ${avg} = ${sumNow}`, `Total needed for ${n + 1} tests = ${n + 1} × ${want} = ${want * (n + 1)}`, `Mark needed = ${want * (n + 1)} − ${sumNow} = ${needed}`], hint: 'Average × number of items = total.' };
  }
  const nums = Array.from({ length: n }, () => r.int(40, 99));
  const last = avg * (n + 1) - nums.reduce((s, v) => s + v, 0);
  if (last < 20 || last > 100) return average(r);
  return { q: `The average of ${n + 1} numbers is ${avg}. ${n} of the numbers are ${nums.join(', ')}. What is the other number?`, answer: last, steps: [`Total of ${n + 1} numbers = ${n + 1} × ${avg} = ${avg * (n + 1)}`, `Total of the ${n} given = ${nums.join(' + ')} = ${nums.reduce((s, v) => s + v, 0)}`, `Other number = ${avg * (n + 1)} − ${nums.reduce((s, v) => s + v, 0)} = ${last}`], hint: 'Average × number of items = total.' };
}

function rate(r) {
  const k = r.int(0, 1);
  if (k === 0) {
    const flow = r.pick([6, 8, 12, 15, 20, 25]), mins = r.int(5, 24);
    const tank = flow * mins;
    return { q: `A tap fills an empty tank at a rate of ${flow} litres per minute. The tank can hold ${tank} litres. How many minutes will it take to fill the tank completely?`, answer: mins, unit: 'minutes', steps: [`Time = volume ÷ rate`, `${tank} ÷ ${flow} = ${mins} minutes`], hint: 'Rate = amount ÷ time.' };
  }
  const price = r.pick([3, 4, 5, 6, 8]) , packs = r.int(2, 5), per = r.int(4, 8);
  return { q: `A packet of ${per} sausage buns costs ${$(price * per / 2)}. How much do ${packs * per} buns cost?`, answer: (price * per / 2) * packs, unit: '$', dp: 2, steps: [`${packs * per} buns = ${packs} packets (${packs * per} ÷ ${per})`, `Cost = ${packs} × ${$(price * per / 2)} = ${$((price * per / 2) * packs)}`], hint: 'Find how many packets you need.' };
}

function triangleArea(r) {
  const b = r.int(4, 20) * 2, h = r.int(3, 15);
  return { q: `A triangle has a base of ${b} cm and a height of ${h} cm. Find its area.`, answer: (b * h) / 2, unit: 'cm²', steps: [`Area of triangle = ½ × base × height`, `= ½ × ${b} × ${h} = ${(b * h) / 2} cm²`], hint: 'The height must be perpendicular to the base.' };
}

function volumeCuboid(r) {
  for (let i = 0; i < 100; i++) {
    const L = r.int(2, 9) * 10, W = r.int(2, 6) * 10, H = r.int(2, 6) * 10;
    const litres = (L * W * H) / 1000;
    const den = r.pick([2, 3, 4, 5]);
    const num = r.int(1, den - 1);
    if ((litres * num) % den !== 0 || gcd(num, den) !== 1) continue;
    return { q: `A rectangular tank measures ${L} cm by ${W} cm by ${H} cm. It is ${num}/${den} filled with water. How many litres of water are in the tank? (1 litre = 1000 cm³)`, answer: (litres * num) / den, unit: 'ℓ', steps: [`Volume of tank = ${L} × ${W} × ${H} = ${L * W * H} cm³`, `${L * W * H} cm³ = ${L * W * H} ÷ 1000 = ${litres} ℓ`, `Water = ${num}/${den} × ${litres} = ${(litres * num) / den} ℓ`], hint: 'Volume = length × breadth × height; 1 ℓ = 1000 cm³.' };
  }
  return volumeCuboid(r);
}

function chickensRabbits(r) {
  const c = r.int(5, 18), g = r.int(4, 16);
  const heads = c + g;
  const legs = 2 * c + 4 * g;
  const [a, b] = r.pick([['chickens', 'goats'], ['ducks', 'cows']]);
  return { q: `A farm has only ${a} and ${b}. There are ${heads} heads and ${legs} legs altogether. How many ${b} are there?`, answer: g, steps: [`Assume all ${heads} animals are ${a}: legs = ${heads} × 2 = ${heads * 2}`, `Extra legs = ${legs} − ${heads * 2} = ${legs - heads * 2}`, `Each ${b.replace(/s$/, '')} instead of ${a.replace(/s$/, '')} adds 2 more legs`, `Number of ${b} = ${legs - heads * 2} ÷ 2 = ${g}`], hint: 'Try the "assumption method": suppose every animal is the 2-legged one.' };
}

function internalTransfer(r) {
  const [a, b] = pickTwo(r);
  const give = r.int(5, 40);
  const bv = r.int(30, 90), av = bv + 2 * give;
  return { q: `${a} has ${av} marbles and ${b} has ${bv} marbles. How many marbles must ${a} give to ${b} so that they have the same number?`, answer: give, steps: [`Difference = ${av} − ${bv} = ${2 * give}`, `Giving ${give} reduces ${a} by ${give} and increases ${b} by ${give}, closing the gap by 2 × ${give}.`, `Number to give = ${2 * give} ÷ 2 = ${give}`], model: [bar(a.name, [seg(bv, String(bv), 'a'), seg(2 * give, `${2 * give} more`, 'b')]), bar(b.name, [seg(bv, String(bv), 'a')])], hint: 'Half of the difference needs to move across.' };
}

function speed(r) {
  const k = r.int(0, 3);
  if (k === 0) {
    const s = r.pick([40, 45, 50, 60, 72, 80]), t = r.pick([2, 3, 4, 5]);
    return { q: `A bus travels at an average speed of ${s} km/h for ${t} hours. What distance does it travel?`, answer: s * t, unit: 'km', steps: [`Distance = speed × time`, `= ${s} × ${t} = ${s * t} km`], hint: 'Distance = Speed × Time.' };
  }
  if (k === 1) {
    const s = r.pick([30, 40, 45, 60, 75]), t = r.pick([2, 3, 4]);
    const dist = s * t;
    return { q: `A car travelled ${dist} km in ${t} hours at a constant speed. What was its speed in km/h?`, answer: s, unit: 'km/h', steps: [`Speed = distance ÷ time`, `= ${dist} ÷ ${t} = ${s} km/h`], hint: 'Speed = Distance ÷ Time.' };
  }
  if (k === 2) {
    const s = r.pick([6, 8, 10, 12, 15]), min = r.pick([20, 30, 40, 45, 15]);
    const dist = (s * min) / 60;
    if (!Number.isInteger(dist * 4)) return speed(r);
    const who = r.pick(NAMES);
    return { q: `${who} cycles at ${s} km/h for ${min} minutes. How far does ${who.s} cycle? (Give your answer in km; decimals are fine.)`, answer: dist, unit: 'km', dp: 2, steps: [`${min} minutes = ${min}/60 h`, `Distance = ${s} × ${min}/60 = ${dist} km`], hint: 'Change the minutes to hours first.' };
  }
  const s1 = r.pick([40, 60, 80]), s2 = r.pick([20, 30, 40, 48]);
  if (s1 === s2) return speed(r);
  const L = lcm(s1, s2) * r.pick([1, 2]);
  const t1 = L / s1, t2 = L / s2;
  const avg = (2 * L) / (t1 + t2);
  return { q: `A van travelled ${L} km at ${s1} km/h and then another ${L} km at ${s2} km/h. What was its average speed for the whole journey (in km/h)?`, answer: avg, unit: 'km/h', dp: 2, steps: [`Time for 1st part = ${L} ÷ ${s1} = ${fmt(t1)} h`, `Time for 2nd part = ${L} ÷ ${s2} = ${fmt(t2)} h`, `Total distance = ${2 * L} km; total time = ${fmt(t1 + t2)} h`, `Average speed = ${2 * L} ÷ ${fmt(t1 + t2)} = ${fmt(avg)} km/h`, 'Careful: it is NOT just the average of the two speeds!'], hint: 'Average speed = TOTAL distance ÷ TOTAL time.' };
}

function ratioBeforeAfter(r) {
  const initial = [[3, 5], [2, 3], [4, 5], [3, 4], [5, 7], [5, 6]];
  const later = [[1, 3], [1, 2], [2, 5], [1, 4], [2, 3], [3, 7]];
  for (let i = 0; i < 100; i++) {
    const [a, b] = r.pick(initial), [c, d] = r.pick(later);
    if (a * d <= b * c) continue;
    const k = r.int(1, 4);
    const T = (a + b) * (c + d) * k;
    const x = k * (a * d - b * c);
    const [p, q] = pickTwo(r);
    return {
      q: `The ratio of ${p}'s money to ${q}'s money was ${a} : ${b}. After ${p} gave ${$(x)} to ${q}, the ratio became ${c} : ${d}. How much money did they have altogether?`,
      answer: T, unit: '$', dp: 0,
      steps: [`The total stays the same, so make the totals equal.`, `Before: ${a}:${b} → total ${a + b} units. After: ${c}:${d} → total ${c + d} units.`, `LCM of ${a + b} and ${c + d} = ${lcm(a + b, c + d)}. Before: ${p} has ${a * (lcm(a + b, c + d) / (a + b))} of ${lcm(a + b, c + d)} parts; after: ${c * (lcm(a + b, c + d) / (c + d))} of ${lcm(a + b, c + d)} parts.`, `Change = ${plural(a * (lcm(a + b, c + d) / (a + b)) - c * (lcm(a + b, c + d) / (c + d)), 'part')} = ${$(x)}`, `1 part = ${$(x)} ÷ ${a * (lcm(a + b, c + d) / (a + b)) - c * (lcm(a + b, c + d) / (c + d))} = ${$(x / (a * (lcm(a + b, c + d) / (a + b)) - c * (lcm(a + b, c + d) / (c + d))))}`, `Total = ${lcm(a + b, c + d)} parts = ${$(T)}`],
      hint: 'The TOTAL stays constant when money moves between two people – make the totals equal in both ratios.',
    };
  }
  return ratioBeforeAfter(r);
}

function algebraSimplify(r) {
  const a = r.int(2, 9), b = r.int(1, 9), c = r.int(1, 8), d = r.int(1, 9);
  const op = r.chance() ? 1 : -1;
  const coef = a + c, konst = b + op * d;
  const fmtExpr = (co, k) => `${co}a${k === 0 ? '' : k > 0 ? ` + ${k}` : ` − ${-k}`}`;
  return {
    q: `Simplify ${a}a + ${b} + ${c}a ${op > 0 ? '+' : '−'} ${d}.  (Type your answer like 5a + 3)`,
    answer: { linear: { coef, const: konst } },
    steps: [`Group the "a" terms: ${a}a + ${c}a = ${coef}a`, `Group the numbers: ${b} ${op > 0 ? '+' : '−'} ${d} = ${sg(konst)}`, `Answer: ${fmtExpr(coef, konst)}`],
    hint: 'Add the "a" terms together and the plain numbers together.',
  };
}

function algebraSolve(r) {
  const k = r.int(0, 2);
  if (k === 0) {
    const a = r.int(2, 9), x = r.int(2, 15), b = r.int(1, 20);
    return { q: `Solve  ${a}x + ${b} = ${a * x + b}.  Find x.`, answer: x, steps: [`${a}x + ${b} = ${a * x + b}`, `${a}x = ${a * x + b} − ${b} = ${a * x}`, `x = ${a * x} ÷ ${a} = ${x}`], hint: 'Undo the "+" first, then undo the "×".' };
  }
  if (k === 1) {
    const a = r.int(2, 8), x = r.int(1, 12), b = r.int(2, 9);
    return { q: `Find the value of ${a}k + ${b} when k = ${x}.`, answer: a * x + b, steps: [`Replace k with ${x}: ${a} × ${x} + ${b}`, `= ${a * x} + ${b} = ${a * x + b}`], hint: 'Substitute the number for the letter and calculate.' };
  }
  const m = r.int(2, 5), n = r.int(2, 12), age = r.int(5, 12);
  const who = r.pick(NAMES);
  return { q: `${who} is y years old. ${who.p[0].toUpperCase() + who.p.slice(1)} father is ${m} times as old as ${who.o}, plus ${n} years. When y = ${age}, how old is ${who.p} father?`, answer: m * age + n, unit: 'years old', steps: [`Father's age = ${m}y + ${n}`, `When y = ${age}: ${m} × ${age} + ${n} = ${m * age + n}`], hint: 'Write the expression first, then substitute.' };
}

function circle(r) {
  const rad = r.pick([2, 3, 4, 5, 6, 7, 8, 10, 12, 14]);
  const k = r.int(0, 2);
  if (k === 0) {
    const area = roundTo(3.14 * rad * rad, 2);
    return { q: `A circle has a radius of ${rad} cm. Find its area. (Take π = 3.14)`, answer: area, unit: 'cm²', dp: 2, steps: [`Area = π × r × r`, `= 3.14 × ${rad} × ${rad} = ${area.toFixed(2)} cm²`], hint: 'Area of circle = π × radius × radius.' };
  }
  if (k === 1) {
    const c = roundTo(2 * 3.14 * rad, 2);
    return { q: `A circle has a diameter of ${2 * rad} cm. Find its circumference. (Take π = 3.14)`, answer: c, unit: 'cm', dp: 2, steps: [`Circumference = π × diameter`, `= 3.14 × ${2 * rad} = ${c.toFixed(2)} cm`], hint: 'Circumference = π × diameter.' };
  }
  const area = roundTo((3.14 * rad * rad) / 2, 2);
  return { q: `Find the area of a semicircle with radius ${rad} cm. (Take π = 3.14)`, answer: area, unit: 'cm²', dp: 2, steps: [`Area of whole circle = 3.14 × ${rad} × ${rad} = ${roundTo(3.14 * rad * rad, 2).toFixed(2)} cm²`, `Semicircle = half = ${area.toFixed(2)} cm²`], hint: 'A semicircle is half of a circle.' };
}

function fracDivide(r) {
  const k = r.int(0, 1);
  if (k === 0) {
    const n = r.int(1, 5), d = r.pick([3, 4, 5, 7]), w = r.int(2, 6);
    return { q: `Calculate ${n}/${d} ÷ ${w}. Give your answer as a fraction in simplest form.`, answer: { frac: [n, d * w] }, steps: [`${n}/${d} ÷ ${w} = ${n}/${d} × 1/${w}`, `= ${n}/${d * w}`, `Simplest form: ${f(n, d * w)}`], hint: 'Dividing by a whole number = multiplying by its reciprocal.' };
  }
  const n1 = r.int(1, 3), d1 = r.pick([4, 5, 6]), n2 = r.int(1, 3), d2 = r.pick([2, 3, 4]);
  const N = n1 * d2, D = d1 * n2;
  return { q: `Calculate ${n1}/${d1} ÷ ${n2}/${d2}. Give your answer in simplest form.`, answer: { frac: [N, D] }, steps: [`${n1}/${d1} ÷ ${n2}/${d2} = ${n1}/${d1} × ${d2}/${n2}`, `= ${N}/${D}`, `Simplest form: ${f(N, D)}`], hint: 'Flip the second fraction and multiply.' };
}

function ageProblem(r) {
  const a = r.pick(NAMES), b = r.pick(MR);
  const kid = r.int(6, 12), mult = r.int(3, 4);
  const dad = kid * mult;
  const diff = dad - kid;
  const yy = diff - kid;
  return {
    q: `${a} is ${kid} years old and ${a.p} father, ${b}, is ${dad} years old. In how many years' time will the father be exactly twice as old as ${a}?`,
    answer: yy, unit: 'years',
    steps: [`Age difference = ${dad} − ${kid} = ${diff} (this never changes!)`, `When the father is twice as old, the difference equals ${a}'s age, so ${a} will be ${diff}.`, `Years later = ${diff} − ${kid} = ${yy}`],
    hint: 'The age difference always stays the same.',
  };
}

export const TOPICS = [
  { id: 'multistep', name: 'Money & multi-step', emoji: '🛍️', level: 4, gen: multistep },
  { id: 'lcmhcf', name: 'LCM & HCF', emoji: '🚌', level: 4, gen: lcmHcf },
  { id: 'factors', name: 'Factors & multiples', emoji: '🔢', level: 4, gen: factorsMultiples },
  { id: 'fracaddsub', name: 'Fractions: add & subtract', emoji: '🍰', level: 4, gen: fracAddSub },
  { id: 'fracofqty', name: 'Fraction of a quantity', emoji: '🧩', level: 4, gen: fracOfQty },
  { id: 'decimals', name: 'Decimals', emoji: '💧', level: 4, gen: decimalOps },
  { id: 'angles', name: 'Angles', emoji: '📐', level: 4, gen: angles },
  { id: 'areaperim', name: 'Area & perimeter', emoji: '🟦', level: 4, gen: areaPerim },
  { id: 'time', name: 'Time', emoji: '⏰', level: 4, gen: timeDur },
  { id: 'pattern', name: 'Number patterns', emoji: '🔁', level: 4, gen: pattern },
  { id: 'fracrem', name: 'Fractions: remainder', emoji: '🥧', level: 5, gen: fracRemaining },
  { id: 'fracmuldiv', name: 'Fractions: × and ÷', emoji: '✖️', level: 5, gen: fracMulDiv },
  { id: 'percent', name: 'Percentage, discount & GST', emoji: '🏷️', level: 5, gen: percentOf },
  { id: 'percentchange', name: 'Percentage change', emoji: '📈', level: 5, gen: percentChange },
  { id: 'ratio', name: 'Ratio', emoji: '⚖️', level: 5, gen: ratioShare },
  { id: 'average', name: 'Average', emoji: '📊', level: 5, gen: average },
  { id: 'rate', name: 'Rate', emoji: '🚰', level: 5, gen: rate },
  { id: 'triangle', name: 'Area of triangle', emoji: '🔺', level: 5, gen: triangleArea },
  { id: 'volume', name: 'Volume of cuboid', emoji: '🧊', level: 5, gen: volumeCuboid },
  { id: 'assumption', name: 'Heuristic: assumption', emoji: '🐔', level: 5, gen: chickensRabbits },
  { id: 'transfer', name: 'Heuristic: equal after giving', emoji: '🔄', level: 5, gen: internalTransfer },
  { id: 'speed', name: 'Speed', emoji: '🏎️', level: 6, gen: speed },
  { id: 'ratiochange', name: 'Ratio: before & after', emoji: '🔀', level: 6, gen: ratioBeforeAfter },
  { id: 'algsimplify', name: 'Algebra: simplify', emoji: '🔤', level: 6, gen: algebraSimplify },
  { id: 'algsolve', name: 'Algebra: solve & substitute', emoji: '🧮', level: 6, gen: algebraSolve },
  { id: 'circle', name: 'Circles', emoji: '⭕', level: 6, gen: circle },
  { id: 'fracdiv', name: 'Fractions: divide', emoji: '➗', level: 6, gen: fracDivide },
  { id: 'age', name: 'Age problems', emoji: '🎂', level: 6, gen: ageProblem },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id);

/** Generate one question. level = P-level (4-6) the student is at; difficulty 1-3. */
export function generate(topicId, { seed, difficulty = 2 } = {}) {
  const t = topicById(topicId);
  if (!t) throw new Error('Unknown topic ' + topicId);
  const r = makeRng(seed ?? Math.floor(Math.random() * 2 ** 31));
  const out = t.gen(r, difficulty);
  return { ...out, topic: t.id, topicName: t.name, level: t.level, subject: 'math', id: `${t.id}:${seed ?? ''}` };
}

export function topicsForLevel(level) {
  return TOPICS.filter((t) => t.level <= level);
}

/** A deterministic mixed set (used by worksheets and the Daily Challenge). */
export function mixedSet({ seed, count = 5, level = 6, topics = null, difficulty = 2 }) {
  const r = makeRng(seed);
  const pool = topics?.length ? topics.map(topicById).filter(Boolean) : topicsForLevel(level);
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = pool[(i + r.int(0, pool.length - 1)) % pool.length];
    out.push(generate(t.id, { seed: r.int(1, 2 ** 30), difficulty }));
  }
  return out;
}

export function answerToString(q) {
  const a = q.answer;
  if (a && a.frac) return fracStr(a.frac[0], a.frac[1]);
  if (a && a.linear) {
    const { coef, const: k } = a.linear;
    return `${coef}a${k === 0 ? '' : k > 0 ? ` + ${k}` : ` − ${-k}`}`;
  }
  const s = typeof q.dp === 'number' && !Number.isInteger(a) ? a.toFixed(q.dp) : String(a);
  return `${q.unit === '$' ? '$' : ''}${s}${q.unit && q.unit !== '$' ? (/^[°%]$/.test(q.unit) ? q.unit : ' ' + q.unit) : ''}`;
}
