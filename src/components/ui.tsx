// Shared presentational components.
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, radius, shadow, space } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'success' | 'danger' | 'dark';
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const bg = {
    primary: colors.blueBright,
    success: colors.green,
    danger: colors.red,
    dark: colors.navy,
    ghost: 'transparent',
  }[variant];
  const fg = variant === 'ghost' ? colors.blue : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg },
        variant === 'ghost' && styles.btnGhost,
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }, small && { fontSize: 14 }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  label,
  tone = 'sky',
}: {
  label: string;
  tone?: 'sky' | 'green' | 'amber' | 'red' | 'navy';
}) {
  const map = {
    sky: [colors.sky, colors.blue],
    green: [colors.greenSoft, colors.green],
    amber: [colors.amberSoft, colors.amber],
    red: [colors.redSoft, colors.red],
    navy: [colors.navy, colors.white],
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map[0] }]}>
      <Text style={[styles.pillText, { color: map[1] }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%` }]} />
    </View>
  );
}

// An answer option row. `state` controls the leading circle + tint.
export function OptionRow({
  index,
  text,
  state,
  onPress,
  disabled,
}: {
  index: number; // 0-based; rendered as (1)…(4)
  text: string;
  state: 'idle' | 'selected' | 'correct' | 'wrong';
  onPress?: () => void;
  disabled?: boolean;
}) {
  const tint = {
    idle: { bg: colors.card, border: colors.border, ring: colors.skyLine, label: colors.textMute },
    selected: { bg: colors.sky, border: colors.blueBright, ring: colors.blueBright, label: colors.blue },
    correct: { bg: colors.greenSoft, border: colors.green, ring: colors.green, label: colors.green },
    wrong: { bg: colors.redSoft, border: colors.red, ring: colors.red, label: colors.red },
  }[state];
  const mark = state === 'correct' ? '✓' : state === 'wrong' ? '✕' : `${index + 1}`;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: tint.bg, borderColor: tint.border },
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            borderColor: tint.ring,
            backgroundColor:
              state === 'correct' ? colors.green : state === 'wrong' ? colors.red : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.circleText,
            { color: state === 'correct' || state === 'wrong' ? colors.white : tint.label },
          ]}
        >
          {mark}
        </Text>
      </View>
      <Text style={[styles.optionText, state === 'correct' && { fontWeight: '700' }]}>{text}</Text>
    </Pressable>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.blue} size="large" />
      {label ? <Text style={[font.mute, { marginTop: space.md }]}>{label}</Text> : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { paddingVertical: 10, paddingHorizontal: 16 },
  btnGhost: { borderWidth: 1.5, borderColor: colors.skyLine },
  btnText: { fontSize: 16, fontWeight: '700' },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  track: { height: 8, borderRadius: 99, backgroundColor: colors.skyLine, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 99, backgroundColor: colors.blueBright },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 13,
    gap: 12,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text, lineHeight: 21 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
});
