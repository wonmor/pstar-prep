// Shared Bauhaus primitives. Decoration is typographic only — glyphs set as
// text (● ■ ▲ → ✓ ✕) and thick rules. No drawn circles/squares/triangles.
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, fonts, glyph, rule, space, TOUCH, type, themed } from '../theme';

export type Tone = 'red' | 'blue' | 'yellow' | 'ink' | 'paper';
// Getters so tones always reflect the active theme.
export const toneColor: Record<Tone, string> = {
  get red() {
    return colors.red;
  },
  get blue() {
    return colors.blue;
  },
  get yellow() {
    return colors.yellow;
  },
  get ink() {
    return colors.ink;
  },
  get paper() {
    return colors.paper;
  },
};
// Text colour that passes AA on each tone.
export const onTone: Record<Tone, string> = {
  get red() {
    return colors.onAccent;
  },
  get blue() {
    return colors.onAccent;
  },
  get yellow() {
    return colors.onYellow;
  },
  get ink() {
    return colors.paper;
  },
  get paper() {
    return colors.ink;
  },
};

// A decorative glyph. Hidden from screen readers; never carries meaning alone.
export function Glyph({
  children,
  size = 24,
  color = colors.ink,
  style,
}: {
  children: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      accessible={false}
      importantForAccessibility="no"
      accessibilityElementsHidden
      aria-hidden
      maxFontSizeMultiplier={1.2}
      style={[{ fontFamily: fonts.black, fontSize: size, lineHeight: size * 1.05, color }, style]}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  tone = 'paper',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
}) {
  return <View style={[styles.card, { backgroundColor: toneColor[tone] }, style]}>{children}</View>;
}

export function Rule({
  weight = rule.thick,
  color = colors.ink,
  style,
}: {
  weight?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ height: weight, backgroundColor: color, alignSelf: 'stretch' }, style]} />;
}

export function Kicker({
  children,
  color = colors.ink,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[type.kicker, { color }, style]}>{children}</Text>;
}

// Screen header: oversized index numeral + heavy title, over a thick rule.
export function ScreenHeader({
  index,
  title,
  sub,
  accent = 'red',
  right,
}: {
  index: string;
  title: string;
  sub?: string;
  accent?: Tone;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <View style={styles.headRow}>
        <Glyph size={64} color={toneColor[accent]} style={styles.headIndex}>
          {index}
        </Glyph>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={type.h1}>
            {title}
          </Text>
        </View>
        {right}
      </View>
      <Rule />
      {sub ? <Text style={[type.mute, { marginTop: space.sm }]}>{sub}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  small,
  style,
  trailing,
  accessibilityLabel,
  testID,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'success' | 'danger' | 'dark' | 'red' | 'blue' | 'yellow';
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  trailing?: string; // glyph after the label, e.g. →
  accessibilityLabel?: string;
  testID?: string;
}) {
  const tone: Tone | null = {
    primary: 'ink',
    dark: 'ink',
    success: 'blue',
    blue: 'blue',
    danger: 'red',
    red: 'red',
    yellow: 'yellow',
    ghost: null,
  }[variant] as Tone | null;
  const bg = tone ? toneColor[tone] : 'transparent';
  const fg = tone ? onTone[tone] : colors.ink;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg },
        !tone && styles.btnGhost,
        disabled && { opacity: 0.4 },
        pressed && !disabled && (tone ? { opacity: 0.82 } : { backgroundColor: colors.paperDeep }),
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }, small && { fontSize: 14 }]}>{label}</Text>
      {trailing ? (
        <Glyph size={small ? 16 : 20} color={fg}>
          {trailing}
        </Glyph>
      ) : null}
    </Pressable>
  );
}

// Square label (no pill shape).
export function Pill({
  label,
  tone = 'paper',
}: {
  label: string;
  tone?: Tone | 'sky' | 'green' | 'amber' | 'navy';
}) {
  const t: Tone =
    ({ sky: 'paper', green: 'blue', amber: 'yellow', navy: 'ink' } as Record<string, Tone>)[tone] ??
    (tone as Tone);
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: toneColor[t], borderColor: t === 'paper' ? colors.ink : toneColor[t] },
      ]}
    >
      <Text style={[styles.pillText, { color: onTone[t] }]}>{label}</Text>
    </View>
  );
}

// "■ PRO" marker on locked content.
export function LockTag({ inverse }: { inverse?: boolean }) {
  return (
    <View
      style={[styles.lock, inverse && { backgroundColor: colors.paper }]}
      accessible
      accessibilityLabel="Locked, Pro only"
    >
      <Glyph size={11} color={inverse ? colors.red : colors.onAccent}>
        {glyph.lock}
      </Glyph>
      <Text style={[styles.lockText, inverse && { color: colors.red }]}>PRO</Text>
    </View>
  );
}

