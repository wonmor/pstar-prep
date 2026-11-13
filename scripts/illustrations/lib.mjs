// Shared drawing helpers for the illustration generator. Every diagram is
// hand-laid-out SVG written in the paper-and-ink palette only, so the app
// (and the SwiftUI client) can recolour it by substituting palette hex values.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');
export const MANIFEST_PATH = path.join(ROOT, 'assets', 'illustrations', 'manifest.json');
export const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

export const P = manifest.palette; // paper, paperDeep, card, line, lineStrong, ink, inkSoft, red, blue, yellow, green
export const FONT = manifest.fontFamily;

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const r1 = (n) => (Math.round(n * 10) / 10).toString();

export function svg({ w = 600, h = 360, title }, body) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">\n` +
    `<title>${esc(title)}</title>\n` +
    body.filter(Boolean).join('\n') +
    `\n</svg>\n`
  );
}

// Text. weight 700 prints bold, 500 regular; `anchor` start|middle|end.
export function t(x, y, s, o = {}) {
  const { size = 13, weight = 500, anchor = 'start', fill = P.ink, ls, upper } = o;
  const attrs = [
    `x="${r1(x)}"`,
    `y="${r1(y)}"`,
    `font-family="${FONT}"`,
    `font-size="${size}"`,
    `font-weight="${weight}"`,
    anchor !== 'start' ? `text-anchor="${anchor}"` : '',
    `fill="${fill}"`,
    ls ? `letter-spacing="${ls}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<text ${attrs}>${esc(upper ? String(s).toUpperCase() : s)}</text>`;
}

// Small uppercase label in the kicker style.
export function kicker(x, y, s, o = {}) {
  return t(x, y, s, { size: 10, weight: 700, ls: 1.5, fill: P.inkSoft, upper: true, ...o });
}

export function rect(x, y, w, h, o = {}) {
  const { fill = 'none', stroke = P.ink, sw = 1.5, r = 0, dash } = o;
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function line(x1, y1, x2, y2, o = {}) {
  const { stroke = P.ink, sw = 1.5, dash, cap = 'round' } = o;
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function pathD(d, o = {}) {
  const { fill = 'none', stroke = P.ink, sw = 1.5, dash, join = 'round', cap = 'round' } = o;
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="${join}" stroke-linecap="${cap}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function circle(cx, cy, r, o = {}) {
  const { fill = 'none', stroke = P.ink, sw = 1.5 } = o;
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

// Arrow head polygon at (x2,y2) pointing along (x1,y1)->(x2,y2).
function head(x1, y1, x2, y2, size, color) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = (ang, len) => `${r1(x2 - Math.cos(ang) * len)},${r1(y2 - Math.sin(ang) * len)}`;
  return `<polygon points="${r1(x2)},${r1(y2)} ${p(a - 0.45, size)} ${p(a + 0.45, size)}" fill="${color}"/>`;
}

export function arrow(x1, y1, x2, y2, o = {}) {
  const { stroke = P.ink, sw = 2, dash, size = 9 } = o;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const ex = x2 - Math.cos(a) * size * 0.6;
  const ey = y2 - Math.sin(a) * size * 0.6;
  return line(x1, y1, ex, ey, { stroke, sw, dash }) + head(x1, y1, x2, y2, size, stroke);
}

// Curved arrow along a quadratic path; the head follows the end tangent.
export function curve(x1, y1, cx, cy, x2, y2, o = {}) {
  const { stroke = P.ink, sw = 2, dash, size = 9 } = o;
  return (
    pathD(`M${r1(x1)} ${r1(y1)} Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`, { stroke, sw, dash }) +
    head(cx, cy, x2, y2, size, stroke)
  );
}

// Dimension line with ticks at both ends and a centred label.
export function dim(x1, y1, x2, y2, label, o = {}) {
  const { stroke = P.inkSoft, size = 11, offset = -6, fill = P.inkSoft } = o;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(a) * 5;
  const ny = Math.cos(a) * 5;
  const mx = (x1 + x2) / 2 + Math.sin(a) * offset;
  const my = (y1 + y2) / 2 - Math.cos(a) * offset;
  return [
    line(x1, y1, x2, y2, { stroke, sw: 1 }),
    line(x1 + nx, y1 + ny, x1 - nx, y1 - ny, { stroke, sw: 1 }),
    line(x2 + nx, y2 + ny, x2 - nx, y2 - ny, { stroke, sw: 1 }),
    label ? t(mx, my, label, { size, weight: 700, anchor: 'middle', fill }) : '',
  ].join('');
}

// Filled label box with centred text (a printed tag).
export function tag(x, y, w, h, s, o = {}) {
  const { fill = P.ink, fg = P.card, size = 12, weight = 700, stroke = fill, upper = true, r = 3 } = o;
  const lines = Array.isArray(s) ? s : [s];
  const lh = size * 1.25;
  const y0 = y + h / 2 - ((lines.length - 1) * lh) / 2 + size * 0.36;
  return [
    rect(x, y, w, h, { fill, stroke, sw: 1.5, r }),
    ...lines.map((l, i) => t(x + w / 2, y0 + i * lh, l, { size, weight, anchor: 'middle', fill: fg, upper, ls: upper ? 1 : 0 })),
  ].join('');
}

// Top-view aeroplane centred on (x,y), nose pointing up before rotation.
const PLANE = 'M0 -22 C3 -22 4.5 -16 4.5 -8 L4.5 -4 L26 6 L26 10 L4.5 6 L3.5 14 L10 19 L10 22 L0 20 L-10 22 L-10 19 L-3.5 14 L-4.5 6 L-26 10 L-26 6 L-4.5 -4 L-4.5 -8 C-4.5 -16 -3 -22 0 -22 Z';
export function plane(x, y, rot = 0, s = 1, fill = P.ink) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${s})"><path d="${PLANE}" fill="${fill}"/></g>`;
}

// Top-view glider (long thin wings).
const GLIDER = 'M0 -14 C2 -14 2.5 -8 2.5 -3 L40 1 L40 3.5 L2.5 2 L2 12 L7 15 L7 17 L0 16 L-7 17 L-7 15 L-2 12 L-2.5 2 L-40 3.5 L-40 1 L-2.5 -3 C-2.5 -8 -2 -14 0 -14 Z';
export function glider(x, y, rot = 0, s = 1, fill = P.ink) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${s})"><path d="${GLIDER}" fill="${fill}"/></g>`;
}

