import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PASS_PCT, QUESTIONS } from '../data';
import { useNav } from '../nav';
import { colors, font, radius, shadow, space } from '../theme';
import { Button, Card, OptionRow } from '../components/ui';

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
  const restart = () => {
    nav.resetTab('quizSetup');
    nav.push({ name: 'quiz', scope });
  };
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS_PCT;
  const wrong = QUESTIONS.filter((q) => wrongIds.includes(q.id));

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.scoreCard, { backgroundColor: passed ? colors.green : colors.navy }]}>
        <Text style={styles.scoreEmoji}>{passed ? '🎉' : '✈️'}</Text>
        <Text style={styles.scoreBig}>{pct}%</Text>
        <Text style={styles.scoreSub}>
          {correct} of {total} correct
        </Text>
        {isExam && (
          <View style={styles.verdict}>
            <Text style={styles.verdictText}>
              {passed ? `PASS · ${PASS_PCT}% required` : `Below ${PASS_PCT}% pass mark — keep studying`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button label="Try again" variant="primary" onPress={restart} style={{ flex: 1 }} />
        <Button label="Home" variant="ghost" onPress={() => nav.resetTab('home')} style={{ flex: 1 }} />
      </View>

      {wrong.length > 0 ? (
        <>
          <Text style={[font.h2, { marginTop: space.lg }]}>Review your misses</Text>
          <Text style={[font.mute, { marginBottom: space.md }]}>
            {wrong.length} to revisit — correct answer marked in green.
          </Text>
          <View style={{ gap: space.md }}>
            {wrong.map((q) => (
              <Card key={q.id} style={{ padding: space.md }}>
                <Text style={styles.qNum}>Q {q.id}</Text>
                <Text style={styles.qText}>{q.question}</Text>
                <View style={{ gap: 8, marginTop: 10 }}>
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
                {q.reference ? <Text style={styles.ref}>📖 {q.reference}</Text> : null}
              </Card>
            ))}
          </View>
        </>
      ) : (
        <Card style={{ alignItems: 'center', marginTop: space.lg }}>
          <Text style={{ fontSize: 40 }}>🥇</Text>
          <Text style={[font.h3, { marginTop: 8 }]}>Perfect run — nothing to review!</Text>
        </Card>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40 },
  scoreCard: {
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: 'center',
    ...shadow.float,
  },
  scoreEmoji: { fontSize: 40 },
  scoreBig: { color: colors.white, fontSize: 56, fontWeight: '900', marginTop: 4 },
  scoreSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  verdict: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  verdictText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  qNum: { fontSize: 11, fontWeight: '800', color: colors.blue, letterSpacing: 0.5 },
  qText: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4, lineHeight: 21 },
  ref: { fontSize: 12, color: colors.textMute, marginTop: 10, lineHeight: 18 },
});
