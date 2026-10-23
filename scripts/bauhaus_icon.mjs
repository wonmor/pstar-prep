// Bauhaus app-icon generator. Keeps the original top-view aircraft glyph
// (same paths, same -18° heading) and rebuilds the field around it with
// flat primary colour blocks and thick black rules on a strict 8×8 grid.
//   node scripts/bauhaus_icon.mjs variants   → ~/Desktop/PSTAR-bauhaus/*.png + icon-variants.png
//   node scripts/bauhaus_icon.mjs            → writes assets/* from the chosen variant
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = { red: '#D7261E', yellow: '#F2B705', blue: '#1F4FBF', paper: '#F4F1EA', ink: '#141414' };

// The original glyph's silhouette, unchanged (see scripts/make_icons.sh).
const PATHS = [
  'M470,430 L150,648 Q138,656 150,690 L470,560 L554,560 L874,690 Q886,656 874,648 L554,430 Z',
  'M470,724 L356,800 Q348,806 360,828 L470,792 L554,792 L664,828 Q676,806 668,800 L554,724 Z',
  'M512,176 Q556,176 556,250 L556,800 Q556,872 512,872 Q468,872 468,800 L468,250 Q468,176 512,176 Z',
  'M512,792 L486,872 L538,872 Z',
];
// The tiny fin-hint triangle (PATHS[3]) only notches the tail outline, so the line glyph uses the first three.
const paths = PATHS.slice(0, 3).map((d) => `<path d="${d}"/>`).join('');
// Line glyph: the outer contour of the silhouette only, no fill. A mask of
// (silhouette stroked at 2w, white) minus (silhouette filled, black) leaves a
// w-wide outline with round joins and a genuinely transparent interior, and no
// seams where the wing / fuselage / tail parts overlap.
const STROKE = 40; // px at 1024 — ≈2.3 px at 60 pt, ≈1.6 px at 40 pt
let maskN = 0;
const placed = (fill, s = 1, dx = 0, dy = 0, w = STROKE) => {
  const id = `m${maskN++}`;
  const t = `translate(${512 + dx},${512 + dy}) scale(${s}) rotate(-18) translate(-512,-512)`;
  const lw = (2 * w) / s;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024"><g transform="${t}">
    <g fill="white" stroke="white" stroke-width="${lw}" stroke-linejoin="round">${paths}</g>
    <g fill="black">${paths}</g></g></mask>
  <rect width="1024" height="1024" fill="${fill}" mask="url(#${id})"/>`;
};
const r = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;

// Grid unit = 128 px. Rules are 32 px (¼ unit) black.
const variants = {
  // A — paper ground, red column + blue/yellow foot, black glyph.
  paper: {
    bg: C.paper, glyph: C.ink, s: 0.74, dx: 104, dy: -100,
    fields: () =>
      r(0, 0, 256, 1024, C.red) + r(768, 768, 256, 256, C.blue) + r(256, 768, 512, 256, C.yellow) +
      r(256, 0, 32, 1024, C.ink) + r(256, 752, 768, 32, C.ink) + r(752, 752, 32, 272, C.ink),
  },
  // B — black ground, red band across the top, off-white glyph.
  black: {
    bg: C.ink, glyph: C.paper, s: 0.78, dx: -24, dy: 64,
    fields: () =>
      r(0, 0, 1024, 192, C.red) + r(0, 192, 1024, 32, C.paper) + r(896, 224, 128, 800, C.blue) +
      r(0, 896, 256, 128, C.yellow),
  },
  // C — blue field, yellow + red foot split by black rules, off-white glyph.
  // Chosen by the user (2026-10-23).
  blue: {
    bg: C.blue, glyph: C.paper, s: 0.74, dx: 0, dy: -84,
    fields: () =>
      r(0, 800, 640, 224, C.yellow) + r(640, 800, 384, 224, C.red) +
      r(0, 768, 1024, 32, C.ink) + r(640, 768, 32, 256, C.ink),
    // Android launchers crop the adaptive layers to the middle ~66%, so the
    // foot bands start higher to stay visible in the mask.
    adaptiveFields: () =>
      r(0, 728, 600, 296, C.yellow) + r(600, 728, 424, 296, C.red) +
      r(0, 704, 1024, 24, C.ink) + r(600, 704, 24, 320, C.ink),
  },
};

const tmp = mkdtempSync(join(tmpdir(), 'pstar-icon-'));
function render(name, body, size, out) {
  const p = join(tmp, `${name}.svg`);
  writeFileSync(p, svg(body));
  mkdirSync(dirname(out), { recursive: true });
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), p, '-o', out]);
}
const full = (v) => r(0, 0, 1024, 1024, v.bg) + v.fields() + placed(v.glyph, v.s, v.dx, v.dy);
const opaque = (f, bg) => execFileSync('magick', [f, '-background', bg, '-alpha', 'remove', '-alpha', 'off', 'PNG24:' + f]);

if (process.argv[2] === 'variants') {
  const dir = join(homedir(), 'Desktop', 'PSTAR-bauhaus');
  const files = Object.entries(variants).map(([k, v]) => {
    const f = join(dir, `variant-${k}.png`);
    render(k, full(v), 1024, f);
    return f;
  });
  // Side-by-side sheet with an iOS-style mask preview of each.
  const masked = files.map((f) => {
    const m = f.replace('.png', '-masked.png');
    execFileSync('magick', [f, '-resize', '600x600', '-alpha', 'set', '(', '-size', '600x600', 'xc:none', '-fill', 'white',
      '-draw', 'roundrectangle 0,0 599,599 135,135', ')', '-compose', 'DstIn', '-composite', m]);
    return m;
  });
  const cols = masked.map((m, i) => {
    const col = m.replace('-masked.png', '-col.png');
    const s60 = m.replace('-masked.png', '-60.png'), s40 = m.replace('-masked.png', '-40.png');
    execFileSync('magick', [m, '-resize', '60x60', s60]);
    execFileSync('magick', [m, '-resize', '40x40', s40]);
    execFileSync('magick', ['-background', '#DDD8CC', '(', m, '-gravity', 'center', '-extent', '680x660', ')',
      '(', s60, '-bordercolor', '#DDD8CC', '-border', '20', s40, '-border', '30', '+append', '-gravity', 'center', '-extent', '680x110', ')',
      '-append', col]);
    return col;
  });
  execFileSync('magick', [...cols, '-background', '#DDD8CC', '+append', join(dir, 'icon-variants.png')]);
  console.log('wrote', join(dir, 'icon-variants.png'));
} else {
  const pick = process.argv[2] || 'blue';
  const v = variants[pick];
  const A = join(ROOT, 'assets');
  render('icon', full(v), 1024, join(A, 'icon.png'));
  render('icon512', full(v), 512, join(A, 'icon-512.png'));
  render('fav', full(v), 196, join(A, 'favicon.png'));
  opaque(join(A, 'icon.png'), v.bg); opaque(join(A, 'icon-512.png'), v.bg); opaque(join(A, 'favicon.png'), v.bg);
  // Android adaptive: background = the colour fields, foreground = glyph inside the 66% safe zone.
  render('bg', r(0, 0, 1024, 1024, v.bg) + (v.adaptiveFields || v.fields)(), 1024, join(A, 'android-icon-background.png'));
  render('fg', placed(v.glyph, v.s * 0.66, v.dx * 0.66, v.dy * 0.66, STROKE * 0.66), 1024, join(A, 'android-icon-foreground.png'));
  render('mono', placed('#FFFFFF', v.s * 0.66, v.dx * 0.66, v.dy * 0.66, STROKE * 0.66), 1024, join(A, 'android-icon-monochrome.png'));
  // Splash: off-white glyph on the black splash ground (app.json), matching the default Black theme.
  render('splash', placed(C.paper, 0.8), 1024, join(A, 'splash-icon.png'));
  // In-app brand mark (Home header): the full icon, small.
  render('mark', full(v), 256, join(A, 'brand-mark.png'));
  opaque(join(A, 'brand-mark.png'), v.bg);
  console.log('assets written for variant', pick);
}
