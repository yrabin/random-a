// End-to-end smoke test (optional): npm i -D playwright && npx playwright install chromium && node test/e2e/smoke.cjs
// Starts the real server, drives the UI in Chromium and mocks the AI provider endpoints.
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const PORT = 8123;
const BASE = `http://localhost:${PORT}`;

(async () => {
  const server = spawn('node', ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  const step = (m) => console.log('✓', m);

  try {
    await page.goto(BASE);
    await page.waitForSelector('.modal');
    await page.fill('.modal input', 'Tester');
    await page.click('.modal .pill:has-text("P6")');
    await page.click('text=Let’s go');
    await page.waitForSelector('text=Good');
    step('onboarding');

    // Maths: wrong answer -> goes to mistake notebook
    await page.goto(`${BASE}/#/math/play?topics=ratio&n=2&d=2&l=5`);
    await page.waitForSelector('.num-input');
    await page.fill('.num-input', '987654');
    await page.click('button:has-text("Check")');
    await page.waitForSelector('.feedback.no');
    assert.match(await page.innerText('.feedback.no'), /Correct answer/);
    step('maths wrong answer feedback');
    await page.click('#nextBtn');
    await page.fill('.num-input', 'abc');
    await page.click('button:has-text("Check")');
    assert.match(await page.innerText('main'), /type a number/i);
    await page.fill('.num-input', '1');
    await page.click('button:has-text("Check")');
    await page.click('#nextBtn');
    await page.waitForSelector('text=Maths practice');
    step('maths session summary');

    await page.goto(`${BASE}/#/mistakes`);
    await page.waitForSelector('text=due today');
    assert.match(await page.innerText('main'), /Review/);
    await page.click('a:has-text("Review")');
    await page.waitForSelector('.num-input, .opt');
    step('mistake review starts');

    // Daily challenge: answer 6 questions (mcq or numeric)
    await page.goto(`${BASE}/#/math/daily`);
    for (let i = 0; i < 6; i++) {
      await page.waitForSelector('.num-input, .opt');
      if (await page.locator('.num-input').count()) { await page.fill('.num-input', '1'); await page.click('button:has-text("Check")'); } else { await page.locator('.opt').first().click(); }
      await page.click('#nextBtn');
    }
    await page.waitForSelector('text=Daily Challenge');
    await page.goto(`${BASE}/#/`);
    await page.goto(`${BASE}/#/math/daily`);
    await page.waitForSelector('text=Daily Challenge done');
    step('daily challenge completes once per day');

    // Science MCQ with keyboard
    await page.goto(`${BASE}/#/science/mcq`);
    await page.waitForSelector('.opt');
    await page.keyboard.press('a');
    await page.waitForSelector('.feedback');
    step('science mcq keyboard answer');

    // AI: mock provider
    await page.route('https://api.anthropic.com/**', async (route) => {
      const body = JSON.parse(route.request().postData());
      const text = body.system.includes('composition marker')
        ? '```json\n{"content":{"score":14,"out_of":20,"comment":"Good ideas"},"language":{"score":13,"out_of":20,"comment":"Some slips"},"overall_comment":"Nice","strengths":["Vivid"],"improvements":["Paragraphs"],"rewrites":[],"vocabulary_upgrades":[],"grammar_fixes":[],"next_step":"Add dialogue"}\n```'
        : 'Hello from mock Ollie! Let us draw a bar model.';
      await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text }] }) });
    });
    await page.goto(`${BASE}/#/settings`);
    await page.fill('input[aria-label="API key"]', 'sk-test');
    await page.dispatchEvent('input[aria-label="API key"]', 'change');
    await page.click('button:has-text("Save & test")');
    await page.waitForSelector('text=Works!');
    step('settings AI test');
    await page.goto(`${BASE}/#/ai/tutor`);
    await page.fill('textarea', 'How do I do ratio?');
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=Hello from mock Ollie');
    step('tutor chat');

    await page.goto(`${BASE}/#/english/write`);
    await page.fill('textarea[aria-label="Your composition"]', 'I was very happy. '.repeat(12) + 'lah.');
    await page.click('button:has-text("Free check")');
    await page.waitForSelector('text=Free checker results');
    await page.click('button:has-text("Get marked feedback")');
    await page.waitForSelector('text=14/20');
    step('composition free check + AI coach');

    await page.goto(`${BASE}/#/psle`);
    await page.waitForSelector('text=PSLE AL score');
    step('psle calculator');

    // XSS safety: AI text with HTML must render as text
    await page.unroute('https://api.anthropic.com/**');
    await page.route('https://api.anthropic.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ content: [{ type: 'text', text: '<img src=x onerror=window.__pwned=1> **bold**' }] }) }));
    await page.goto(`${BASE}/#/ai/tutor`);
    await page.fill('textarea', 'hi'); await page.keyboard.press('Enter');
    await page.waitForSelector('strong:has-text("bold")');
    assert.equal(await page.evaluate(() => window.__pwned), undefined);
    step('AI output is rendered safely');

    assert.deepEqual(problems.filter((p) => !/Failed to load resource/.test(p)), []);
    console.log('\nE2E OK');
  } catch (e) {
    console.error('E2E FAILED:', e.message, '\n', problems.join('\n'));
    await page.screenshot({ path: path.join(process.env.E2E_SHOT || '.', 'e2e-fail.png'), fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.kill();
  }
})();
