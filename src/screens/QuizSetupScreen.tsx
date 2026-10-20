import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { colors, fonts, glyph, space, type, themed } from '../theme';
import { Button, Glyph, ScreenHeader } from '../components/ui';
import { SectionList } from '../components/SectionList';
import { ExamSwitch } from '../components/ExamSwitch';
import { ProBanner } from '../components/ProBanner';

export default function QuizSetupScreen() {
  const nav = useNav();
  const gate = useGate();
  const { meta, QUESTIONS, EXAM_SIZE, PASS_PCT } = useExam();
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
          <Glyph size={28} color={colors.yellow}>
            {glyph.triangle}
          </Glyph>
        </View>
        <Text style={styles.examBig}>{EXAM_SIZE}</Text>
        <Text style={styles.examDesc}>
          questions drawn at random from all {QUESTIONS.length}. Pass mark {PASS_PCT}%, just like the real{' '}
          {meta.shortName}. Answers revealed at the end.
        </Text>
        {!gate.isPro && (
          <Text style={styles.examQuota}>
            {gate.canMock
              ? `${glyph.circle} 1 free mock exam today`
              : `${glyph.square} Today’s free mock used — unlimited with Pro`}
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
    exam: { backgroundColor: colors.ink, padding: space.xl },
    examTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    examKicker: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3, color: colors.paper },
    examBig: {
      fontFamily: fonts.black,
      fontSize: 96,
      lineHeight: 96,
      color: colors.paper,
      letterSpacing: -4,
      marginTop: space.sm,
    },
    examDesc: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.paper },
    examQuota: { fontFamily: fonts.bold, fontSize: 14, color: colors.paper, marginTop: space.md },
    subHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: space.xxl,
      marginBottom: space.sm,
    },
  }),
);
