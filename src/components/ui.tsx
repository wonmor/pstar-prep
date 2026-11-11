// Shared paper-and-ink primitives. Surfaces are printed cards on the sheet,
// structure comes from faint ruled lines; icons are iOS-style line glyphs
// (Ionicons). No circles, squares or triangles as ornaments.
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { cardSurface, colors, fonts, glyph, type GlyphName, radius, rule, space, TOUCH, type, themed } from '../theme';

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
    return colors.card;
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

// A line glyph. Hidden from screen readers; never carries meaning alone.
export function Icon({
  name,
  size = 24,
  color = colors.ink,
  style,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      style={style}
      accessible={false}
      importantForAccessibility="no"
      accessibilityElementsHidden
      aria-hidden
    />
  );
}

// Oversized typographic numerals / letters (section index, option number).
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
      style={[{ fontFamily: fonts.black, fontSize: size, lineHeight: Math.round(size * 1.2), color }, style]}
    >
      {children}
    </Text>
  );
}

// A printed card. `tone="paper"` (default) is the card surface; an accent tone
// prints the card in that ink.
export function Card({
  children,
  style,
  tone = 'paper',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
}) {
  return (
    <View
      style={[
        styles.card,
        tone !== 'paper' && { backgroundColor: toneColor[tone], borderColor: toneColor[tone], borderBottomColor: toneColor[tone] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// A ruled line. Defaults to the faint printed rule; pass `color={colors.ink}` for emphasis.
export function Rule({
  weight = rule.thick,
  color = colors.line,
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
  color = colors.inkSoft,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[type.kicker, { color }, style]}>{children}</Text>;
}

// Screen header: oversized index numeral + heavy title, over an ink rule.
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
      <Rule color={colors.ink} />
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
  trailing?: GlyphName; // line glyph after the label, e.g. glyph.arrow
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
  const bg = tone ? toneColor[tone] : colors.card;
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
        <Icon name={trailing} size={small ? 18 : 22} color={fg} />
      ) : null}
    </Pressable>
  );
}

// Small printed label (a stamp, not a pill).
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
        { backgroundColor: toneColor[t], borderColor: t === 'paper' ? colors.lineStrong : toneColor[t] },
      ]}
    >
      <Text style={[styles.pillText, { color: onTone[t] }]}>{label}</Text>
    </View>
  );
}

// Lock + "PRO" marker on locked content.
export function LockTag({ inverse }: { inverse?: boolean }) {
  return (
    <View
      style={[styles.lock, inverse && { backgroundColor: colors.card }]}
      accessible
      accessibilityLabel="Locked, Pro only"
    >
      <Icon name={glyph.lock} size={11} color={inverse ? colors.red : colors.onAccent} />
      <Text style={[styles.lockText, inverse && { color: colors.red }]}>PRO</Text>
    </View>
  );
}

// Progress as a printed bar: faint track, inked fill.
export function ProgressBar({ value, color = colors.ink }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

// An answer option: a printed card. The marker is its number, or a check /
// cross line glyph.
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
    idle: { bg: colors.card, fg: colors.ink, mark: colors.inkSoft, border: colors.line, bottom: colors.lineStrong },
    selected: { bg: colors.card, fg: colors.ink, mark: colors.blue, border: colors.ink, bottom: colors.ink },
    correct: { bg: colors.blue, fg: colors.onAccent, mark: colors.onAccent, border: colors.blue, bottom: colors.blue },
    wrong: { bg: colors.red, fg: colors.onAccent, mark: colors.onAccent, border: colors.red, bottom: colors.red },
  }[state];
  const mark: GlyphName | null = state === 'correct' ? glyph.check : state === 'wrong' ? glyph.close : null;
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
        { backgroundColor: t.bg, borderColor: t.border, borderBottomColor: t.bottom },
        state === 'selected' && { borderWidth: rule.thick },
        pressed && !disabled && state === 'idle' && { backgroundColor: colors.paperDeep },
      ]}
    >
      {mark ? (
        <Icon name={mark} size={26} color={t.mark} style={styles.optMark} />
      ) : (
        <Glyph size={24} color={t.mark} style={styles.optMark}>
          {`${index + 1}`}
        </Glyph>
      )}
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

// Top bar for full-screen flows (quiz, cards, paywall): close, progress, action.
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
        <Icon name={glyph.close} size={28} />
      </Pressable>
      <View style={{ flex: 1, paddingHorizontal: space.md }}>
        {progress != null ? <ProgressBar value={progress} /> : null}
      </View>
      {right ?? <View style={styles.barBtn} />}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.ink,
  size = 24,
}: {
  icon: GlyphName;
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
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: {
      ...cardSurface(),
      padding: space.lg,
    },
    headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginBottom: space.sm },
    headIndex: { letterSpacing: -3, marginBottom: -12 },
    btn: {
      minHeight: 52,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      borderRadius: radius,
    },
    btnSmall: { minHeight: TOUCH, paddingVertical: 8, paddingHorizontal: 14 },
    btnGhost: {
      borderWidth: rule.hair,
      borderColor: colors.lineStrong,
      borderBottomWidth: rule.thick,
      borderBottomColor: colors.lineStrong,
    },
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
      borderWidth: rule.hair,
      borderRadius: 3,
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
      borderRadius: 3,
      alignSelf: 'flex-start',
    },
    lockText: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.5, color: colors.onAccent },
    track: { height: 6, backgroundColor: colors.paperDeep, alignSelf: 'stretch', borderRadius: 2 },
    option: {
      ...cardSurface(),
      flexDirection: 'row',
      alignItems: 'center',
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
      borderBottomWidth: rule.hair,
      borderBottomColor: colors.line,
    },
    barBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  }),
);
