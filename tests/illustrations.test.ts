// Unit tests for the illustration catalogue. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets', 'illustrations');
const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8')) as {
  palette: Record<string, string>;
  illustrations: {
    id: string;
    file: string;
    topic: string;
    title: string;
    alt: string;
    caption: string;
    explanation: string;
    exams: string[];
    questions: string[];
    spot?: { prompt: string; targets: { id: string; label: string; rect: number[]; correct: boolean }[]; questions: string[] };
  }[];
};

type DS = { questions: { id: string }[] };
const datasets: Record<string, DS> = {
  pstar: JSON.parse(readFileSync(path.join(root, 'assets', 'data', 'pstar.json'), 'utf8')),
  roca: JSON.parse(readFileSync(path.join(root, 'assets', 'data', 'roca.json'), 'utf8')),
};
const questionExists = (key: string) => {
  const [exam, id] = key.split(':');
  return !!datasets[exam]?.questions.some((q) => q.id === id);
};
const BANNED = ['·', '•'];
const noDots = (s: string, where: string) => {
  for (const ch of BANNED) assert.ok(!s.includes(ch), `${where} contains a middle dot or bullet`);
};

test('catalogue is non-trivial and ids are unique', () => {
  assert.ok(manifest.illustrations.length >= 20);
  const ids = manifest.illustrations.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every referenced SVG exists, has a viewBox and no external references', () => {
  for (const ill of manifest.illustrations) {
    const p = path.join(dir, ill.file);
    assert.ok(existsSync(p), `${ill.id}: ${ill.file} missing`);
    const xml = readFileSync(p, 'utf8');
    assert.match(xml, /<svg [^>]*viewBox="0 0 \d+ \d+"/, `${ill.id}: viewBox`);
    assert.ok(!/<image/i.test(xml), `${ill.id}: embeds an image`);
    assert.ok(!/href="https?:/i.test(xml), `${ill.id}: external href`);
    assert.ok(!/<script/i.test(xml), `${ill.id}: script`);
  }
});

test('SVGs use only the shared palette (so clients can recolour them)', () => {
  const allowed = new Set(Object.values(manifest.palette).map((h) => h.toUpperCase()));
  for (const ill of manifest.illustrations) {
    const xml = readFileSync(path.join(dir, ill.file), 'utf8');
    const hexes = xml.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
    for (const h of hexes) assert.ok(allowed.has(h.toUpperCase()), `${ill.id}: colour ${h} is not in the palette`);
  }
});

test('every illustration has alt text, title, caption and explanation without dots', () => {
  for (const ill of manifest.illustrations) {
    assert.ok(ill.alt.trim().length >= 40, `${ill.id}: alt text too short`);
    assert.ok(ill.title.trim().length > 0, `${ill.id}: title`);
    assert.ok(ill.caption.trim().length > 0, `${ill.id}: caption`);
    assert.ok(ill.explanation.trim().length >= 80, `${ill.id}: explanation`);
    assert.ok(ill.exams.length > 0 && ill.exams.every((e) => e === 'pstar' || e === 'roca'), `${ill.id}: exams`);
    for (const s of [ill.alt, ill.title, ill.caption, ill.explanation, ill.topic]) noDots(s, ill.id);
    const xml = readFileSync(path.join(dir, ill.file), 'utf8');
    noDots(xml, `${ill.id} svg`);
  }
});

test('every linked question exists in its dataset and maps to one illustration', () => {
  const seen = new Map<string, string>();
  for (const ill of manifest.illustrations) {
    for (const q of ill.questions) {
      assert.match(q, /^(pstar|roca):\d+\.\d+$/, `${ill.id}: bad question key ${q}`);
      assert.ok(questionExists(q), `${ill.id}: question ${q} not in dataset`);
      assert.ok(ill.exams.includes(q.split(':')[0]), `${ill.id}: ${q} belongs to an exam the illustration does not list`);
      assert.ok(!seen.has(q), `${q} linked from both ${seen.get(q)} and ${ill.id}`);
      seen.set(q, ill.id);
    }
  }
  // Coverage: the visual question set is meaningful.
  const pstarVisual = [...seen.keys()].filter((k) => k.startsWith('pstar:')).length;
  const rocaVisual = [...seen.keys()].filter((k) => k.startsWith('roca:')).length;
  assert.ok(pstarVisual >= 60, `only ${pstarVisual} PSTAR questions are illustrated`);
  assert.ok(rocaVisual >= 40, `only ${rocaVisual} ROC-A questions are illustrated`);
});

test('spot-it targets sit inside the viewBox, do not overlap, and have exactly one correct answer', () => {
  let spots = 0;
  for (const ill of manifest.illustrations) {
    if (!ill.spot) continue;
    spots++;
    const xml = readFileSync(path.join(dir, ill.file), 'utf8');
    const m = xml.match(/viewBox="0 0 (\d+) (\d+)"/)!;
    const W = Number(m[1]);
    const H = Number(m[2]);
    assert.ok(ill.spot.prompt.trim().length > 10, `${ill.id}: spot prompt`);
    noDots(ill.spot.prompt, `${ill.id} spot`);
    assert.ok(ill.spot.targets.length >= 2, `${ill.id}: needs at least two targets`);
    assert.equal(ill.spot.targets.filter((t) => t.correct).length, 1, `${ill.id}: exactly one correct target`);
    for (const q of ill.spot.questions) assert.ok(questionExists(q), `${ill.id}: spot question ${q}`);
    const rects = ill.spot.targets.map((t) => t.rect);
    for (const t of ill.spot.targets) {
      const [x, y, w, h] = t.rect;
      assert.ok(t.label.trim().length > 0, `${ill.id}/${t.id}: label`);
      assert.ok(w >= 40 && h >= 30, `${ill.id}/${t.id}: target too small to tap`);
      assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= H, `${ill.id}/${t.id}: outside the viewBox`);
    }
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const [ax, ay, aw, ah] = rects[i];
        const [bx, by, bw, bh] = rects[j];
        const overlap = ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
        assert.ok(!overlap, `${ill.id}: targets ${ill.spot.targets[i].id} and ${ill.spot.targets[j].id} overlap`);
      }
  }
  assert.ok(spots >= 8, `only ${spots} spot-it diagrams`);
});

test('the TypeScript SVG bundle is in sync with the SVG files', async () => {
  const { bundleSource } = await import('../scripts/bundle_illustrations.mjs');
  const expected = bundleSource();
  const actual = readFileSync(path.join(root, 'src', 'illustrations', 'svg.generated.ts'), 'utf8');
  assert.equal(actual, expected, 'run: node scripts/bundle_illustrations.mjs');
});