// Top-view helicopter.
export function heli(x, y, rot = 0, s = 1, fill = P.ink) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${s})">` +
    `<path d="M0 -12 C5 -12 7 -6 7 0 C7 6 5 10 2 10 L2 26 L5 26 L5 28 L-5 28 L-5 26 L-2 26 L-2 10 C-5 10 -7 6 -7 0 C-7 -6 -5 -12 0 -12 Z" fill="${fill}"/>` +
    `<line x1="-20" y1="-20" x2="20" y2="20" stroke="${fill}" stroke-width="2"/><line x1="20" y1="-20" x2="-20" y2="20" stroke="${fill}" stroke-width="2"/></g>`;
}

// Side-view hot-air balloon.
export function balloon(x, y, s = 1, fill = P.ink) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">` +
    `<path d="M0 -26 C14 -26 20 -14 20 -4 C20 6 10 12 4 18 L4 22 L-4 22 L-4 18 C-10 12 -20 6 -20 -4 C-20 -14 -14 -26 0 -26 Z" fill="${fill}"/>` +
    `<rect x="-5" y="24" width="10" height="7" fill="${fill}"/></g>`;
}

// Side-view airship.
export function airship(x, y, s = 1, fill = P.ink) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">` +
    `<path d="M-28 0 C-28 -9 -12 -12 4 -12 C18 -12 28 -6 28 0 C28 6 18 12 4 12 C-12 12 -28 9 -28 0 Z" fill="${fill}"/>` +
    `<path d="M-30 -10 L-20 -4 L-20 4 L-30 10 Z" fill="${fill}"/><rect x="-6" y="11" width="14" height="5" fill="${fill}"/></g>`;
}

// Side-view aeroplane, nose to the right; `flip` points it left.
const SIDE = 'M-22 0 L10 0 C16 0 20 -2 22 -4 L16 -7 L-6 -7 L-4 -3 L-14 -3 L-18 -14 L-22 -14 Z';
export function planeSide(x, y, s = 1, fill = P.ink, flip = false, rot = 0) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${flip ? -s : s} ${s})"><path d="${SIDE}" fill="${fill}"/><path d="M-6 -3 L4 -3 L8 1 L-2 1 Z" fill="${fill}"/></g>`;
}

// Cloud outline (lumpy top, flat base) with left edge x, base y, width w.
export function cloud(x, y, w, o = {}) {
  const { fill = P.card, stroke = P.inkSoft, sw = 1.5 } = o;
  const h = w * 0.32;
  const d =
    `M${r1(x)} ${r1(y)} ` +
    `C${r1(x - w * 0.05)} ${r1(y - h * 0.5)} ${r1(x + w * 0.12)} ${r1(y - h * 0.75)} ${r1(x + w * 0.22)} ${r1(y - h * 0.55)} ` +
    `C${r1(x + w * 0.28)} ${r1(y - h * 1.2)} ${r1(x + w * 0.5)} ${r1(y - h * 1.25)} ${r1(x + w * 0.56)} ${r1(y - h * 0.7)} ` +
    `C${r1(x + w * 0.7)} ${r1(y - h * 1.0)} ${r1(x + w * 0.9)} ${r1(y - h * 0.8)} ${r1(x + w * 0.86)} ${r1(y - h * 0.4)} ` +
    `C${r1(x + w * 1.02)} ${r1(y - h * 0.4)} ${r1(x + w * 1.04)} ${r1(y - h * 0.05)} ${r1(x + w)} ${r1(y)} Z`;
  return pathD(d, { fill, stroke, sw });
}

// Vortex spiral: a chain of small arcs trailing from (x,y) toward -x.
export function vortex(x, y, n = 4, s = 7, stroke = P.red) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const cx = x - i * s * 1.8;
    d += `M${r1(cx)} ${r1(y - s)} a${s} ${s} 0 1 0 0 ${s * 2} a${s * 0.6} ${s * 0.6} 0 1 0 0 ${-s * 1.2} `;
  }
  return pathD(d, { stroke, sw: 1.5 });
}

// Hatch fill pattern definition; reference with fill="url(#<id>)".
export function hatch(id, color = P.lineStrong, gap = 6) {
  return `<defs><pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="1"/></pattern></defs>`;
}

// Signal lamp: a lens with optional flash rays.
export function lamp(cx, cy, r, color, flashing = false) {
  const parts = [circle(cx, cy, r, { fill: color, stroke: P.ink, sw: 1.5 })];
  if (flashing) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      parts.push(line(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4), cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9), { stroke: P.ink, sw: 1.5 }));
    }
  }
  return parts.join('');
}

// Small "not to scale" footnote.
export function note(x, y, s, o = {}) {
  return t(x, y, s, { size: 11, fill: P.inkSoft, ...o });
}
