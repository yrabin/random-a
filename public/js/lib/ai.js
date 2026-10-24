// Bring-your-own-key AI client. Calls go straight from the browser to the provider the family chose;
// nothing is proxied through (or stored on) the PSLE Otter server.

export const PROVIDERS = {
  anthropic: { label: 'Anthropic (Claude)', model: 'claude-haiku-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', needsKey: true, vision: true, note: 'Haiku is the cheapest model – a typical question costs a fraction of a cent.' },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', keyUrl: 'https://platform.openai.com/api-keys', needsKey: true, vision: true, base: 'https://api.openai.com/v1', note: 'gpt-4o-mini is cheap and good for primary-school level.' },
  gemini: { label: 'Google Gemini', model: 'gemini-2.5-flash', keyUrl: 'https://aistudio.google.com/apikey', needsKey: true, vision: true, note: 'Google AI Studio offers a free tier with rate limits.' },
  openrouter: { label: 'OpenRouter (many models, some free)', model: 'meta-llama/llama-3.3-70b-instruct:free', keyUrl: 'https://openrouter.ai/keys', needsKey: true, vision: false, base: 'https://openrouter.ai/api/v1', note: 'Pick a model whose name ends in ":free" for no cost (limits apply). Model names change – check openrouter.ai/models.' },
  custom: { label: 'Custom / local (OpenAI-compatible)', model: '', keyUrl: '', needsKey: false, vision: false, base: 'http://localhost:11434/v1', note: 'For Ollama, LM Studio, Groq, etc. Enter the base URL ending in /v1 and a model name.' },
};

export class AIError extends Error {
  constructor(message, { status, kind } = {}) { super(message); this.status = status; this.kind = kind; }
}

export const isConfigured = (ai) => !!ai && (ai.provider === 'custom' ? !!(ai.baseUrl && ai.model) : !!ai.key);

