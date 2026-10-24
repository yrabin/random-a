// Builds a compact, privacy-light summary of a profile (no name) for the coach note / parent summary.
import { dateKey, liveStreak } from './gamify.js';
import { dueCards } from './srs.js';

export function lastDays(n, now = new Date()) {
  return Array.from({ length: n }, (_, i) => dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i))));
}

export function summarize(p, now = new Date()) {
  const days = lastDays(7, now);
  let answered = 0, correct = 0, activeDays = 0;
  for (const d of days) {
    const x = p.days[d];
    if (x) { answered += x.answered; correct += x.correct; if (x.answered) activeDays++; }
  }
  const topics = Object.entries(p.topics).filter(([, v]) => v.answered >= 3).map(([k, v]) => ({
    topic: v.name, subject: k.split(':')[0], answered: v.answered, accuracyPct: Math.round((v.correct / v.answered) * 100),
    recentAccuracyPct: Math.round((v.recent.reduce((a, b) => a + b, 0) / Math.max(1, v.recent.length)) * 100),
  }));
  const sorted = topics.slice().sort((a, b) => a.accuracyPct - b.accuracyPct);
  return {
    level: `P${p.level}`,
    last7Days: { questionsAnswered: answered, accuracyPct: answered ? Math.round((correct / answered) * 100) : null, daysPracticed: activeDays },
    streakDays: liveStreak(p.streak, dateKey(now)),
    totalQuestionsEver: p.totals.answered,
    mistakeNotebook: { due: dueCards(p.mistakes, now.getTime()).length, mastered: p.totals.mastered || 0 },
    focusMinutesEver: p.totals.focusMinutes || 0,
    weakestTopics: sorted.slice(0, 3),
    strongestTopics: sorted.slice(-3).reverse(),
    latestPsleScore: p.scores.length ? { alTotal: p.scores[p.scores.length - 1].total, label: p.scores[p.scores.length - 1].label } : null,
    targetAlTotal: p.goals.targetTotal,
  };
}
