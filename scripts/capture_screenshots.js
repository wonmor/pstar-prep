// Drives the PSTAR Prep web build with Playwright and captures store screenshots
// at each required device pixel size. UI is identical to native (react-native-web).
//
//   OUT_DIR=$PWD/store-assets/screenshots PW_CHANNEL=chrome node scripts/capture_screenshots.js
//
// Shots per device (10 for the App Store, the first 8 listed in PLAY_SET go to Google Play):
//   01-home        home with the recall ring and study modes
//   02-feedback    practice question with its diagram and the answer revealed
//   03-exam        mock exam with the pace ring
//   04-spot        spot-it diagram after a correct tap
//   05-visual-card visual flashcard, diagram side
//   06-results     practice result ring with the topic breakdown
//   07-progress    progress screen: rings, streak calendar, topics
//   08-roca        ROC-A home
//   09-practice    practice setup (mock exam card + spot it + sections)
//   10-answers     answer key
const { chromium } = require(process.env.PW_MODULE || 'playwright');
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
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bank = require('../assets/data/pstar.json').questions;
const manifest = require('../assets/illustrations/manifest.json');
const illustrated = new Set(
  manifest.illustrations.flatMap((i) => i.questions.filter((q) => q.startsWith('pstar:')).map((q) => q.slice(6))),
);

async function clickText(page, text, { exact = true, which = 'first' } = {}) {
  const loc = page.getByText(text, { exact });
  const target = which === 'last' ? loc.last() : loc.first();
  await target.click({ timeout: 8000 });
}

async function shot(page, dir, name) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(700); // settle layout/animation (rings animate for 700 ms)
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  console.log('   shot', name);
}

// Reset to Home (full-screen flows have no tab bar).
async function home(page) {
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(400);
}

// Answer the current practice question; returns true when correct was chosen.
async function answerCurrent(page, { wrongOnPurpose = false } = {}) {
  await page.locator('[data-testid="opt-0"]').first().waitFor({ timeout: 8000 });
  const heading = (await page.getByRole('heading').last().innerText()).trim();
  const q = bank.find((x) => x.question.trim() === heading);
  const correct = q ? q.options[q.answer - 1] : null;
  const opts = page.locator('[data-testid^="opt-"]');
  const texts = await opts.allInnerTexts();
  const norm = (t) => t.replace(/\s+/g, ' ').trim();
  const hit = correct ? texts.findIndex((t) => norm(t).endsWith(norm(correct))) : -1;
  let pick = hit >= 0 ? hit : 0;
  if (wrongOnPurpose) pick = hit === 0 ? 1 : 0;
  await opts.nth(pick).click();
  await sleep(300);
  return q;
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
  console.log(`\n> ${t.id} (${t.w * t.scale}x${t.h * t.scale})`);

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(
    () => [...document.fonts].some((f) => /ionicons/i.test(f.family) && f.status === 'loaded'),
    null,
    { timeout: 20000 },
  ).catch(() => console.log('   (ionicons font wait timed out)'));
  await sleep(500);
  // First-launch disclaimer
  await clickText(page, 'I understand & agree');
  await page.getByText('Study modes', { exact: true }).first().waitFor({ timeout: 8000 });

  // Seed some progress first so the home ring and progress screen have data:
  // a Collision Avoidance practice run (10 Qs, one deliberate miss) ...
  await clickText(page, 'Practice', { which: 'last' });
  await clickText(page, 'Collision Avoidance');
  for (let i = 0; i < 10; i++) {
    await answerCurrent(page, { wrongOnPurpose: i === 3 });
    const next = page.getByText(i === 9 ? 'See results' : 'Next question', { exact: true }).last();
    await next.click({ timeout: 8000 });
    await sleep(250);
  }
  await page.getByText('Try again', { exact: true }).waitFor({ timeout: 8000 });
  await shot(page, dir, '06-results');

  // ... and a few Visual Signals answers (illustrated questions).
  await home(page);
  await clickText(page, 'Practice', { which: 'last' });
  await clickText(page, 'Visual Signals');
  let captured = false;
  for (let i = 0; i < 8; i++) {
    const q = await answerCurrent(page);
    if (!captured && q && illustrated.has(q.id)) {
      await page.locator('[data-testid^="illustration-"]').first().waitFor({ timeout: 8000 });
      await shot(page, dir, '02-feedback');
      captured = true;
    }
    if (i === 7) break;
    const next = page.getByText(i === 7 ? 'See results' : 'Next question', { exact: true }).last();
    await next.click({ timeout: 8000 });
    await sleep(250);
  }

  // Home (now with a ring, streak and the Spot It mode).
  await home(page);
  await shot(page, dir, '01-home');

  // Practice setup
  await clickText(page, 'Practice', { which: 'last' });
  await page.getByText('Start mock exam', { exact: true }).waitFor({ timeout: 8000 });
  await shot(page, dir, '09-practice');

  // Mock exam with the pace ring
  await clickText(page, 'Start mock exam');
  await page.locator('[data-testid="pace-timer"]').waitFor({ timeout: 8000 });
  await page.locator('[data-testid="opt-0"]').first().click();
  await sleep(1200);
  await shot(page, dir, '03-exam');

  // Spot it: tap the correct target on the first diagram.
  await home(page);
  await clickText(page, 'Practice', { which: 'last' });
  await page.locator('[data-testid="start-spot"]').click();
  await page.locator('[data-testid^="spot-illustration-"]').first().waitFor({ timeout: 8000 });
  const spotId = (await page.locator('[data-testid^="spot-illustration-"]').first().getAttribute('data-testid')).replace('spot-illustration-', '');
  const ill = manifest.illustrations.find((i) => i.id === spotId);
  const correct = ill.spot.targets.find((x) => x.correct);
  await page.locator(`[data-testid="spot-${correct.id}"]`).click();
  await sleep(400);
  await shot(page, dir, '04-spot');

  // Visual flashcards: diagram side.
  await home(page);
  await clickText(page, 'Cards', { which: 'last' });
  await clickText(page, 'Visual cards');
  await page.locator('[data-testid="flashcard"]').waitFor({ timeout: 8000 });
  await page.locator('[data-testid^="illustration-"]').first().waitFor({ timeout: 8000 });
  await shot(page, dir, '05-visual-card');

  // Progress screen.
  await home(page);
  await page.locator('[data-testid="home-progress"]').click();
  await page.getByText('Topic mastery', { exact: true }).waitFor({ timeout: 8000 });
  await shot(page, dir, '07-progress');

  // Answer key
  await home(page);
  await clickText(page, 'Answers', { which: 'last' });
  await page.getByText('Answer Key', { exact: true }).waitFor({ timeout: 8000 });
  await sleep(400);
  await shot(page, dir, '10-answers');

  // ROC-A home
  await home(page);
  await clickText(page, 'ROC-A', { which: 'first' });
  await page.getByText('Study modes', { exact: true }).first().waitFor({ timeout: 8000 });
  await sleep(300);
  await shot(page, dir, '08-roca');
  // Switch back so the next device starts on PSTAR.
  await clickText(page, 'PSTAR', { which: 'first' });

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
    if (ONLY && !ONLY.includes(t.id)) continue;
    try {
      await runTarget(browser, t);
    } catch (e) {
      console.error(`   FAILED ${t.id}:`, e.message);
      process.exitCode = 1;
    }
  }
  await browser.close();
  console.log('\ndone:', OUT);
})();
