import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { cardSurface, colors, fonts, glyph, space, type, themed } from '../theme';
import { Button, Glyph, ScreenHeader, Icon } from '../components/ui';
import { SectionList } from '../components/SectionList';
import { ExamSwitch } from '../components/ExamSwitch';
import { ProBanner } from '../components/ProBanner';
import { spotsForExam } from '../illustrations';

export default function QuizSetupScreen() {
  const nav = useNav();
  const gate = useGate();
  const { id: examId, meta, QUESTIONS, EXAM_SIZE, PASS_PCT } = useExam();
  const spotCount = spotsForExam(examId).length;
  const startMock = () =>
    gate.canMock ? nav.push({ name: 'quiz', scope: 'exam' }) : nav.push({ name: 'paywall', reason: 'mock' });
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        index="02"
        title="Practice"
        accent="blue"
        sub="Take a full mock exam, or drill one section at a time."
      />

      <ExamSwitch style={{ marginBottom: space.xl }} />

      <View style={styles.exam}>
        <View style={styles.examTop}>
          <Text style={styles.examKicker}>FULL MOCK EXAM</Text>
          <Icon name={glyph.exam} size={30} color={colors.blue} />
        </View>
        <Text style={styles.examBig} maxFontSizeMultiplier={1.1}>{EXAM_SIZE}</Text>
        <Text style={styles.examDesc}>
          questions drawn at random from all {QUESTIONS.length}. Pass mark {PASS_PCT}%, just like the real{' '}
          {meta.shortName}. Answers revealed at the end. A pace ring keeps you to {meta.paceMinutes} minutes.
        </Text>
        {!gate.isPro && (
          <Text style={styles.examQuota}>
            <Icon name={gate.canMock ? glyph.calendar : glyph.lock} size={14} color={colors.inkSoft} />{' '}
            {gate.canMock ? '1 free mock exam today' : 'Today’s free mock used — unlimited with Pro'}
          </Text>
        )}
        <Button
          testID="start-mock"
          label={gate.canMock ? 'Start mock exam' : 'Unlock unlimited mocks'}
          variant={gate.canMock ? 'red' : 'yellow'}
          trailing={glyph.arrow}
          onPress={startMock}
          style={{ marginTop: space.lg }}
        />
      </View>

      {spotCount > 0 && (
        <View style={[styles.exam, styles.spot]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.examKicker, { color: colors.green }]}>SPOT IT</Text>
            <Text style={[type.h3, { marginTop: 4 }]}>Tap the answer on the diagram</Text>
            <Text style={[type.mute, { marginTop: 2 }]}>
              {spotCount} diagrams: light signals, markings, signs, the circuit and more.
            </Text>
          </View>
          <Button small label="Start" variant="primary" trailing={glyph.spot} onPress={() => nav.push({ name: 'spot' })} testID="start-spot" />
        </View>
      )}

      <View style={styles.subHead}>
        <Text style={type.h2}>By section</Text>
        <Text style={type.mute}>Instant feedback</Text>
      </View>
      <SectionList
        onPick={(id) => nav.push({ name: 'quiz', scope: id })}
        onLocked={() => nav.push({ name: 'paywall', reason: 'section' })}
      />
      {!gate.isPro && <ProBanner style={{ marginTop: space.xl }} />}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    content: { padding: space.lg, paddingBottom: 40 },
    exam: { ...cardSurface(), padding: space.xl },
    spot: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, marginTop: space.md },
    examTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    examKicker: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3, color: colors.blue },
    examBig: {
      fontFamily: fonts.black,
      fontSize: 96,
      lineHeight: 110,
      color: colors.ink,
      letterSpacing: -4,
      marginTop: space.sm,
    },
    examDesc: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.ink },
    examQuota: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft, marginTop: space.md },
    subHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: space.xxl,
      marginBottom: space.sm,
    },
  }),
);