// Progress as a thick rule of variable length.
export function ProgressBar({ value, color = colors.ink }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={{ width: `${pct}%`, height: rule.thick, backgroundColor: color }} />
    </View>
  );
}

// An answer option. The marker is a glyph: its number, ✓ or ✕.
export function OptionRow({
  index,
  text,
  state,
  onPress,
  disabled,
  testID,
}: {
  index: number; // 0-based; rendered as 1…4
  text: string;
  state: 'idle' | 'selected' | 'correct' | 'wrong';
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const t = {
    idle: { bg: colors.paper, fg: colors.ink, mark: colors.ink, border: colors.ink },
    selected: { bg: colors.ink, fg: colors.paper, mark: colors.paper, border: colors.ink },
    correct: { bg: colors.blue, fg: colors.onAccent, mark: colors.onAccent, border: colors.blue },
    wrong: { bg: colors.red, fg: colors.onAccent, mark: colors.onAccent, border: colors.red },
  }[state];
  const mark = state === 'correct' ? glyph.check : state === 'wrong' ? glyph.close : `${index + 1}`;
  const a11yState =
    state === 'correct'
      ? ', correct answer'
      : state === 'wrong'
        ? ', your answer, incorrect'
        : state === 'selected'
          ? ', selected'
          : '';
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Option ${index + 1}: ${text}${a11yState}`}
      accessibilityState={{ selected: state === 'selected', disabled: !!disabled }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: t.bg, borderColor: t.border },
        pressed && !disabled && state === 'idle' && { backgroundColor: colors.paperDeep },
      ]}
    >
      <Glyph size={26} color={t.mark} style={styles.optMark}>
        {mark}
      </Glyph>
      <Text style={[styles.optionText, { color: t.fg }, state === 'correct' && { fontFamily: fonts.bold }]}>
        {text}
      </Text>
    </Pressable>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.ink} size="large" />
      {label ? <Text style={[type.mute, { marginTop: space.md }]}>{label}</Text> : null}
    </View>
  );
}

export function Divider() {
  return <Rule weight={rule.hair} style={{ marginVertical: space.md }} />;
}

// Top bar for full-screen flows (quiz, cards, paywall): ✕ · progress · action.
export function FlowBar({
  onClose,
  progress,
  right,
  closeLabel = 'Close',
}: {
  onClose: () => void;
  progress?: number;
  right?: React.ReactNode;
  closeLabel?: string;
}) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        style={styles.barBtn}
        hitSlop={6}
      >
        <Glyph size={24}>{glyph.close}</Glyph>
      </Pressable>
      <View style={{ flex: 1, paddingHorizontal: space.md }}>
        {progress != null ? <ProgressBar value={progress} /> : null}
      </View>
      {right ?? <View style={styles.barBtn} />}
    </View>
  );
}

export function IconButton({
  glyphText,
  onPress,
  label,
  color = colors.ink,
  size = 24,
}: {
  glyphText: string;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.barBtn}
      hitSlop={6}
    >
      <Glyph size={size} color={color}>
        {glyphText}
      </Glyph>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: {
      borderWidth: rule.mid,
      borderColor: colors.ink,
      padding: space.lg,
    },
    headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginBottom: space.sm },
    headIndex: { letterSpacing: -3, marginBottom: -6 },
    btn: {
      minHeight: 52,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
    },
    btnSmall: { minHeight: TOUCH, paddingVertical: 8, paddingHorizontal: 14 },
    btnGhost: { borderWidth: rule.mid, borderColor: colors.ink },
    btnText: {
      fontFamily: fonts.heavy,
      fontSize: 16,
      letterSpacing: 1,
      textTransform: 'uppercase',
      flexShrink: 1,
    },
    pill: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: rule.mid,
      alignSelf: 'flex-start',
    },
    pillText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
    lock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.red,
      paddingVertical: 2,
      paddingHorizontal: 6,
      alignSelf: 'flex-start',
    },
    lockText: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.5, color: colors.onAccent },
    track: { height: rule.thick, backgroundColor: colors.paperDeep, alignSelf: 'stretch' },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: rule.mid,
      minHeight: 56,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 14,
    },
    optMark: { width: 26, textAlign: 'center' },
    optionText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      borderBottomWidth: rule.thick,
      borderBottomColor: colors.ink,
    },
    barBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  }),
);
