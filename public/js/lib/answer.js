// Parsing and checking of student answers (numbers, fractions, mixed numbers, simple algebra).

export const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
export const lcm = (a, b) => (a / gcd(a, b)) * b;

/** Format a fraction as simplest "n/d" or mixed number "w n/d". */
export function fracStr(n, d, { mixed = true } = {}) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  n /= g; d /= g;
  if (d === 1) return String(n);
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (mixed && n > d) return `${sign}${Math.floor(n / d)} ${n % d}/${d}`;
  return `${sign}${n}/${d}`;
}

/**
 * Parse text such as "3/4", "1 3/4", "-2.5", "$12.50", "45 km/h", "1,200", "35%".
 * Returns { value, frac: {n,d}|null, simplest } or null.
 */
export function parseNumber(input) {
  if (input == null) return null;
  let s = String(input).trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/[$,% ]/g, '').replace(/−|–/g, '-').replace(/\s+/g, ' ').trim();
  const m = s.match(/^([-+]?)\s*(\d+(?:\.\d+)?|\.\d+)(?:\s+(\d+)\s*\/\s*(\d+)|\s*\/\s*(\d+))?(?![\d.])/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const rest = s.slice(m[0].length).trim();
  // Anything left must be a unit-ish word (letters, ^, /, 2 for cm2, etc.), not another number.
  if (rest && /^[\d.+\-*×x÷=]/.test(rest) && !/^(cm|m|km|g|kg|l|ml)/.test(rest)) return null;
  const whole = parseFloat(m[2]);
  if (m[4] !== undefined) {
    const n = parseInt(m[3], 10), d = parseInt(m[4], 10);
    if (!d || !Number.isInteger(whole)) return null;
    const total = whole * d + n;
    return { value: (sign * total) / d, frac: { n: sign * total, d }, simplest: gcd(total, d) === 1 && n < d };
  }
  if (m[5] !== undefined) {
    const d = parseInt(m[5], 10);
    if (!d || !Number.isInteger(whole)) return null;
    return { value: (sign * whole) / d, frac: { n: sign * whole, d }, simplest: gcd(whole, d) === 1 };
  }
  return { value: sign * whole, frac: null, simplest: true };
}

/**
 * Parse a one-variable linear expression like "5a + 4", "4+5a", "a", "-2n+1", "3(a+2)" is NOT supported.
 * Returns { coef, const } or null.
 */
export function parseLinear(input) {
  if (input == null) return null;
  let s = String(input).toLowerCase().replace(/\s+/g, '').replace(/−|–/g, '-').replace(/×|\*/g, '');
  if (!s) return null;
  const varMatch = s.match(/[a-z]/g);
  const letter = varMatch ? varMatch[0] : null;
  if (varMatch && varMatch.some((c) => c !== letter)) return null;
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join('') !== s) return null;
  let coef = 0, konst = 0;
  for (const t of terms) {
    if (letter && t.includes(letter)) {
      const m = t.match(/^([+-]?)(\d*\.?\d*)[a-z]$/);
      if (!m) return null;
      const c = m[2] === '' ? 1 : parseFloat(m[2]);
      coef += (m[1] === '-' ? -1 : 1) * c;
    } else {
      if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return null;
      konst += parseFloat(t);
    }
  }
  return { coef, const: konst, letter };
}

/**
 * Check an answer. `expected` is a number, or {frac:[n,d]}, or {linear:{coef,const}}, or a string.
 * Returns 'correct' | 'unsimplified' | 'wrong' | 'invalid'.
 */
export function checkAnswer(input, expected, { tol = 0.0051 } = {}) {
  if (expected && typeof expected === 'object' && expected.linear) {
    const got = parseLinear(input);
    if (!got) return 'invalid';
    const ok = Math.abs(got.coef - expected.linear.coef) < 1e-9 && Math.abs(got.const - expected.linear.const) < 1e-9;
    return ok ? 'correct' : 'wrong';
  }
  const got = parseNumber(input);
  if (!got) return 'invalid';
  let want;
  let wantFrac = false;
  if (expected && typeof expected === 'object' && expected.frac) {
    want = expected.frac[0] / expected.frac[1];
    wantFrac = true;
  } else {
    want = Number(expected);
  }
  const close = wantFrac ? Math.abs(got.value - want) < 1e-9 : Math.abs(got.value - want) <= tol;
  if (!close) return 'wrong';
  if (wantFrac && got.frac && !got.simplest) return 'unsimplified';
  return 'correct';
}

export function formatNumber(n, dp) {
  if (typeof dp === 'number') return n.toFixed(dp);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6);
}
