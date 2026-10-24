# 🛠️ Developer guide

## Layout

```
server.js                  zero-dependency static server (CSP, gzip/br, ETag, optional BASIC_AUTH, /healthz)
Dockerfile, docker-compose.yml, fly.toml, render.yaml, deploy/cloudrun.sh
public/                    the whole app (no build step)
  index.html, sw.js, manifest.webmanifest, css/style.css, icons/
  js/app.js                hash router, onboarding, top bar, theme
  js/state.js              singletons: store (localStorage) + askAI()
  js/ui.js                 h() DOM builder, safe markdown renderer, toast/sound/confetti/modal
  js/views/*.js            one file per screen; quiz.js is the shared practice engine
  js/lib/                  pure logic (importable from Node tests)
    mathgen.js             28 Maths question generators with worked solutions
    answer.js              answer parsing/checking (fractions, mixed numbers, money, linear expressions)
    alcalc.js              PSLE AL bands, total, posting group, target planner
    srs.js                 Leitner spaced-repetition
    gamify.js              XP, levels, streak, badges
    store.js               profile/stats persistence (storage is injected)
    ai.js                  BYOK client for Anthropic / OpenAI-compatible / Gemini, JSON extraction, quiz normaliser
    prompts.js             all system prompts
    compose.js             offline composition checker + plot generator
    banks.js               turns content banks into quiz questions + Daily Challenge
    report.js              anonymous stats summary for AI notes
    rng.js                 seeded RNG (worksheets & daily challenge are reproducible)
  js/data/                 content banks (english.js, science.js, chinese.js)
test/                      node:test unit tests + e2e/smoke.cjs (Playwright)
```

## Run & test

```bash
npm start                  # http://localhost:8080
npm test                   # unit tests, no install needed (Node ≥ 20)
npm i -D playwright && npx playwright install chromium && node test/e2e/smoke.cjs
```

## Design decisions

* **No build, no dependencies.** The app is plain ES modules so it can be read, audited and hosted anywhere. `lib/` has no DOM access so the logic can be unit-tested in Node.
* **BYOK with direct browser calls.** The server never sees keys or prompts. Anthropic calls use the `anthropic-dangerous-direct-browser-access` header (the browser-direct mode); OpenAI-compatible and Gemini endpoints allow CORS. The CSP `connect-src` allows `https:` plus localhost.
* **Safe rendering.** Everything is built with `createElement`/`textContent`; AI output goes through `md()` which builds DOM nodes (no `innerHTML`). The e2e test asserts that `<img onerror>` in an AI reply does not execute.
* **Local-first data.** One JSON blob in `localStorage` (`psle-otter:v1`) with profiles, stats, mistakes (SRS cards embed the question snapshot) and settings. Export omits the API key.
* **Network-first service worker** so redeploys show up immediately but the app still opens offline. Calls to other origins (AI providers) are never intercepted.

## Adding content

* **Multiple-choice** (grammar/science): add an object with the correct option in `a` and three wrong options in `w`; the tests enforce 3 distinct wrong options and an explanation. Options are shuffled at run time.
* **Vocabulary / idioms / 成语**: add tuples to the arrays in `js/data/*.js`.
* **A Maths topic**: write `function myTopic(r, d)` in `mathgen.js` returning `{ q, answer, steps[], hint, unit?, dp? }` (`answer` may be a number, `{frac:[n,d]}` or `{linear:{coef,const}}`) and add it to `TOPICS` with its P-level. `npm test` will run it against hundreds of seeds (finite answers, no `NaN`, model answer accepted by the checker). Add a brute-force verification test for anything non-trivial, as done for ratio/assumption/remainder.
* **A badge**: add to `BADGES` in `gamify.js`.
* **An AI provider**: add an entry to `PROVIDERS` and a branch in `buildRequest`/`parseResponse` in `ai.js`, plus a test.

## Quality bar for content

Questions should follow the MOE primary syllabus and PSLE style, use Singapore contexts, and be **unambiguous with exactly one correct answer**. Science statements must be accurate at primary level (e.g. "a cockroach has no pupa stage"). Keep reading level appropriate for 9–12-year-olds. Please don't copy past-year exam papers or tuition-centre material (copyright).

## Security notes

* Strict CSP (`script-src 'self'; style-src 'self'`): no inline scripts or `style=""` attributes in markup (dynamic styles use the CSSOM, which CSP allows).
* The server only answers GET/HEAD, normalises paths and refuses anything outside `public/`.
* `BASIC_AUTH` uses a constant-time comparison; use HTTPS in front of it.
* The API key is in `localStorage`, so any XSS would expose it — hence the strict CSP and DOM-only rendering. Don't add third-party scripts.

## Releasing

Tag `vX.Y.Z` → `publish.yml` builds and pushes `ghcr.io/<owner>/<repo>:X.Y.Z` (multi-arch). Bump `VERSION` in `public/sw.js` when you want to force old caches to be dropped.
