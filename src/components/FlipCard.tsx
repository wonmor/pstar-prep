// A card that turns over: front and back faces on a Y-axis flip with
// perspective. With Reduce Motion on, the faces swap instantly.
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { dur, useReducedMotion } from '../motion';

export function FlipCard({
  flipped,
  front,
  back,
  style,
}: {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(flipped ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: flipped ? 1 : 0,
      duration: dur(420, reduced),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [flipped, reduced, anim]);

  if (reduced) {
    // No rotation at all: just show the right face.
    return <View style={[styles.root, style]}>{flipped ? back : front}</View>;
  }

  const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  // Fade each face out past 90 degrees as a fallback where backfaceVisibility
  // is not honoured (some web engines on nested transforms).
  const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = anim.interpolate({ inputRange: [0, 0.4999, 0.5, 1], outputRange: [0, 0, 1, 1] });
  return (
    <View style={[styles.root, style]}>
      <Animated.View
        style={[styles.face, { opacity: frontOpacity, transform: [{ perspective: 1200 }, { rotateY: frontRot }] }]}
        pointerEvents={flipped ? 'none' : 'auto'}
      >
        {front}
      </Animated.View>
      <Animated.View
        style={[styles.face, styles.back, { opacity: backOpacity, transform: [{ perspective: 1200 }, { rotateY: backRot }] }]}
        pointerEvents={flipped ? 'auto' : 'none'}
      >
        {back}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backfaceVisibility: 'hidden' },
  back: {},
});
