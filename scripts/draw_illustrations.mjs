#!/usr/bin/env node
// Regenerates every SVG under assets/illustrations from the drawing modules in
// scripts/illustrations/. The SVG files are committed: they are the shared,
// platform-neutral assets (the SwiftUI app reads the same folder). After
// running this, run `node scripts/bundle_illustrations.mjs` to refresh the
// TypeScript bundle the React Native app imports.
//
//   node scripts/draw_illustrations.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT, manifest } from './illustrations/lib.mjs';
import * as a from './illustrations/pstar-a.mjs';
import * as b from './illustrations/pstar-b.mjs';
import * as c from './illustrations/roca.mjs';

const drawings = { ...a, ...b, ...c };
const outDir = path.join(ROOT, 'assets', 'illustrations');
mkdirSync(outDir, { recursive: true });

let n = 0;
for (const ill of manifest.illustrations) {
  const key = ill.id.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
  const draw = drawings[key];
  if (typeof draw !== 'function') {
    console.error(`no drawing for ${ill.id} (expected export ${key})`);
    process.exitCode = 1;
    continue;
  }
  const xml = draw(ill);
  writeFileSync(path.join(outDir, ill.file), xml);
  n++;
}
console.log(`wrote ${n} illustrations to ${outDir}`);
