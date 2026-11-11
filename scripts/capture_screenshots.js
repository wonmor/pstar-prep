// Drives the PSTAR Prep web build with Playwright and captures store screenshots
// at each required device pixel size. UI is identical to native (react-native-web).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.SITE_URL || 'http://127.0.0.1:8799/pstar-prep/';
const OUT = process.env.OUT_DIR || path.resolve(__dirname, 'out');

// width/height are LOGICAL px; final image = w*scale × h*scale.
const TARGETS = [
  { id: 'ios-6.9', w: 440, h: 956, scale: 3 }, //  1320×2868  (iPhone 17 Pro Max)
  { id: 'ios-6.7', w: 430, h: 932, scale: 3 }, //  1290×2796  (iPhone 15/16 Plus)
  { id: 'ipad-12.9', w: 1024, h: 1366, scale: 2 }, // 2048×2732
  { id: 'android-phone', w: 360, h: 800, scale: 3 }, // 1080×2400
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, { exact = true, which = 'first' } = {}) {
  const loc = page.getByText(text, { exact });
  const target = which === 'last' ? loc.last() : loc.first();
  await target.click({ timeout: 8000 });
}

async function shot(page, dir, name) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(450); // settle layout/animation
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  console.log('   📸', name);
}

async function runTarget(browser, t) {
  const dir = path.join(OUT, t.id);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: t.w, height: t.h },
    deviceScaleFactor: t.scale,
    isMobile: t.id.startsWith('android') || t.id.startsWith('ios'),
    hasTouch: true,
  });
  const page = await ctx.newPage();
  console.log(`\n▶ ${t.id} (${t.w * t.scale}×${t.h * t.scale})`);

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  // Wait for the Ionicons line-glyph font so icons never render as tofu.
  await page.waitForFunction(
    () => [...document.fonts].some((f) => /ionicons/i.test(f.family) && f.status === 'loaded'),
    null,
    { timeout: 20000 },
  ).catch(() => console.log('   (ionicons font wait timed out)'));
  await sleep(500);
  // First-launch disclaimer
  await clickText(page, 'I understand & agree');
  await page.getByText('Study modes', { exact: true }).first().waitFor({ timeout: 8000 });
  await shot(page, dir, '01-home');

  // Practice setup
  await clickText(page, 'Practice', { which: 'last' });
  await page.getByText('Start mock exam', { exact: true }).waitFor({ timeout: 8000 });
  await shot(page, dir, '02-practice');

  // Mock exam — clean question screen
  await clickText(page, 'Start mock exam');
  await page.locator('[data-testid="opt-0"]').first().waitFor({ timeout: 8000 });
  await shot(page, dir, '03-exam');
  // exit back to setup
  await page.reload({ waitUntil: 'networkidle' }); // full-screen flows: reset to Home
  await clickText(page, 'Practice', { which: 'last' });
  await sleep(400);

  // Section practice → answer → feedback (green/red)
  await clickText(page, 'Pilot Responsibilities');
  await page.locator('[data-testid="opt-0"]').first().waitFor({ timeout: 8000 });
  await page.locator('[data-testid="opt-0"]').first().click();
  await sleep(500); // reveal feedback
  await shot(page, dir, '04-feedback');
  await page.reload({ waitUntil: 'networkidle' }); // full-screen flows: reset to Home
  await sleep(400);

  // Flashcards → flip to answer
  await clickText(page, 'Cards', { which: 'last' });
  await clickText(page, 'All questions');
  await page.locator('[data-testid="flashcard"]').waitFor({ timeout: 8000 });
  await page.locator('[data-testid="flashcard"]').click();
  await sleep(500);
  await shot(page, dir, '05-flashcard');
  await page.reload({ waitUntil: 'networkidle' }); // full-screen flows: reset to Home
  await sleep(400);

  // Answer key
  await clickText(page, 'Answers', { which: 'last' });
  await page.getByText('Answer Key', { exact: true }).waitFor({ timeout: 8000 });
  await sleep(400);
  await shot(page, dir, '06-answers');

  // Results — finish a short section practice (Collision Avoidance, 10 Qs)
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(400);
  await clickText(page, 'Practice', { which: 'last' });
  await clickText(page, 'Collision Avoidance');
  // Answer from the dataset so the result shot reads 90%, not a random score.
  const bank = require('../assets/data/pstar.json').questions;
  for (let i = 0; i < 10; i++) {
    await page.locator('[data-testid="opt-0"]').first().waitFor({ timeout: 8000 });
    const heading = (await page.getByRole('heading').last().innerText()).trim();
    const q = bank.find((x) => x.question.trim() === heading);
    const correct = q ? q.options[q.answer - 1] : null;
    const opts = page.locator('[data-testid^="opt-"]');
    const texts = await opts.allInnerTexts();
    const norm = (t) => t.replace(/\s+/g, ' ').trim();
    const hit = correct ? texts.findIndex((t) => norm(t).endsWith(norm(correct))) : -1;
    await opts.nth(hit >= 0 && i !== 3 ? hit : 0).click();
    await sleep(250);
    const next = page.getByText(i === 9 ? 'See results' : 'Next question', { exact: true }).last();
    await next.click({ timeout: 8000 });
    await sleep(250);
  }
  await page.getByText('Try again', { exact: true }).waitFor({ timeout: 8000 });
  await shot(page, dir, '07-results');

  // ROC-A home
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(400);
  await clickText(page, 'ROC-A', { which: 'first' });
  await page.getByText('Study modes', { exact: true }).first().waitFor({ timeout: 8000 });
  await sleep(300);
  await shot(page, dir, '08-roca');

  await ctx.close();
}

(async () => {
  // PW_CHANNEL=chrome uses the installed Google Chrome instead of a downloaded Chromium.
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  // Warm-up: the very first context can paint before the icon font is
  // applied (tofu), so load the app once and throw that context away.
  const warm = await browser.newContext();
  await (await warm.newPage()).goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(1500);
  await warm.close();
  for (const t of TARGETS) {
    try {
      await runTarget(browser, t);
    } catch (e) {
      console.error(`   ✗ ${t.id} failed:`, e.message);
    }
  }
  await browser.close();
  console.log('\n✅ done →', OUT);
})();
