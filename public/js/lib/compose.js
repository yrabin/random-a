// Offline composition checker: simple, transparent heuristics that work without any AI key.
const WEAK = {
  said: ['whispered', 'muttered', 'exclaimed', 'replied', 'announced', 'sighed'],
  very: ['extremely', 'incredibly', 'rather', '(or use a stronger word)'],
  nice: ['pleasant', 'delightful', 'kind', 'charming'],
  good: ['excellent', 'splendid', 'wonderful', 'commendable'],
  bad: ['dreadful', 'terrible', 'appalling', 'unpleasant'],
  big: ['enormous', 'gigantic', 'massive', 'towering'],
  small: ['tiny', 'minute', 'petite', 'miniature'],
  happy: ['delighted', 'overjoyed', 'elated', 'thrilled'],
  sad: ['heartbroken', 'gloomy', 'miserable', 'downcast'],
  went: ['dashed', 'trudged', 'strolled', 'hurried'],
  walked: ['strolled', 'trudged', 'marched', 'tiptoed'],
  got: ['received', 'obtained', 'grabbed', 'became'],
  thing: ['object', 'item', '(name the thing exactly)'],
  suddenly: ['all of a sudden', 'without warning', 'in the blink of an eye'],
  looked: ['glanced', 'peered', 'gazed', 'stared'],
};
const FEELINGS = ['happy', 'sad', 'angry', 'scared', 'afraid', 'nervous', 'excited', 'worried', 'surprised', 'tired', 'embarrassed', 'proud', 'upset'];
const SHOW = {
  happy: 'a grin spread across my face / my heart leapt',
  sad: 'my eyes stung and a lump formed in my throat',
  angry: 'my fists clenched and my face burned',
  scared: 'my knees trembled and my heart pounded like a drum',
  afraid: 'my knees trembled and goosebumps crept up my arms',
  nervous: 'my palms were clammy and butterflies fluttered in my stomach',
  excited: 'I could hardly sit still, bouncing on my toes',
  worried: 'I bit my lip and my stomach twisted into knots',
  surprised: 'my jaw dropped and my eyes widened',
  tired: 'my legs felt like lead and my eyelids drooped',
  embarrassed: 'heat rushed to my cheeks and I wished the floor would swallow me',
  proud: 'I stood tall with a beaming smile',
  upset: 'tears welled up and my voice wobbled',
};
const SINGLISH = ['lah', 'leh', 'lor', 'sia', 'meh', 'hor', 'wah', 'aiyo', 'can or not', 'got no', 'one kind', 'shiok'];

