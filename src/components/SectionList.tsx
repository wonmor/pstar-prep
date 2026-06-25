import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SECTIONS, countForSection } from '../data';
import { useProgress } from '../storage';
import { colors, radius, space } from '../theme';

// A tappable list of the 14 PSTAR sections, each showing question count + mastery.
export function SectionList({ onPick }: { onPick: (sectionId: number) => void }) {
  const p = useProgress();
  return (
    <View style={{ gap: 10 }}>
      {SECTIONS.map((s) => {
        const total = countForSection(s.id);
        const ids = Array.from({ length: total }, (_, i) => `${s.id}.${String(i + 1).padStart(2, '0')}`);
        const correct = ids.filter((id) => p.stats[id]?.lastCorrect).length;
        const pct = total ? correct / total : 0;
        return (
          <Pressable
            key={s.id}
            onPress={() => onPick(s.id)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.num}>
              <Text style={styles.numText}>{s.id}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${pct * 100}%`, backgroundColor: pct >= 0.9 ? colors.green : colors.blueBright },
                  ]}
                />
              </View>
            </View>
            <View style={styles.meta}>
              <Text style={styles.metaCount}>{total} Qs</Text>
              <Text style={styles.metaPct}>{total ? `${Math.round(pct * 100)}%` : '—'}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  num: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.blue, fontWeight: '800', fontSize: 15 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  barTrack: {
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.skyLine,
    marginTop: 7,
    overflow: 'hidden',
  },
  barFill: { height: 5, borderRadius: 99 },
  meta: { alignItems: 'flex-end', minWidth: 44 },
  metaCount: { fontSize: 11, color: colors.textFaint, fontWeight: '600' },
  metaPct: { fontSize: 14, color: colors.navy, fontWeight: '800', marginTop: 2 },
});
