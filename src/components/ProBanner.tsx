import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { colors, fonts, glyph, rule, space, themed } from '../theme';
import { Glyph } from './ui';

// Yellow upsell block shown to free users. Tapping opens the paywall.
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
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.85 }, style]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{glyph.square} PRO</Text>
        <Text style={styles.title}>Unlock {gate.lockedCount} more sections & unlimited mock exams</Text>
        <Text style={styles.sub}>One payment · PSTAR + ROC-A · yours forever</Text>
      </View>
      <Glyph size={34} color={colors.onYellow}>
        {glyph.arrow}
      </Glyph>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: colors.yellow,
      borderWidth: rule.thick,
      borderColor: colors.ink,
      padding: space.lg,
    },
    kicker: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3, color: colors.onYellow },
    title: { fontFamily: fonts.heavy, fontSize: 19, lineHeight: 23, color: colors.onYellow, marginTop: 4 },
    sub: { fontFamily: fonts.medium, fontSize: 13, color: colors.onYellow, marginTop: 4 },
  }),
);
