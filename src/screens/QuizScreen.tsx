import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildQuiz, sectionName, shuffleOptions } from '../data';
import { useNav } from '../nav';
import { useActions, useProgress } from '../storage';
import { colors, font, radius, space } from '../theme';
import { Button, OptionRow, Pill, ProgressBar } from '../components/ui';

export default function QuizScreen({ scope }: { scope: 'exam' | number }) {
  const nav = useNav();
  const { recordAnswer, recordExam, toggleBookmark } = useActions();
  const progress = useProgress();
  const isExam = scope === 'exam';

  // Prepare questions + a stable shuffled option order, once per session.
  const prepared = useMemo(() => {
    return buildQuiz(scope).map((q) => ({ q, opts: shuffleOptions(q) }));
  }, [scope]);

  const [idx, setIdx] = useState(0);
  // selected shuffled-option index per question (-1 = unanswered)
  const [picks, setPicks] = useState<number[]>(() => prepared.map(() => -1));
  // for section mode, whether the current question is revealed
  const [revealed, setRevealed] = useState(false);

  const total = prepared.length;
  const cur = prepared[idx];
  const picked = picks[idx];
  const showFeedback = !isExam && revealed;
  const bookmarked = progress.bookmarks.includes(cur.q.id);

  function choose(optionIndex: number) {
    if (isExam) {
      setPicks((p) => p.map((v, i) => (i === idx ? optionIndex : v)));
      return;
    }
    if (revealed) return; // locked after reveal in section mode
    setPicks((p) => p.map((v, i) => (i === idx ? optionIndex : v)));
    setRevealed(true);
    recordAnswer(cur.q.id, optionIndex === cur.opts.correctIndex);
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setRevealed(false);
    } else {
      finish();
    }
  }

  function finish() {
    let correct = 0;
    const wrongIds: string[] = [];
    prepared.forEach(({ q, opts }, i) => {
      const ok = picks[i] === opts.correctIndex;
      if (ok) correct++;
      else wrongIds.push(q.id);
      if (isExam) recordAnswer(q.id, ok); // exam records on submit
    });
    const pct = Math.round((correct / total) * 100);
    if (isExam) recordExam(pct);
    nav.push({ name: 'results', scope, correct, total, isExam, wrongIds });
  }

  function optState(i: number): 'idle' | 'selected' | 'correct' | 'wrong' {
    if (isExam) return picked === i ? 'selected' : 'idle';
    if (!revealed) return picked === i ? 'selected' : 'idle';
    if (i === cur.opts.correctIndex) return 'correct';
    if (i === picked) return 'wrong';
    return 'idle';
  }

  const answeredCount = picks.filter((v) => v >= 0).length;

  return (
    <View style={styles.root}>
      {/* App bar */}
      <View style={styles.bar}>
        <Pressable onPress={nav.back} hitSlop={10} style={styles.barBtn}>
          <Text style={styles.barBtnText}>✕</Text>
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: space.md }}>
          <ProgressBar value={(idx + (revealed || isExam ? 1 : 0)) / total} />
        </View>
        <Pressable onPress={() => toggleBookmark(cur.q.id)} hitSlop={10} style={styles.barBtn}>
          <Text style={[styles.barBtnText, { fontSize: 18 }]}>{bookmarked ? '★' : '☆'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <Pill label={isExam ? 'MOCK EXAM' : sectionName(cur.q.section).toUpperCase()} tone="sky" />
          <Text style={font.mute}>
            {idx + 1} / {total}
          </Text>
        </View>

        <Text style={styles.question}>{cur.q.question}</Text>

        <View style={{ gap: 10, marginTop: space.lg }}>
          {cur.opts.labels.map((label, i) => (
            <OptionRow
              key={i}
              testID={`opt-${i}`}
              index={i}
              text={label}
              state={optState(i)}
              disabled={showFeedback}
              onPress={() => choose(i)}
            />
          ))}
        </View>

        {showFeedback && (
          <View
            style={[
              styles.feedback,
              { backgroundColor: picked === cur.opts.correctIndex ? colors.greenSoft : colors.redSoft },
            ]}
          >
            <Text
              style={[
                styles.feedbackTitle,
                { color: picked === cur.opts.correctIndex ? colors.green : colors.red },
              ]}
            >
              {picked === cur.opts.correctIndex ? '✓ Correct' : '✕ Not quite'}
            </Text>
            {cur.q.reference ? (
              <Text style={styles.refText}>
                <Text style={{ fontWeight: '700' }}>Reference: </Text>
                {cur.q.reference}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isExam ? (
          <View style={styles.footRow}>
            <Button
              label="Back"
              variant="ghost"
              small
              disabled={idx === 0}
              onPress={() => setIdx(Math.max(0, idx - 1))}
              style={{ flex: 1 }}
            />
            <Button
              label={idx === total - 1 ? `Submit (${answeredCount}/${total})` : 'Next'}
              variant={idx === total - 1 ? 'success' : 'primary'}
              onPress={idx === total - 1 ? finish : () => setIdx(idx + 1)}
              style={{ flex: 2 }}
            />
          </View>
        ) : (
          <Button
            label={revealed ? (idx === total - 1 ? 'See results' : 'Next question') : 'Select an answer'}
            variant={revealed ? 'primary' : 'ghost'}
            disabled={!revealed}
            onPress={next}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  barBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  barBtnText: { fontSize: 20, color: colors.navy, fontWeight: '700' },
  content: { padding: space.lg, paddingBottom: 24 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 20, fontWeight: '700', color: colors.text, lineHeight: 28, marginTop: space.md },
  feedback: { borderRadius: radius.md, padding: space.md, marginTop: space.lg },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  refText: { fontSize: 13, color: colors.textMute, lineHeight: 19, marginTop: 6 },
  footer: {
    padding: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  footRow: { flexDirection: 'row', gap: space.md },
});
