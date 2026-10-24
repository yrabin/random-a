// XP, levels, streaks, badges.
export const LEVEL_TITLES = ['Otter Pup', 'Pond Paddler', 'River Rookie', 'Kopi Kaki', 'Hawker Hero', 'Marina Mariner', 'Merlion Mate', 'Garden Guardian', 'PSLE Pro', 'Legend of the Lion City'];

export const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 60)) + 1;
export const xpForLevel = (lvl) => 60 * (lvl - 1) ** 2;
export const levelTitle = (lvl) => LEVEL_TITLES[Math.min(lvl - 1, LEVEL_TITLES.length - 1)];

export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const prevDay = (key) => { const [y, m, d] = key.split('-').map(Number); return dateKey(new Date(y, m - 1, d - 1)); };

export function bumpStreak(streak, today = dateKey()) {
  if (streak.last === today) return streak;
  if (streak.last === prevDay(today)) return { count: streak.count + 1, last: today, best: Math.max(streak.best || 0, streak.count + 1) };
  return { count: 1, last: today, best: Math.max(streak.best || 0, 1) };
}

/** Streak as shown to the user (resets to 0 if a whole day was missed). */
export function liveStreak(streak, today = dateKey()) {
  if (!streak || !streak.last) return 0;
  return streak.last === today || streak.last === prevDay(today) ? streak.count : 0;
}

export const BADGES = [
  { id: 'first', emoji: '🌱', name: 'First splash', desc: 'Answer your first question', test: (p) => p.totals.answered >= 1 },
  { id: 'q50', emoji: '🏊', name: 'Swimming along', desc: 'Answer 50 questions', test: (p) => p.totals.answered >= 50 },
  { id: 'q250', emoji: '🌊', name: 'Wave rider', desc: 'Answer 250 questions', test: (p) => p.totals.answered >= 250 },
  { id: 'q1000', emoji: '🏆', name: 'Ocean explorer', desc: 'Answer 1,000 questions', test: (p) => p.totals.answered >= 1000 },
  { id: 'streak3', emoji: '🔥', name: 'On a roll', desc: '3-day streak', test: (p) => (p.streak.best || 0) >= 3 },
  { id: 'streak7', emoji: '🌟', name: 'Week warrior', desc: '7-day streak', test: (p) => (p.streak.best || 0) >= 7 },
  { id: 'streak30', emoji: '👑', name: 'Unstoppable', desc: '30-day streak', test: (p) => (p.streak.best || 0) >= 30 },
  { id: 'combo10', emoji: '⚡', name: 'Lightning', desc: '10 correct in a row', test: (p) => (p.totals.bestCombo || 0) >= 10 },
  { id: 'daily', emoji: '📅', name: 'Daily dabbler', desc: 'Finish a Daily Challenge', test: (p) => (p.totals.dailies || 0) >= 1 },
  { id: 'daily7', emoji: '🗓️', name: 'Daily devotee', desc: 'Finish 7 Daily Challenges', test: (p) => (p.totals.dailies || 0) >= 7 },
  { id: 'fixer', emoji: '🔧', name: 'Mistake mender', desc: 'Master a card in the Mistake Notebook', test: (p) => (p.totals.mastered || 0) >= 1 },
  { id: 'fixer10', emoji: '🛠️', name: 'Master mechanic', desc: 'Master 10 Mistake Notebook cards', test: (p) => (p.totals.mastered || 0) >= 10 },
  { id: 'allrounder', emoji: '🎯', name: 'All-rounder', desc: 'Answer questions in all four subjects', test: (p) => ['math', 'english', 'science', 'chinese'].every((s) => (p.subjects[s]?.answered || 0) > 0) },
  { id: 'ai', emoji: '🤖', name: 'AI explorer', desc: 'Use an AI feature', test: (p) => (p.totals.aiUses || 0) >= 1 },
  { id: 'writer', emoji: '✍️', name: 'Storyteller', desc: 'Get a composition checked', test: (p) => (p.totals.compositions || 0) >= 1 },
  { id: 'focus', emoji: '⏱️', name: 'Deep focus', desc: 'Complete 5 focus sessions', test: (p) => (p.totals.focusSessions || 0) >= 5 },
];

export const newlyEarned = (profile) => BADGES.filter((b) => !profile.badges[b.id] && b.test(profile));
