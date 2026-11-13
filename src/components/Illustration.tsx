// A printed diagram on the page: the SVG from the shared catalogue, drawn in
// the current palette, with its alt text for screen readers and an optional
// caption underneath. Scales to the width it is given.
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { themedSvg, type Illustration as Ill } from '../illustrations';
import { useThemeMode } from '../themeMode';
import { cardSurface, colors, fonts, space, themed } from '../theme';

export function Illustration({
  ill,
  caption = true,
  style,
  maxHeight,
  children,
  testID,
}: {
  ill: Ill;
  caption?: boolean | string;
  style?: StyleProp<ViewStyle>;
  maxHeight?: number;
  children?: React.ReactNode; // overlays (spot-it targets), positioned over the drawing
  testID?: string;
}) {
  const [width, setWidth] = useState(0);
  // Re-render after a theme switch so the palette swap applies.
  useThemeMode();
  const xml = themedSvg(ill.id);
  if (!xml) return null;
  const ratio = ill.height / ill.width;
  let drawW = width;
  let drawH = Math.round(width * ratio);
  if (maxHeight && drawH > maxHeight) {
    drawH = maxHeight;
    drawW = Math.round(maxHeight / ratio);
  }
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };
  const cap = typeof caption === 'string' ? caption : caption ? ill.caption : null;
  return (
    <View style={[styles.wrap, style]} testID={testID ?? `illustration-${ill.id}`}>
      <View
        style={styles.sheet}
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Diagram: ${ill.title}. ${ill.alt}`}
      >
        {width > 0 ? (
          <View style={{ width: drawW, height: drawH, alignSelf: 'center' }}>
            <SvgXml xml={xml} width={drawW} height={drawH} />
            {children}
          </View>
        ) : (
          <View style={{ height: 120 }} />
        )}
      </View>
      {cap ? <Text style={styles.caption}>{cap}</Text> : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { gap: space.sm },
    sheet: { ...cardSurface(), padding: space.sm, overflow: 'hidden' },
    caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  }),
);
