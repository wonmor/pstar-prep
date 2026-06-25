import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QUESTIONS, SECTIONS } from '../data';
import { resetProgress, useProgress } from '../storage';
import { colors, font, radius, space } from '../theme';
import { Card, Pill } from '../components/ui';
import { Disclaimer } from '../components/Disclaimer';
import { APP_VERSION, CONTACT_EMAIL, PRIVACY_URL, SITE_URL, SOURCE_URL } from '../config';

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.6 }]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && { color: colors.red }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Text style={styles.rowChev}>›</Text> : null}
    </Pressable>
  );
}

export default function AboutScreen() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const p = useProgress();

  function confirmReset() {
    const doReset = () => resetProgress();
    if (Platform.OS === 'web') {
      // RN Alert has no buttons on web; use the browser confirm.
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm('Reset all progress, scores and bookmarks?')) {
        doReset();
      }
      return;
    }
    Alert.alert('Reset everything?', 'This clears all progress, scores, bookmarks and mastered cards.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: doReset },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <View style={styles.logo}>
          <Text style={styles.logoMark}>✈</Text>
        </View>
        <Text style={font.h1}>PSTAR Prep</Text>
        <Text style={font.mute}>Version {APP_VERSION}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Pill label={`${QUESTIONS.length} questions`} tone="sky" />
          <Pill label={`${SECTIONS.length} sections`} tone="green" />
        </View>
      </View>

      <Text style={styles.section}>Legal</Text>
      <Card style={styles.group}>
        <Row icon="⚠︎" label="Disclaimer" onPress={() => setShowDisclaimer(true)} />
        <View style={styles.sep} />
        <Row icon="🔒" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        <View style={styles.sep} />
        <Row icon="📄" label="Official TC source (TP 11919E)" onPress={() => Linking.openURL(SOURCE_URL)} />
      </Card>

      <Text style={styles.section}>Your data</Text>
      <Card style={styles.group}>
        <Row icon="📊" label="Questions seen" value={`${Object.keys(p.stats).length}/${QUESTIONS.length}`} />
        <View style={styles.sep} />
        <Row icon="★" label="Bookmarks" value={`${p.bookmarks.length}`} />
        <View style={styles.sep} />
        <Row icon="🎓" label="Cards mastered" value={`${p.known.length}`} />
        <View style={styles.sep} />
        <Row icon="🗑" label="Reset all progress" danger onPress={confirmReset} />
      </Card>

      <Text style={styles.section}>About</Text>
      <Card style={styles.group}>
        <Row icon="🌐" label="Website" onPress={() => Linking.openURL(SITE_URL)} />
        <View style={styles.sep} />
        <Row icon="✉️" label="Contact" onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} />
      </Card>

      <Text style={styles.fine}>
        PSTAR Prep is an independent study aid and is not affiliated with, endorsed by, or sponsored
        by Transport Canada. Study material reproduced from Transport Canada TP 11919E, 7th Edition
        (December 2022). Always verify against the current CARs and TC AIM. Local‑only data — nothing
        leaves your device.
      </Text>

      <Disclaimer visible={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40 },
  head: { alignItems: 'center', paddingVertical: space.lg },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  logoMark: { fontSize: 36, color: colors.white },
  section: {
    ...font.tiny,
    color: colors.textMute,
    letterSpacing: 1,
    marginTop: space.lg,
    marginBottom: space.sm,
    marginLeft: 4,
  },
  group: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: space.md, gap: 12 },
  rowIcon: { fontSize: 17, width: 22, textAlign: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.textMute },
  rowChev: { fontSize: 22, color: colors.textFaint, fontWeight: '300', marginLeft: 6 },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: space.md },
  fine: { fontSize: 11, color: colors.textFaint, lineHeight: 16, marginTop: space.lg, textAlign: 'center' },
});