/** Build the {url, init} for a provider. Pure - easy to test. */
export function buildRequest(cfg, { system, messages, maxTokens = 1500, temperature = 0.4, json = false }) {
  const p = PROVIDERS[cfg.provider];
  if (!p) throw new AIError('Unknown AI provider.', { kind: 'config' });
  const model = (cfg.model || p.model || '').trim();
  if (!model) throw new AIError('Please enter a model name in Settings.', { kind: 'config' });
  const key = (cfg.key || '').trim();

  if (cfg.provider === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model, max_tokens: maxTokens, temperature, system,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.images?.length
              ? [...m.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mime, data: im.data } })), { type: 'text', text: m.content }]
              : m.content,
          })),
        }),
      },
    };
  }
  if (cfg.provider === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [...(m.images || []).map((im) => ({ inlineData: { mimeType: im.mime, data: im.data } })), { text: m.content }],
          })),
          generationConfig: { maxOutputTokens: maxTokens, temperature, ...(json ? { responseMimeType: 'application/json' } : {}) },
        }),
      },
    };
  }
  // OpenAI-compatible (openai, openrouter, custom)
  const base = ((cfg.provider === 'custom' ? cfg.baseUrl : p.base) || '').replace(/\/+$/, '');
  if (!base) throw new AIError('Please enter the base URL in Settings.', { kind: 'config' });
  const headers = { 'content-type': 'application/json' };
  if (key) headers.authorization = `Bearer ${key}`;
  return {
    url: `${base}/chat/completions`,
    init: {
      method: 'POST', headers,
      body: JSON.stringify({
        model, max_tokens: maxTokens, temperature,
        messages: [{ role: 'system', content: system }, ...messages.map((m) => ({
          role: m.role,
          content: m.images?.length
            ? [...m.images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mime};base64,${im.data}` } })), { type: 'text', text: m.content }]
            : m.content,
        }))],
      }),
    },
  };
}

export function parseResponse(provider, data) {
  if (provider === 'anthropic') return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  if (provider === 'gemini') return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  return data.choices?.[0]?.message?.content || '';
}

function friendly(status, bodyText) {
  let detail = '';
  try { const j = JSON.parse(bodyText); detail = j.error?.message || j.error || j.message || ''; if (typeof detail !== 'string') detail = JSON.stringify(detail); } catch { detail = bodyText.slice(0, 200); }
  if (status === 401 || status === 403) return `The AI service did not accept the key (${status}). Check the key in Settings. ${detail}`.trim();
  if (status === 404) return `The AI service could not find that model. Check the model name in Settings. ${detail}`.trim();
  if (status === 429) return 'The AI service says "too many requests" or the quota/credit is used up. Wait a minute, or check your account billing. ' + detail;
  if (status === 402) return 'The AI account has no credit left. ' + detail;
  if (status >= 500) return `The AI service is having trouble (${status}). Try again in a moment.`;
  return `AI error ${status}: ${detail}`;
}

/** Send a chat request. Returns the assistant text. */
export async function chat(cfg, opts, { fetchImpl = globalThis.fetch, signal } = {}) {
  if (!isConfigured(cfg)) throw new AIError('AI is not set up yet. Add your key in Settings ⚙️.', { kind: 'config' });
  const { url, init } = buildRequest(cfg, opts);
  let res;
  try {
    res = await fetchImpl(url, { ...init, signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new AIError('Could not reach the AI service. Check your internet connection' + (cfg.provider === 'custom' ? ' and that the local server allows browser requests (CORS).' : '.'), { kind: 'network' });
  }
  const text = await res.text();
  if (!res.ok) throw new AIError(friendly(res.status, text), { status: res.status, kind: 'http' });
  let data;
  try { data = JSON.parse(text); } catch { throw new AIError('The AI service sent something unexpected.', { kind: 'parse' }); }
  const out = parseResponse(cfg.provider, data).trim();
  if (!out) throw new AIError('The AI gave an empty answer. Please try again.', { kind: 'empty' });
  return out;
}

/** Pull a JSON object/array out of a model reply (handles ``` fences and chatter around it). */
export function extractJSON(text) {
  if (!text) throw new Error('empty');
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const start = t.search(/[[{]/);
  if (start < 0) throw new Error('no json');
  const open = t[start], close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return JSON.parse(t.slice(start, i + 1));
  }
  throw new Error('unbalanced json');
}

/** Normalise AI-generated quiz JSON into the question shape the quiz player expects. */
export function normalizeQuiz(parsed, { subject = 'english', topic = 'ai' } = {}) {
  const arr = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(arr)) throw new Error('no questions');
  const out = [];
  arr.forEach((raw, i) => {
    const q = String(raw.q ?? raw.question ?? '').trim();
    if (!q) return;
    const options = Array.isArray(raw.options) ? raw.options.map((o) => String(o).replace(/^\s*[A-Da-d][).:]\s+/, '').trim()).slice(0, 4) : [];
    let ans = raw.answer ?? raw.correct ?? raw.answerIndex;
    if (typeof ans === 'string') {
      const letter = ans.trim().toUpperCase();
      ans = /^[A-D]$/.test(letter) ? 'ABCD'.indexOf(letter) : options.findIndex((o) => o.toLowerCase() === ans.trim().toLowerCase());
    }
    const base = { id: `ai:${Date.now()}:${i}`, q, explanation: String(raw.explanation ?? raw.why ?? ''), subject, topic, topicName: 'AI Question Forge' };
    if (options.length >= 2 && Number.isInteger(ans) && ans >= 0 && ans < options.length) {
      out.push({ ...base, type: 'mcq', options, answerIndex: ans });
    } else if (raw.model_answer || raw.modelAnswer) {
      out.push({ ...base, type: 'open', modelAnswer: String(raw.model_answer ?? raw.modelAnswer), keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : [] });
    }
  });
  if (!out.length) throw new Error('no usable questions');
  return out;
}

/** Downscale a user photo to a JPEG (base64, no prefix) so uploads stay small and cheap. */
export async function imageToBase64(file, maxSide = 1280, quality = 0.82) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { mime: 'image/jpeg', data: dataUrl.split(',')[1], preview: dataUrl };
}
