// Local-only persistence (one browser = one family). Storage is injectable so it can be tested.
import { levelFromXp, bumpStreak, dateKey, newlyEarned, BADGES } from './gamify.js';
import { newCard, review } from './srs.js';

const KEY = 'psle-otter:v1';

export function blankProfile(name = 'Student', level = 5) {
  return {
    id: 'p' + Math.random().toString(36).slice(2, 8), name, level, avatar: '🦦', created: Date.now(), xp: 0,
    streak: { count: 0, last: null, best: 0 },
    totals: { answered: 0, correct: 0, combo: 0, bestCombo: 0, dailies: 0, mastered: 0, aiUses: 0, compositions: 0, focusSessions: 0, focusMinutes: 0 },
    subjects: {}, topics: {}, badges: {}, mistakes: [], days: {}, scores: [], goals: { psleDate: '', targetTotal: 12 }, daily: {}, notes: '',
  };
}

export function createStore(storage) {
  let state;
  const listeners = new Set();
  const load = () => {
    try { state = JSON.parse(storage.getItem(KEY)); } catch { state = null; }
    if (!state || !state.profiles) {
      const p = blankProfile();
      state = { v: 1, active: p.id, profiles: { [p.id]: p }, settings: { theme: 'auto', sound: true, ai: { provider: 'anthropic', model: '', key: '', baseUrl: '' } }, onboarded: false };
    }
    state.settings ||= { theme: 'auto', sound: true, ai: {} };
    state.settings.ai ||= {};
  };
  const save = () => { try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ } listeners.forEach((fn) => fn(state)); };
  load();

  const api = {
    get state() { return state; },
    get profile() { return state.profiles[state.active]; },
    get settings() { return state.settings; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    save,
    reload: load,

    addProfile(name, level) {
      const p = blankProfile(name, level);
      state.profiles[p.id] = p; state.active = p.id; save(); return p;
    },
    switchProfile(id) { if (state.profiles[id]) { state.active = id; save(); } },
    deleteProfile(id) {
      if (Object.keys(state.profiles).length < 2) return false;
      delete state.profiles[id];
      if (state.active === id) state.active = Object.keys(state.profiles)[0];
      save(); return true;
    },

    /**
     * Record one answered question. `q` = {id, subject, topic, topicName, snapshot?}. Returns rewards.
     */
    record(q, correct, { xp: bonusXp = 0, quiet = false } = {}) {
      const p = api.profile;
      const before = levelFromXp(p.xp);
      const today = dateKey();
      p.totals.answered++;
      if (correct) { p.totals.correct++; p.totals.combo++; p.totals.bestCombo = Math.max(p.totals.bestCombo, p.totals.combo); } else p.totals.combo = 0;
      const sub = (p.subjects[q.subject] ||= { answered: 0, correct: 0 });
      sub.answered++; if (correct) sub.correct++;
      const top = (p.topics[q.subject + ':' + q.topic] ||= { name: q.topicName || q.topic, answered: 0, correct: 0, recent: [] });
      top.answered++; if (correct) top.correct++;
      top.recent = [...top.recent, correct ? 1 : 0].slice(-10);
      const day = (p.days[today] ||= { answered: 0, correct: 0, xp: 0 });
      day.answered++; if (correct) day.correct++;
      const gain = (correct ? 10 : 2) + (correct ? Math.min(p.totals.combo, 10) : 0) + bonusXp;
      p.xp += gain; day.xp += gain;
      p.streak = bumpStreak(p.streak, today);
      // keep only 120 days of per-day stats
      const keys = Object.keys(p.days).sort();
      while (keys.length > 120) delete p.days[keys.shift()];
      if (!correct && q.snapshot) addMistake(p, q.snapshot);
      const badges = newlyEarned(p);
      badges.forEach((b) => { p.badges[b.id] = Date.now(); });
      const after = levelFromXp(p.xp);
      if (!quiet) save();
      return { gain, levelUp: after > before ? after : null, badges, combo: p.totals.combo };
    },

    reviewMistake(cardId, correct) {
      const p = api.profile;
      const i = p.mistakes.findIndex((c) => c.id === cardId);
      if (i < 0) return null;
      const was = p.mistakes[i].mastered;
      p.mistakes[i] = review(p.mistakes[i], correct);
      if (p.mistakes[i].mastered && !was) p.totals.mastered++;
      const badges = newlyEarned(p);
      badges.forEach((b) => { p.badges[b.id] = Date.now(); });
      save();
      return { card: p.mistakes[i], badges };
    },
    removeMistake(cardId) { api.profile.mistakes = api.profile.mistakes.filter((c) => c.id !== cardId); save(); },

    bump(counter, n = 1) {
      const p = api.profile;
      p.totals[counter] = (p.totals[counter] || 0) + n;
      const badges = newlyEarned(p);
      badges.forEach((b) => { p.badges[b.id] = Date.now(); });
      save();
      return badges;
    },
    addXp(n) { api.profile.xp += n; save(); },

    exportData({ includeKey = false } = {}) {
      const copy = JSON.parse(JSON.stringify(state));
      if (!includeKey) copy.settings.ai.key = '';
      return JSON.stringify(copy, null, 1);
    },
    importData(text, { keepKey = true } = {}) {
      const incoming = JSON.parse(text);
      if (!incoming || !incoming.profiles || !incoming.active || !incoming.profiles[incoming.active]) throw new Error('That file does not look like a PSLE Otter backup.');
      const oldKey = state.settings.ai.key;
      state = incoming;
      state.settings ||= { theme: 'auto', sound: true, ai: {} };
      state.settings.ai ||= {};
      if (keepKey && !state.settings.ai.key) state.settings.ai.key = oldKey || '';
      save();
    },
    resetAll() { storage.removeItem(KEY); load(); save(); },
  };
  return api;
}

function addMistake(p, snapshot) {
  const dup = p.mistakes.find((c) => !c.mastered && c.snapshot.id === snapshot.id && c.snapshot.q === snapshot.q);
  if (dup) { dup.box = 0; dup.due = Date.now(); return; }
  p.mistakes.push(newCard(snapshot));
  if (p.mistakes.length > 300) p.mistakes = p.mistakes.filter((c) => !c.mastered).slice(-300);
}

export { BADGES };
