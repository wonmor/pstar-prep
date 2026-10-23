import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { colors, fonts, glyph, sep, rule, space, type, themed } from '../theme';
import { Button, Glyph, OptionRow, Rule, Icon } from '../components/ui';
import { ProBanner } from '../components/ProBanner';

export default function ResultsScreen({
  scope,
  correct,
  total,
  isExam,
  wrongIds,
}: {
  scope: 'exam' | number;
  correct: number;
  total: number;
  isExam: boolean;
  wrongIds: string[];
}) {
  const nav = useNav();
  const gate = useGate();
  const { QUESTIONS, PASS_PCT } = useExam();
  const restart = () => {
    nav.resetTab('quizSetup');
    if (isExam && !gate.canMock) nav.push({ name: 'paywall', reason: 'mock' });
    else nav.push({ name: 'quiz', scope });
  };
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS_PCT;
  const wrong = QUESTIONS.filter((q) => wrongIds.includes(q.id));
  const bg = passed ? colors.blue : colors.ink;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View
        style={[styles.score, { backgroundColor: bg }]}
        accessible
        accessibilityLabel={`Score ${pct} percent. ${correct} of ${total} correct.${isExam ? (passed ? ' Pass.' : ' Below pass mark.') : ''}`}
      >
        <View style={styles.scoreTop}>
          <Text style={styles.scoreKicker}>{isExam ? 'MOCK EXAM RESULT' : 'PRACTICE RESULT'}</Text>
          <Icon name={passed ? glyph.check : glyph.warning} size={30} color={passed ? colors.yellow : colors.red} />
        </View>
        <Text style={styles.scoreBig} maxFontSizeMultiplier={1.2}>
          {pct}
          <Text style={styles.scorePct}>%</Text>
        </Text>
        <Rule color={colors.paper} weight={rule.mid} />
        <Text style={styles.scoreSub}>
          {correct} of {total} correct
        </Text>
        {isExam && (
          <Text style={[styles.verdict, { color: colors.paper }]}>
            {passed
              ? `PASS ${sep} ${PASS_PCT}% REQUIRED`
              : `BELOW ${PASS_PCT}% PASS MARK ${sep} KEEP STUDYING`}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Try again"
          variant="red"
          trailing={glyph.refresh}
          onPress={restart}
          style={{ flex: 1 }}
        />
        <Button label="Home" variant="ghost" onPress={() => nav.resetTab('home')} style={{ flex: 1 }} />
      </View>

      {!gate.isPro && <ProBanner reason="results" style={{ marginTop: space.xl }} />}

      {wrong.length > 0 ? (
        <>
          <Text style={[type.h2, { marginTop: space.xxl }]}>Review your misses</Text>
          <Text style={[type.mute, { marginBottom: space.md }]}>
            {wrong.length} to revisit — correct answer marked <Icon name={glyph.check} size={14} color={colors.blue} />.
          </Text>
          <View style={{ gap: space.xl }}>
            {wrong.map((q) => (
              <View key={q.id} style={styles.miss}>
                <Text style={styles.qNum}>Q {q.id}</Text>
                <Text style={styles.qText}>{q.question}</Text>
                <View style={{ gap: space.sm, marginTop: space.md }}>
                  {q.options.map((opt, i) => (
                    <OptionRow
                      key={i}
                      index={i}
                      text={opt}
                      state={i === q.answer - 1 ? 'correct' : 'idle'}
                      disabled
                    />
                  ))}
                </View>
                {q.reference ? (
                  <Text style={styles.ref}>
                    REF {sep} {q.reference}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.perfect}>
          <Icon name={glyph.check} size={64} color={colors.blue} />
          <Text style={type.h3}>Perfect run — nothing to review.</Text>
        </View>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    content: { padding: space.lg, paddingBottom: 40 },
    score: { padding: space.xl },
    scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreKicker: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3, color: colors.paper },
    scoreBig: {
      fontFamily: fonts.black,
      fontSize: 120,
      lineHeight: 138,
      color: colors.paper,
      letterSpacing: -5,
    },
    scorePct: { fontSize: 48, letterSpacing: 0 },
    scoreSub: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper, marginTop: space.sm },
    verdict: { fontFamily: fonts.heavy, fontSize: 13, letterSpacing: 1.5, marginTop: space.sm },
    actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
    miss: { borderTopWidth: rule.thick, borderTopColor: colors.ink, paddingTop: space.md },
    qNum: { ...type.kicker, color: colors.red },
    qText: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, marginTop: 4, lineHeight: 23 },
    ref: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.inkSoft,
      marginTop: space.md,
      lineHeight: 19,
    },
    perfect: {
      alignItems: 'center',
      gap: space.sm,
      marginTop: space.xl,
      borderTopWidth: rule.thick,
      paddingTop: space.lg,
    },
  }),
);
