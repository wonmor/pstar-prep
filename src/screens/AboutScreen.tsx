import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useEntitlements } from '../entitlements';
import { useNav } from '../nav';
import { useThemeMode } from '../themeMode';
import { useActions, useProgress } from '../storage';
import { colors, fonts, glyph, rule, space, TOUCH, type, themed } from '../theme';
import { Glyph, ScreenHeader } from '../components/ui';
import { Disclaimer } from '../components/Disclaimer';
import { ExamSwitch } from '../components/ExamSwitch';
import {
  APP_NAME,
  APP_STORE_URL,
  APP_VERSION,
  CONTACT_EMAIL,
  PLAY_STORE_URL,
  PRIVACY_URL,
  SITE_URL,
} from '../config';

function Row({
  mark,
  tint = colors.ink,
  label,
  value,
  onPress,
  danger,
  testID,
}: {
  mark: string;
  tint?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.paperDeep }]}
    >
      <Glyph size={18} color={danger ? colors.red : tint} style={styles.rowMark}>
        {mark}
      </Glyph>
      <Text style={[styles.rowLabel, danger && { color: colors.red }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Glyph size={18}>{glyph.arrow}</Glyph> : null}
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function AboutScreen() {
  const nav = useNav();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const p = useProgress();
  const ent = useEntitlements();
  const theme = useThemeMode();
  const { meta, QUESTIONS, SECTIONS } = useExam();
  const { resetProgress } = useActions();

  function confirmReset() {
    const doReset = () => resetProgress();
    const msg = `Reset all ${meta.shortName} progress, scores, bookmarks and mastered cards?`;
    if (Platform.OS === 'web') {
      // RN Alert has no buttons on web; use the browser confirm.
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        doReset();
      }
      return;
    }
    Alert.alert(`Reset ${meta.shortName} progress?`, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: doReset },
    ]);
  }

  async function restore() {
    setRestoreMsg('Restoring…');
    const ok = await ent.restore();
    setRestoreMsg(
      ok
        ? 'Pro restored.'
        : ent.storeAvailable
          ? 'No previous Pro purchase found.'
          : 'Store unavailable right now.',
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader index="05" title="About" accent="red" />

      <View style={styles.brand}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandName}>{APP_NAME}</Text>
          <Text style={type.mute}>Version {APP_VERSION}</Text>
        </View>
        <View style={styles.brandGlyphs}>
          <Glyph size={30} color={colors.red}>
            {glyph.circle}
          </Glyph>
          <Glyph size={30} color={colors.blue}>
            {glyph.square}
          </Glyph>
          <Glyph size={30} color={colors.yellow}>
            {glyph.triangle}
          </Glyph>
        </View>
      </View>
      <ExamSwitch style={{ marginTop: space.lg }} />
      <Text style={[type.mute, { marginTop: space.sm }]}>
        {meta.shortName} {glyph.dot} {QUESTIONS.length} questions {glyph.dot} {SECTIONS.length} sections
      </Text>

      <Group title="APPEARANCE">
        <Row
          testID="theme-toggle"
          mark={theme.mode === 'dark' ? glyph.square : glyph.open}
          label="Theme"
          value={theme.mode === 'dark' ? 'Black' : 'Paper'}
          onPress={() => theme.setMode(theme.mode === 'dark' ? 'light' : 'dark')}
        />
      </Group>

      <Group title="PRO">
        {ent.isWeb ? (
          <>
            <Row mark={glyph.check} tint={colors.blue} label="Everything is unlocked on the web" />
            <Row
              mark={glyph.arrow}
              label="Get the iPhone & iPad app"
              onPress={() => Linking.openURL(APP_STORE_URL)}
            />
            <Row
              mark={glyph.arrow}
              label="Get the Android app"
              onPress={() => Linking.openURL(PLAY_STORE_URL)}
            />
          </>
        ) : ent.isPro ? (
          <Row mark={glyph.check} tint={colors.blue} label="Pro" value="Active" />
        ) : (
          <Row
            testID="about-upgrade"
            mark={glyph.square}
            tint={colors.red}
            label="Unlock Pro"
            value="All sections"
            onPress={() => nav.push({ name: 'paywall', reason: 'about' })}
          />
        )}
        {!ent.isWeb && <Row mark={glyph.refresh} label="Restore purchases" onPress={restore} />}
      </Group>
      {restoreMsg ? (
        <Text style={[type.mute, { marginTop: space.sm }]} accessibilityLiveRegion="polite">
          {restoreMsg}
        </Text>
      ) : null}

      <Group title={`LEGAL ${glyph.dot} ${meta.shortName}`}>
        <Row
          mark={glyph.triangle}
          tint={colors.yellow}
          label="Disclaimer"
          onPress={() => setShowDisclaimer(true)}
        />
        <Row mark={glyph.square} label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        <Row mark={glyph.circle} label={meta.sourceLabel} onPress={() => Linking.openURL(meta.sourceUrl)} />
      </Group>

      <Group title={`YOUR DATA ${glyph.dot} ${meta.shortName}`}>
        <Row mark="#" label="Questions seen" value={`${Object.keys(p.stats).length}/${QUESTIONS.length}`} />
        <Row mark={glyph.star} tint={colors.red} label="Bookmarks" value={`${p.bookmarks.length}`} />
        <Row mark={glyph.check} tint={colors.blue} label="Cards mastered" value={`${p.known.length}`} />
        <Row mark={glyph.close} label="Reset all progress" danger onPress={confirmReset} />
      </Group>

      <Group title="ABOUT">
        <Row mark={glyph.circle} label="Website" onPress={() => Linking.openURL(SITE_URL)} />
        <Row mark="@" label="Contact" onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} />
      </Group>

      <Text style={styles.fine}>
        An independent study aid, not affiliated with, endorsed by, or sponsored by {meta.authority}.{' '}
        {meta.shortName} content: {meta.source}. Always verify against current official sources. Your study
        data stays on your device; purchases are handled by Apple / Google via RevenueCat.
      </Text>

      <Disclaimer visible={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    content: { padding: space.lg, paddingBottom: 40 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    brandName: { fontFamily: fonts.heavy, fontSize: 20, color: colors.ink },
    brandGlyphs: { flexDirection: 'row', gap: 4 },
    groupTitle: { ...type.kicker, marginBottom: space.sm },
    group: { borderTopWidth: rule.thick, borderTopColor: colors.ink },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: TOUCH + 8,
      paddingVertical: space.sm,
      gap: space.md,
      borderBottomWidth: rule.hair,
      borderBottomColor: colors.ink,
    },
    rowMark: { width: 22, textAlign: 'center' },
    rowLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, flexShrink: 1 },
    rowValue: { fontFamily: fonts.heavy, fontSize: 15, color: colors.inkSoft },
    fine: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.inkSoft,
      lineHeight: 17,
      marginTop: space.xl,
    },
  }),
);
