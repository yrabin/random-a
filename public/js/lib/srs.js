// Leitner-box spaced repetition used by the Mistake Notebook.
export const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16, 32];
const DAY = 86400000;

export function newCard(snapshot, now = Date.now()) {
  return { id: snapshot.id + '@' + now, box: 0, due: now, added: now, tries: 0, snapshot };
}

export function review(card, correct, now = Date.now()) {
  const box = correct ? Math.min(card.box + 1, INTERVAL_DAYS.length - 1) : 0;
  return { ...card, box, tries: card.tries + 1, due: now + INTERVAL_DAYS[box] * DAY, last: now, mastered: correct && box >= INTERVAL_DAYS.length - 1 };
}

export const isDue = (card, now = Date.now()) => !card.mastered && card.due <= now;
export const dueCards = (cards, now = Date.now()) => cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);
