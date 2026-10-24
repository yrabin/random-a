# 🦦 PSLE Otter — Ollie's Study Pond

A free, open-source **PSLE study buddy for Singapore upper-primary students (P4–P6)**.
It runs as a single tiny Docker container, needs **no database, no accounts and no npm packages**, and
works on a phone, tablet or laptop (and offline once loaded).

> **Everything works without AI.** If you add your own AI key (BYOK), you unlock extra helpers —
> but the maths engine, quizzes, calculators and trackers are all free and offline.

| | Without a key (always free) | With your own AI key (optional) |
|---|---|---|
| ➗ **Maths** | 28 topic generators (P4–P6) with **infinite fresh questions**, step-by-step bar-model-style working, hints, 60-second Blitz, printable worksheets with answer keys | Tutor chat, **Snap & Check** (photo of handwritten working → feedback), Question Forge |
| 📖 **English** | Vocabulary, 46 grammar Qs, **Grammar Cloze** passages, **Editing**, *Spot the Singlish*, synthesis & transformation, idioms, **Composition Lab** (plot-twist generator, show-don't-tell bank, free writing checker), oral & read-aloud practice | PSLE-rubric **composition marking**, situational-writing marking, **oral coach**, comprehension **passage generator** |
| 🔬 **Science** | 58 MCQs across the 5 MOE themes with explanations, open-ended CER practice, keyword cards | AI marking of open-ended answers, unlimited new questions |
| 🀄 **Chinese** | 成语 & 词语 quizzes with pinyin and example sentences | Ask the tutor in any language |
| 🎯 **PSLE tools** | **AL score calculator**, target planner (cheapest marks to gain), countdown, score history | Coach's note & weekly parent update |
| 🧠 **Learning science** | **Mistake Notebook** with spaced repetition (Leitner boxes), daily challenge, streaks, XP, 16 badges, topic heat-map, focus timer, printable parent report | |

**Privacy by design:** progress is stored only in the browser (export/import as JSON). The AI key is stored only in the
browser and calls go **directly from the browser to the AI provider** — they never pass through this server.
No analytics, no cookies, no ads.

## Quick start

```bash
# with Docker
docker compose up -d            # → http://localhost:8080

# or: pre-built multi-arch image (after the publish workflow has run on main)
docker run -d -p 8080:8080 ghcr.io/yrabin/random-a:latest

# or: no Docker, Node 20+
npm start
```

## Documentation

| Document | For |
|---|---|
| [📘 User manual](docs/USER_MANUAL.md) | Students and parents — how to use every feature, set up AI safely |
| [🚀 Deployment guide](docs/DEPLOYMENT.md) | Step-by-step: run at home, or host cheaply/free (Cloud Run, Render, Fly.io, Oracle free VM, Cloudflare Tunnel…) |
| [🛠️ Developer guide](docs/DEVELOPMENT.md) | Architecture, adding questions, tests, security notes |

## Tech notes

* Node.js ≥ 20 static server (`server.js`, ~100 lines, zero dependencies): gzip/brotli, ETag, strict CSP, optional Basic-Auth gate.
* Vanilla ES-module front end (no build step). All maths is generated and **verified by tests** (every generator is run against hundreds of seeds and its model answer is re-checked by the answer parser).
* PWA: installable, works offline.
* Image ≈ 60 MB compressed, runs in < 64 MB RAM, runs as non-root, has a `HEALTHCHECK`.

```bash
npm test                         # unit tests (node:test, no install needed)
node test/e2e/smoke.cjs          # optional browser end-to-end test (needs playwright)
```

## Disclaimer

Not affiliated with the Ministry of Education, Singapore or SEAB. Questions are original practice material;
AL bands follow the publicly documented PSLE scoring system — always confirm details with MOE/SEAB and your school.
AI answers can be wrong; treat them as a study aid, not an authority.

MIT licensed.