export function analyze(text) {
  const t = (text || '').trim();
  const words = t.match(/[A-Za-z']+/g) || [];
  const sentences = t.split(/(?<=[.!?])["”')\]]*\s+/).map((s) => s.trim()).filter(Boolean);
  const paragraphs = t.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const lens = sentences.map((s) => (s.match(/[A-Za-z']+/g) || []).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const lower = words.map((w) => w.toLowerCase());
  const count = (w) => lower.filter((x) => x === w).length;

  const starters = {};
  sentences.forEach((s) => {
    const w = (s.match(/[A-Za-z']+/) || [''])[0].toLowerCase();
    if (w) starters[w] = (starters[w] || 0) + 1;
  });
  const repeatedStarters = Object.entries(starters).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);

  const weak = Object.keys(WEAK).map((w) => ({ word: w, n: count(w), try: WEAK[w] })).filter((x) => x.n >= (x.word === 'said' ? 3 : 2));
  const tellings = [];
  FEELINGS.forEach((f) => {
    const re = new RegExp(`\\b(was|were|felt|am|is|feel|feeling|became)\\s+(very\\s+|so\\s+|really\\s+)?${f}\\b`, 'i');
    const m = t.match(re);
    if (m) tellings.push({ feeling: f, example: m[0], show: SHOW[f] });
  });
  const singlish = SINGLISH.filter((s) => new RegExp(`\\b${s}\\b`, 'i').test(t));
  const hasDialogue = /["“”]/.test(t);
  const senses = ['saw', 'heard', 'smelled', 'smelt', 'tasted', 'aroma', 'whiff', 'rustle', 'echo', 'glimmer', 'gleam', 'sizzl', 'fragran'].filter((w) => lower.some((x) => x.startsWith(w)));
  const simile = /\b(like a|as \w+ as)\b/i.test(t);
  const ending = sentences.slice(-2).join(' ');
  const hasMoral = /\b(learn|learnt|learned|realised|realized|lesson|from that day|never forget|from then on)\b/i.test(ending);

  const tips = [];
  if (words.length > 0 && words.length < 150) tips.push({ icon: '📏', text: `Your piece is ${words.length} words. PSLE compositions are usually about 150–250+ words. Add more detail to the main event.` });
  if (paragraphs.length < 4 && words.length > 80) tips.push({ icon: '🧱', text: `You have ${paragraphs.length} paragraph(s). A story usually has 4–5: beginning, build-up, problem/climax, resolution, ending.` });
  if (avg > 24) tips.push({ icon: '✂️', text: `Your sentences average ${avg.toFixed(0)} words – some may be too long. Break one up.` });
  if (sentences.length >= 6 && sd < 4) tips.push({ icon: '🎵', text: 'Most of your sentences are the same length. Mix short punchy sentences with longer ones for rhythm.' });
  repeatedStarters.forEach(([w, n]) => tips.push({ icon: '🔁', text: `${n} sentences start with "${w}". Try starting with an -ing word, an adverb ("Slowly, …") or a time phrase.` }));
  weak.forEach((x) => tips.push({ icon: '💎', text: `"${x.word}" appears ${x.n} times. Try: ${x.try.join(', ')}.` }));
  tellings.slice(0, 3).forEach((x) => tips.push({ icon: '🎭', text: `Show, don't tell: "${x.example}" → "${x.show}".` }));
  if (!hasDialogue && words.length > 120) tips.push({ icon: '💬', text: 'No dialogue yet. A line or two of speech brings a story alive (remember the punctuation: "Come here," she said.).' });
  if (senses.length < 2 && words.length > 120) tips.push({ icon: '👃', text: 'Add sensory details – what did the character hear, smell or taste, not just see?' });
  if (!simile && words.length > 120) tips.push({ icon: '🖼️', text: 'Try one simile (e.g. "as quiet as a mouse") – but only if it fits.' });
  if (singlish.length) tips.push({ icon: '🇸🇬', text: `Singlish found (${singlish.join(', ')}). It can be fine in dialogue, but use standard English in narration.` });
  if (!hasMoral && words.length > 120) tips.push({ icon: '🎬', text: 'Your ending could show what the character learnt or how they changed.' });

  return { words: words.length, sentences: sentences.length, paragraphs: paragraphs.length, avgSentence: Math.round(avg * 10) / 10, variety: Math.round(sd * 10) / 10, hasDialogue, tips, weak, tellings, singlish };
}

// Plot-twist generator for brainstorming (offline fun).
export const PLOT = {
  heroes: ['a shy girl who loves drawing', 'a boy who is afraid of heights', 'twin brothers who always argue', 'a hawker centre uncle who never smiles', 'a new transfer student', 'a girl with a magical hairpin', 'a grandmother who secretly climbs trees'],
  places: ['a rainy MRT platform', 'the school canteen at recess', 'a void deck during a power cut', 'Pulau Ubin', 'the library after closing time', 'the Botanic Gardens at dusk', 'a night market in Geylang Serai', 'a hospital waiting room'],
  problems: ['loses something precious', 'is blamed for something they did not do', 'gets lost', 'must keep a secret', 'makes a promise that is hard to keep', 'finds a mysterious package', 'faces their biggest fear'],
  twists: ['the villain turns out to be a friend in disguise', 'the "lost" item was with them all along', 'a stranger helps in an unexpected way', 'it was all a surprise party', 'the weather changes everything', 'the hero must apologise to win', 'an old photograph reveals a family secret'],
  lessons: ['honesty is worth more than winning', 'true friends stay beside you', 'courage is feeling afraid and doing it anyway', 'small kindnesses matter', 'perseverance pays off', 'it is okay to ask for help'],
};
