import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { illustrationFor } from '../illustrations';
import { colors, fonts, glyph, radius, rule, space, type, themed } from '../theme';
import { Button, Kicker, OptionRow, ProgressBar, Icon } from '../components/ui';
import { ProBanner } from '../components/ProBanner';
import { Ring } from '../components/Ring';
import { Illustration } from '../components/Illustration';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ResultsScreen({
  scope,
  correct,
  total,
  isExam,
  wrongIds,
  ids,
  seconds,
}: {
  scope: 'exam' | number;
  correct: number;
  total: number;
  isExam: boolean;
  wrongIds: string[];
  ids?: string[];
  seconds?: number;
}) {
  const nav = useNav();
  const gate = useGate();
  const { id: examId, meta, QUESTIONS, SECTIONS, PASS_PCT, sectionName } = useExam();
  const restart = () => {
    nav.resetTab('quizSetup');
    if (isExam && !gate.canMock) nav.push({ name: 'paywall', reason: 'mock' });
    else nav.push({ name: 'quiz', scope });
  };
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS_PCT;
  const wrong = QUESTIONS.filter((q) => wrongIds.includes(q.id));
  const bg = passed ? colors.blue : colors.red;

  // Per-section breakdown of this run (needs the full id list).
  const breakdown = (() => {
    if (!ids || ids.length === 0) return [];
    const bySection = new Map<number, { total: number; wrong: number }>();
    for (const qid of ids) {
      const q = QUESTIONS.find((x) => x.id === qid);
      if (!q) continue;
      const row = bySection.get(q.section) ?? { total: 0, wrong: 0 };
      row.total++;
      if (wrongIds.includes(qid)) row.wrong++;
      bySection.set(q.section, row);
    }
    return SECTIONS.filter((s) => bySection.has(s.id))
      .map((s) => ({ s, ...bySection.get(s.id)! }))
      .map((r) => ({ ...r, pct: (r.total - r.wrong) / r.total }))
      .sort((a, b) => a.pct - b.pct);
  })();
  const weak = breakdown.filter((r) => r.pct < 0.7 && r.total >= 2);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View
        style={[styles.score, { backgroundColor: bg }]}
        accessible
        accessibilityLabel={`Score ${pct} percent. ${correct} of ${total} correct.${isExam ? (passed ? ' Pass.' : ' Below pass mark.') : ''}${seconds != null ? ` Time ${fmt(seconds)}.` : ''}`}
      >
        <View style={styles.scoreTop}>
          <Text style={styles.scoreKicker}>{isExam ? 'MOCK EXAM RESULT' : 'PRACTICE RESULT'}</Text>
          <Icon name={passed ? glyph.check : glyph.warning} size={30} color={colors.onAccent} />
        </View>
        <View style={styles.scoreRow}>
          <Ring
            value={pct / 100}
            size={150}
            stroke={14}
            color={colors.onAccent}
            track="rgba(251,246,234,0.28)"
            label={`${pct}%`}
            accessibilityLabel={`${pct} percent`}
            style={{ marginRight: space.lg }}
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.scoreSub}>
              {correct} of {total} correct
            </Text>
            {isExam && (
              <Text style={styles.verdict}>
                {passed ? `PASS | ${PASS_PCT}% REQUIRED` : `BELOW ${PASS_PCT}% PASS MARK`}
              </Text>
            )}
            {seconds != null ? (
              <Text style={styles.time}>
                <Icon name={glyph.timer} size={14} color={colors.onAccent} /> {fmt(seconds)}
                {isExam ? ` of ${meta.paceMinutes}:00 pace` : ''}
              </Text>
            ) : null}
            {!passed && isExam ? <Text style={styles.scoreNote}>Keep studying, then try again.</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Try again"
          variant="red"
          trailing={glyph.refresh}
          onPress={restart}
          style={{ flex: 1 }}
        />
        <Button label="Progress" variant="ghost" trailing={glyph.progress} onPress={() => nav.push({ name: 'progress' })} style={{ flex: 1 }} />
      </View>

      {breakdown.length > 1 && (
        <View style={styles.breakdown}>
          <View style={styles.breakHead}>
            <Kicker>By topic</Kicker>
            <Text style={type.mute}>weakest first</Text>
          </View>
          {breakdown.map((r) => (
            <View key={r.s.id} style={styles.breakRow} accessible accessibilityLabel={`${r.s.name}: ${r.total - r.wrong} of ${r.total}`}>
              <View style={styles.breakLabel}>
                <Text style={styles.breakName} numberOfLines={1}>{r.s.id}. {r.s.name}</Text>
                <Text style={[styles.breakPct, { color: r.pct >= 0.9 ? colors.blue : r.pct >= 0.7 ? colors.ink : colors.red }]}>
                  {r.total - r.wrong}/{r.total}
                </Text>
              </View>
              <ProgressBar value={r.pct} color={r.pct >= 0.9 ? colors.blue : r.pct >= 0.7 ? colors.ink : colors.red} />
            </View>
          ))}
          {weak.length > 0 ? (
            <View style={styles.weak}>
              <Icon name={glyph.warning} size={18} color={colors.red} />
              <Text style={styles.weakText}>
                Weak spot{weak.length > 1 ? 's' : ''}: {weak.map((w) => sectionName(w.s.id)).join(', ')}. Drill {weak.length > 1 ? 'these sections' : 'this section'} in Practice.
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {!gate.isPro && <ProBanner reason="results" style={{ marginTop: space.xl }} />}

      {wrong.length > 0 ? (
        <>
          <Text style={[type.h2, { marginTop: space.xxl }]}>Review your misses</Text>
          <Text style={[type.mute, { marginBottom: space.md }]}>
            {wrong.length} to revisit. Correct answer marked <Icon name={glyph.check} size={14} color={colors.blue} />.
          </Text>
          <View style={{ gap: space.xl }}>
            {wrong.map((q) => {
              const ill = illustrationFor(examId, q.id);
              return (
                <View key={q.id} style={styles.miss}>
                  <Text style={styles.qNum}>Q {q.id}</Text>
                  <Text style={styles.qText}>{q.question}</Text>
                  {ill ? <Illustration ill={ill} maxHeight={240} style={{ marginTop: space.md }} /> : null}
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
                      Ref. {q.reference}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.perfect}>
          <Icon name={glyph.check} size={64} color={colors.blue} />
          <Text style={type.h3}>Perfect run. Nothing to review.</Text>
        </View>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    content: { padding: space.lg, paddingBottom: 40 },
    score: { padding: space.xl, borderRadius: radius },
    scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg },
    scoreKicker: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3, color: colors.onAccent },
    scoreSub: { fontFamily: fonts.bold, fontSize: 18, color: colors.onAccent },
    verdict: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 1.5, color: colors.onAccent },
    time: { fontFamily: fonts.bold, fontSize: 14, color: colors.onAccent },
    scoreNote: { fontFamily: fonts.medium, fontSize: 13, color: colors.onAccent, opacity: 0.9 },
    actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
    breakdown: { marginTop: space.xl, gap: space.md },
    breakHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    breakRow: { gap: 6 },
    breakLabel: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
    breakName: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
    breakPct: { fontFamily: fonts.heavy, fontSize: 14 },
    weak: {
      flexDirection: 'row',
      gap: space.sm,
      alignItems: 'flex-start',
      borderLeftWidth: 4,
      borderLeftColor: colors.red,
      paddingLeft: space.md,
      paddingVertical: space.xs,
    },
    weakText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
    miss: { borderTopWidth: rule.hair, borderTopColor: colors.lineStrong, paddingTop: space.md },
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
      borderTopWidth: rule.hair,
      borderTopColor: colors.line,
      paddingTop: space.lg,
    },
  }),
);
