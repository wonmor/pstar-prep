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
  // First-launch disclaimer
  await clickText(page, 'I understand & agree');
  await page.getByText('PSTAR Prep', { exact: true }).first().waitFor({ timeout: 8000 });
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
  await page.locator('text=✕').first().click().catch(() => {});
  await sleep(400);

  // Section practice → answer → feedback (green/red)
  await clickText(page, 'Pilot Responsibilities');
  await page.locator('[data-testid="opt-0"]').first().waitFor({ timeout: 8000 });
  await page.locator('[data-testid="opt-0"]').first().click();
  await sleep(500); // reveal feedback
  await shot(page, dir, '04-feedback');
  await page.locator('text=✕').first().click().catch(() => {});
  await sleep(400);

  // Flashcards → flip to answer
  await clickText(page, 'Cards', { which: 'last' });
  await clickText(page, 'All questions');
  await page.locator('[data-testid="flashcard"]').waitFor({ timeout: 8000 });
  await page.locator('[data-testid="flashcard"]').click();
  await sleep(500);
  await shot(page, dir, '05-flashcard');
  await page.locator('text=✕').first().click().catch(() => {});
  await sleep(400);

  // Answer key
  await clickText(page, 'Answers', { which: 'last' });
  await page.getByText('Answer Key', { exact: true }).waitFor({ timeout: 8000 });
  await sleep(400);
  await shot(page, dir, '06-answers');

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
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
