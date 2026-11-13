// Printed progress ring: a faint track with an inked arc, drawn with
// react-native-svg so it is identical on iOS, Android and web. The arc
// animates to its value unless Reduce Motion is on.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { dur, useReducedMotion } from '../motion';
import { colors, fonts, themed } from '../theme';

export function Ring({
  value, // 0..1
  size = 96,
  stroke = 10,
  color = colors.ink,
  track = colors.paperDeep,
  label,
  sub,
  style,
  accessibilityLabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const reduced = useReducedMotion();
  const target = Math.max(0, Math.min(1, value));
  const anim = useRef(new Animated.Value(reduced ? target : 0)).current;
  const [shown, setShown] = useState(reduced ? target : 0);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(v));
    Animated.timing(anim, {
      toValue: target,
      duration: dur(700, reduced),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [target, reduced, anim]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * shown;
  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${label ?? ''} ${Math.round(target * 100)} percent`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="butt"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {label ? (
        <Text style={[styles.label, { fontSize: Math.round(size * 0.26), lineHeight: Math.round(size * 0.3) }]} maxFontSizeMultiplier={1.1}>
          {label}
        </Text>
      ) : null}
      {sub ? <Text style={[styles.sub, { fontSize: Math.max(9, Math.round(size * 0.1)) }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    label: { fontFamily: fonts.black, color: colors.ink, letterSpacing: -1 },
    sub: { fontFamily: fonts.bold, color: colors.inkSoft, letterSpacing: 1, textTransform: 'uppercase' },
  }),
);
