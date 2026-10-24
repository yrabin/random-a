// PSLE Achievement Level (AL) scoring, as used for Secondary 1 posting from the 2021 cohort onwards.
// Always double-check against the latest MOE / SEAB circulars - this is a study aid, not an official calculator.

export const AL_BANDS = [
  { al: 1, min: 90, max: 100 },
  { al: 2, min: 85, max: 89 },
  { al: 3, min: 80, max: 84 },
  { al: 4, min: 75, max: 79 },
  { al: 5, min: 65, max: 74 },
  { al: 6, min: 45, max: 64 },
  { al: 7, min: 20, max: 44 },
  { al: 8, min: 0, max: 19 },
];

export const SUBJECTS = [
  { id: 'eng', name: 'English', emoji: '📖' },
  { id: 'mt', name: 'Mother Tongue', emoji: '🈶' },
  { id: 'math', name: 'Mathematics', emoji: '➗' },
  { id: 'sci', name: 'Science', emoji: '🔬' },
];

export function markToAL(mark) {
  const m = Math.max(0, Math.min(100, Math.floor(Number(mark))));
  if (Number.isNaN(m)) return null;
  return AL_BANDS.find((b) => m >= b.min).al;
}

export function postingGroup(total) {
  if (total == null) return null;
  if (total <= 20) return { group: 1, label: 'Posting Group 1 (AL 4–20)' };
  if (total <= 24) return { group: 2, label: 'Posting Group 2 (AL 21–24)' };
  if (total <= 30) return { group: 3, label: 'Posting Group 3 (AL 25–30)' };
  return { group: null, label: 'AL 31–32: speak to your school / MOE about options' };
}

export function computeAL(marks) {
  const als = {};
  let total = 0;
  for (const s of SUBJECTS) {
    const al = markToAL(marks[s.id]);
    if (al == null) return null;
    als[s.id] = al;
    total += al;
  }
  return { als, total, posting: postingGroup(total) };
}

/** Marks needed to reach a given AL (the minimum of that band). */
export const minMarkFor = (al) => AL_BANDS.find((b) => b.al === al).min;

/**
 * Plan how to reach `target` total AL from current marks, using the cheapest mark gains first.
 * Returns { current, steps: [{subject, fromAL, toAL, targetMark, gain}], reachable, finalTotal }.
 */
export function plan(marks, target) {
  const cur = { ...marks };
  const base = computeAL(cur);
  if (!base) return null;
  let als = { ...base.als };
  let total = base.total;
  const steps = [];
  const goalMarks = { ...cur };
  while (total > target) {
    let best = null;
    for (const s of SUBJECTS) {
      if (als[s.id] <= 1) continue;
      const nextAL = als[s.id] - 1;
      const need = minMarkFor(nextAL) - goalMarks[s.id];
      if (!best || need < best.need) best = { subject: s, nextAL, need };
    }
    if (!best) break;
    steps.push({ subject: best.subject.id, fromAL: als[best.subject.id], toAL: best.nextAL, targetMark: minMarkFor(best.nextAL), gain: best.need });
    goalMarks[best.subject.id] = minMarkFor(best.nextAL);
    als[best.subject.id] = best.nextAL;
    total -= 1;
  }
  return { current: base, steps, reachable: total <= target, finalTotal: total, goalMarks };
}

export function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d - n) / 86400000);
}
