import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { cardSurface, colors, fonts, glyph, space, themed } from '../theme';
import { Icon } from './ui';

// Upsell card shown to free users: a printed card with an ochre stamp.
// Tapping opens the paywall.
export function ProBanner({ style, reason = 'banner' }: { style?: any; reason?: string }) {
  const nav = useNav();
  const gate = useGate();
  const { SECTIONS } = useExam();
  if (gate.isPro) return null;
  return (
    <Pressable
      testID="pro-banner"
      onPress={() => nav.push({ name: 'paywall', reason })}
      accessibilityRole="button"
      accessibilityLabel={`Unlock Pro: all ${SECTIONS.length} sections and unlimited mock exams`}
      style={({ pressed }) => [styles.wrap, pressed && { backgroundColor: colors.paperDeep }, style]}
    >
      <View style={styles.stamp}>
        <Icon name={glyph.unlock} size={14} color={colors.onYellow} />
        <Text style={styles.stampText}>PRO</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Unlock {gate.lockedCount} more sections & unlimited mock exams</Text>
        <Text style={styles.sub}>One payment | PSTAR + ROC-A | yours forever</Text>
      </View>
      <Icon name={glyph.arrow} size={28} color={colors.ink} />
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: {
      ...cardSurface(),
      borderColor: colors.yellow,
      borderBottomColor: colors.yellow,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.lg,
    },
    stamp: {
      backgroundColor: colors.yellow,
      borderRadius: 3,
      paddingHorizontal: 8,
      paddingVertical: 6,
      alignItems: 'center',
      gap: 2,
    },
    stampText: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 2, color: colors.onYellow },
    title: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 21, color: colors.ink },
    sub: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkSoft, marginTop: 4 },
  }),
);
