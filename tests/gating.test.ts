// Unit tests for the free-vs-Pro rules. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FREE_MOCKS_PER_DAY,
  FREE_SECTION_COUNT,
  accessibleQuestions,
  canAccessQuestion,
  canAccessSection,
  canStartMock,
  dayKey,
  freeSectionIds,
  lockedSectionCount,
  logMockStart,
  mocksRemaining,
  resolveIsPro,
  routeAllowed,
} from '../src/gating.ts';

type DS = { sections: { id: number; name: string }[]; questions: { id: string; section: number }[] };
const load = (f: string): DS =>
  JSON.parse(readFileSync(new URL(`../assets/data/${f}`, import.meta.url), 'utf8'));
const pstar = load('pstar.json');
const roca = load('roca.json');

test('datasets are intact (185 PSTAR questions, 14 sections)', () => {
  assert.equal(pstar.questions.length, 185);
  assert.equal(pstar.sections.length, 14);
  assert.ok(roca.questions.length > 0);
});

test('free tier = first 3 sections of each exam, in display order', () => {
  assert.equal(FREE_SECTION_COUNT, 3);
  assert.deepEqual([...freeSectionIds(pstar.sections)], [1, 2, 3]);
  assert.deepEqual([...freeSectionIds(roca.sections)], [1, 2, 3]);
  // order follows the array, not the numeric id
  assert.deepEqual([...freeSectionIds([{ id: 9 }, { id: 4 }, { id: 7 }, { id: 1 }])], [9, 4, 7]);
});

test('section access: free users locked out of section 4+, Pro sees all', () => {
  for (const s of pstar.sections) {
    assert.equal(canAccessSection(false, pstar.sections, s.id), s.id <= 3, `section ${s.id}`);
    assert.equal(canAccessSection(true, pstar.sections, s.id), true);
  }
});

test('free sample is meaningful but partial (~25% of PSTAR)', () => {
  const free = accessibleQuestions(false, pstar.sections, pstar.questions);
  assert.equal(free.length, 10 + 8 + 29); // Collision Avoidance, Visual Signals, Communications
  assert.ok(free.every((q) => canAccessQuestion(false, pstar.sections, q)));
  assert.equal(accessibleQuestions(true, pstar.sections, pstar.questions).length, 185);
});

test('locked section count', () => {
  assert.equal(lockedSectionCount(false, pstar.sections), 11);
  assert.equal(lockedSectionCount(true, pstar.sections), 0);
  assert.equal(lockedSectionCount(false, [{ id: 1 }]), 0);
});

test('daily mock quota: 1 per local day for free, unlimited for Pro', () => {
  assert.equal(FREE_MOCKS_PER_DAY, 1);
  const today = '2026-10-20';
  assert.equal(mocksRemaining(false, [], today), 1);
  assert.equal(canStartMock(false, [], today), true);
  const used = logMockStart([], today);
  assert.equal(canStartMock(false, used, today), false);
  assert.equal(mocksRemaining(false, used, today), 0);
  assert.equal(canStartMock(false, used, '2026-10-21'), true, 'resets next day');
  assert.equal(canStartMock(true, [today, today, today], today), true);
  assert.equal(mocksRemaining(true, [], today), Infinity);
});

test('mock log is bounded', () => {
  let log: string[] = [];
  for (let i = 0; i < 40; i++) log = logMockStart(log, `2026-01-${String((i % 28) + 1).padStart(2, '0')}`);
  assert.equal(log.length, 14);
});

test('dayKey uses local calendar date', () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(dayKey(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
});

test('route guard blocks locked section quizzes/cards only', () => {
  const S = pstar.sections;
  assert.equal(routeAllowed(false, S, { name: 'quiz', scope: 2 }), true);
  assert.equal(routeAllowed(false, S, { name: 'quiz', scope: 7 }), false);
  assert.equal(routeAllowed(false, S, { name: 'cards', scope: 12 }), false);
  assert.equal(routeAllowed(false, S, { name: 'cards', scope: 'all' }), true);
  assert.equal(routeAllowed(false, S, { name: 'quiz', scope: 'exam' }), true);
  assert.equal(routeAllowed(false, S, { name: 'home' }), true);
  assert.equal(routeAllowed(true, S, { name: 'quiz', scope: 7 }), true);
});

test('tier resolution: native follows entitlement, web is free-for-all, overrides work', () => {
  assert.equal(resolveIsPro({ platform: 'ios', entitled: false }), false);
  assert.equal(resolveIsPro({ platform: 'android', entitled: true }), true);
  assert.equal(resolveIsPro({ platform: 'web', entitled: false }), true);
  assert.equal(resolveIsPro({ platform: 'web', entitled: false, queryTier: 'free' }), false);
  assert.equal(resolveIsPro({ platform: 'ios', entitled: false, forcePro: true }), true);
  assert.equal(resolveIsPro({ platform: 'web', entitled: false, queryTier: 'pro' }), true);
});
