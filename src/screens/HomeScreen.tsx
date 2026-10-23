import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Disclaimer } from '../components/Disclaimer';
import { ExamSwitch } from '../components/ExamSwitch';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useProgress } from '../storage';
import { colors, fonts, glyph, sep, rule, space, type, themed } from '../theme';
import { Glyph, Kicker, LockTag, ProgressBar, Rule, Icon } from '../components/ui';
import { ProBanner } from '../components/ProBanner';

function Stat({ value, label, first }: { value: string; label: string; first?: boolean }) {
  return (
    <View
      style={[styles.stat, !first && styles.statDivider]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.statValue} maxFontSizeMultiplier={1.4}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModeRow({
  n,
  title,
  desc,
  tint,
  onPress,
  locked,
  testID,
}: {
  n: string;
  title: string;
  desc: string;
  tint: string;
  onPress: () => void;
  locked?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${desc}${locked ? '. Locked, Pro only' : ''}`}
      style={({ pressed }) => [styles.mode, pressed && { backgroundColor: colors.paperDeep }]}
    >
      <Glyph size={44} color={tint} style={styles.modeNum}>
        {n}
      </Glyph>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDesc}>{desc}</Text>
        {locked ? <LockTag /> : null}
      </View>
      <Icon name={glyph.arrow} size={26} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const nav = useNav();
  const p = useProgress();
  const gate = useGate();
  const { meta, QUESTIONS, SECTIONS, EXAM_SIZE, PASS_PCT } = useExam();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  // Size the wordmark to the column so it never truncates (web ignores
  // adjustsFontSizeToFit): ~3.3 em fits a 5-letter Jost Black word.
  const { width } = useWindowDimensions();
  const column = Math.min(width, 720) - space.lg * 2 - 72 - space.md;
  const heroSize = Math.max(48, Math.min(84, Math.floor(column / 3.3)));

  const seenIds = Object.keys(p.stats);
  const totalSeen = seenIds.length;
  const totalCorrect = seenIds.reduce((n, id) => n + (p.stats[id].lastCorrect ? 1 : 0), 0);
  const accuracy = totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : 0;
  const coverage = QUESTIONS.length ? totalSeen / QUESTIONS.length : 0;

  const startMock = () => {
    if (!gate.canMock) return nav.push({ name: 'paywall', reason: 'mock' });
    nav.push({ name: 'quiz', scope: 'exam' });
  };

  const mockDesc = gate.isPro
    ? `${EXAM_SIZE} random questions · ${PASS_PCT}% to pass`
    : gate.canMock
      ? `${EXAM_SIZE} questions · 1 free mock today`
      : 'Today’s free mock used · unlimited with Pro';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ExamSwitch style={{ marginBottom: space.xl }} />

      {/* Hero — asymmetric: huge wordmark left, the app's brand mark right. */}
      <Kicker>{meta.kicker}</Kicker>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.heroTitle, { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.16) }]}
            accessibilityRole="header"
            adjustsFontSizeToFit
            numberOfLines={1}
            maxFontSizeMultiplier={1}
          >
            {meta.shortName}
          </Text>
          <Text style={styles.heroPrep}>
            {`Prep ${sep} ${meta.badge}`}
          </Text>
        </View>
        <Image
          source={require('../../assets/brand-mark.png')}
          style={styles.mark}
          accessibilityIgnoresInvertColors
          accessible={false}
        />
      </View>
      <Rule weight={rule.heavy} />
      <Text style={[type.body, styles.heroSub]}>
        {meta.subtitle} {QUESTIONS.length} questions across {SECTIONS.length} sections.
      </Text>

      <View style={styles.stats}>
        <Stat first value={`${EXAM_SIZE}`} label="Exam Qs" />
        <Stat value={`${PASS_PCT}%`} label="Pass mark" />
        <Stat value={p.bestExamPct == null ? '—' : `${p.bestExamPct}%`} label="Best" />
      </View>

      {/* Progress */}
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <Kicker>Your progress</Kicker>
          <Text style={type.mute}>
            {totalSeen}/{QUESTIONS.length} seen
          </Text>
        </View>
        <ProgressBar value={coverage} color={colors.blue} />
        <View style={styles.progRow}>
          <View>
            <Text style={styles.bigNum}>{totalSeen ? `${accuracy}%` : '—'}</Text>
            <Text style={type.tiny}>RECALL ACCURACY</Text>
          </View>
          <View style={styles.counts}>
            <Text style={styles.count}>
              <Icon name={glyph.star} size={14} color={colors.red} /> {p.bookmarks.length} saved
            </Text>
            <Text style={styles.count}>
              <Icon name={glyph.check} size={14} color={colors.blue} /> {p.known.length} mastered
            </Text>
            <Text style={styles.count}>
              <Icon name={glyph.exam} size={14} color={colors.ink} /> {p.examsTaken} exams
            </Text>
          </View>
        </View>
      </View>

      {!gate.isPro && <ProBanner style={{ marginTop: space.xl }} />}

      <Text style={[type.h2, { marginTop: space.xl, marginBottom: space.sm }]}>Study modes</Text>
      <View style={styles.modes}>
        <ModeRow
          testID="mode-mock"
          n="01"
          title="Mock Exam"
          desc={mockDesc}
          tint={colors.red}
          locked={!gate.canMock}
          onPress={startMock}
        />
        <ModeRow
          n="02"
          title="Practice Quiz"
          desc="Drill a section with instant feedback"
          tint={colors.blue}
          onPress={() => nav.resetTab('quizSetup')}
        />
        <ModeRow
          n="03"
          title="Flashcards"
          desc="Flip · question, answer & reference"
          tint={colors.yellow}
          onPress={() => nav.resetTab('cardsSetup')}
        />
        <ModeRow
          n="04"
          title="Answer Key"
          desc="Every question with its correct answer"
          tint={colors.ink}
          onPress={() => nav.resetTab('review')}
        />
      </View>

      <Pressable
        onPress={() => setShowDisclaimer(true)}
        style={styles.disclaimerBtn}
        accessibilityRole="button"
      >
        <Text style={styles.disclaimer}>
          Independent study aid · {meta.source}. Always verify against current official sources. Not
          affiliated with {meta.authority}.
        </Text>
        <Text style={styles.disclaimerLink}>Read full disclaimer <Icon name={glyph.arrow} size={13} color={colors.blue} /></Text>
      </Pressable>

      <Disclaimer visible={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </ScrollView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    content: { padding: space.lg, paddingBottom: 48 },
    heroRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: space.sm, marginBottom: space.sm },
    heroTitle: {
      fontFamily: fonts.black,
      fontSize: 84,
      lineHeight: 97,
      letterSpacing: -3,
      color: colors.ink,
    },
    heroPrep: {
      fontFamily: fonts.heavy,
      fontSize: 18,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.red,
    },
    mark: { width: 72, height: 72, marginLeft: space.md },
    heroSub: { marginTop: space.md },
    stats: {
      flexDirection: 'row',
      marginTop: space.lg,
      borderTopWidth: rule.mid,
      borderBottomWidth: rule.mid,
      borderColor: colors.ink,
    },
    stat: { flex: 1, paddingVertical: space.md, paddingHorizontal: space.sm },
    statDivider: { borderLeftWidth: rule.mid, borderLeftColor: colors.ink },
    statValue: {
      fontFamily: fonts.black,
      fontSize: 32,
      lineHeight: 38,
      color: colors.ink,
      letterSpacing: -1,
    },
    statLabel: { ...type.tiny, textTransform: 'uppercase' },
    block: { marginTop: space.xl, gap: space.sm },
    blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    progRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: space.sm,
    },
    bigNum: { fontFamily: fonts.black, fontSize: 48, lineHeight: 56, color: colors.ink, letterSpacing: -1.5 },
    counts: { alignItems: 'flex-end', gap: 2 },
    count: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
    modes: { borderTopWidth: rule.thick, borderTopColor: colors.ink },
    mode: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 76,
      paddingVertical: space.md,
      borderBottomWidth: rule.mid,
      borderBottomColor: colors.ink,
    },
    modeNum: { width: 72, letterSpacing: -2 },
    modeTitle: { fontFamily: fonts.heavy, fontSize: 19, color: colors.ink },
    modeDesc: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.inkSoft },
    disclaimerBtn: { marginTop: space.xl, paddingVertical: space.sm },
    disclaimer: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
    disclaimerLink: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue, marginTop: 6 },
  }),
);
