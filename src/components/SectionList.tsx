import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useProgress } from '../storage';
import { colors, fonts, rule, space, themed } from '../theme';
import { Glyph, LockTag, ProgressBar } from './ui';

// The active exam's sections as a ruled index: big numeral · name · mastery.
// Locked sections (free tier) show ■ PRO and open the paywall instead.
export function SectionList({
  onPick,
  onLocked,
}: {
  onPick: (sectionId: number) => void;
  onLocked: (sectionId: number) => void;
}) {
  const p = useProgress();
  const { SECTIONS, questionsForSection } = useExam();
  const gate = useGate();
  return (
    <View style={styles.list}>
      {SECTIONS.map((s) => {
        const qs = questionsForSection(s.id);
        const total = qs.length;
        const correct = qs.filter((q) => p.stats[q.id]?.lastCorrect).length;
        const pct = total ? correct / total : 0;
        const open = gate.canSection(s.id);
        const num = String(s.id).padStart(2, '0');
        return (
          <Pressable
            key={s.id}
            onPress={() => (open ? onPick(s.id) : onLocked(s.id))}
            accessibilityRole="button"
            accessibilityLabel={`Section ${s.id}, ${s.name}, ${total} questions, ${Math.round(pct * 100)} percent${open ? '' : ', locked, Pro only'}`}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paperDeep }]}
          >
            <Glyph
              size={30}
              color={open ? (pct >= 0.9 ? colors.blue : colors.ink) : colors.inkSoft}
              style={styles.num}
            >
              {num}
            </Glyph>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.name, !open && { color: colors.inkSoft }]}>{s.name}</Text>
              {open ? <ProgressBar value={pct} color={pct >= 0.9 ? colors.blue : colors.red} /> : <LockTag />}
            </View>
            <View style={styles.meta}>
              <Text style={styles.metaPct}>{open ? (total ? `${Math.round(pct * 100)}%` : '—') : ''}</Text>
              <Text style={styles.metaCount}>{total} Q</Text>
            </View>
            <Glyph size={18} color={open ? colors.ink : colors.inkSoft}>
              {open ? '→' : '■'}
            </Glyph>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    list: { borderTopWidth: rule.thick, borderTopColor: colors.ink },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 64,
      paddingVertical: space.md,
      paddingRight: space.xs,
      gap: space.md,
      borderBottomWidth: rule.hair,
      borderBottomColor: colors.ink,
    },
    num: { width: 46, letterSpacing: -1 },
    name: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.ink },
    meta: { alignItems: 'flex-end', minWidth: 40 },
    metaPct: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
    metaCount: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkSoft },
  }),
);
