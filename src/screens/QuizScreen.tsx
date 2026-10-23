import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shuffleOptions } from '../data';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useActions, useProgress } from '../storage';
import { colors, fonts, glyph, rule, space, type, themed } from '../theme';
import { Button, FlowBar, Glyph, IconButton, OptionRow, Icon } from '../components/ui';

export default function QuizScreen({ scope }: { scope: 'exam' | number }) {
  const nav = useNav();
  const { buildQuiz, sectionName } = useExam();
  const { recordAnswer, recordExam, toggleBookmark } = useActions();
  const gate = useGate();
  const progress = useProgress();
  const isExam = scope === 'exam';
  const insets = useSafeAreaInsets();

  // Prepare questions + a stable shuffled option order, once per session.
  const prepared = useMemo(() => {
    return buildQuiz(scope).map((q) => ({ q, opts: shuffleOptions(q) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // A started mock exam uses up the free tier's daily mock (no-op for Pro).
  const counted = useRef(false);
  useEffect(() => {
    if (isExam && !counted.current) {
      counted.current = true;
      gate.noteMock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const isRight = picked === cur.opts.correctIndex;

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
      <FlowBar
        onClose={nav.back}
        closeLabel={isExam ? 'Quit mock exam' : 'Quit practice'}
        progress={(idx + (revealed || isExam ? 1 : 0)) / total}
        right={
          <IconButton
            icon={bookmarked ? glyph.star : glyph.starOpen}
            color={bookmarked ? colors.red : colors.ink}
            label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
            onPress={() => toggleBookmark(cur.q.id)}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <Text style={styles.kicker} numberOfLines={1}>
            {isExam ? 'MOCK EXAM' : sectionName(cur.q.section).toUpperCase()}
          </Text>
          <Text style={styles.counter} accessibilityLabel={`Question ${idx + 1} of ${total}`}>
            <Text style={{ color: isExam ? colors.red : colors.blue }}>
              {String(idx + 1).padStart(2, '0')}
            </Text>
            <Text style={{ color: colors.inkSoft }}>/{total}</Text>
          </Text>
        </View>

        <Text style={styles.question} accessibilityRole="header">
          {cur.q.question}
        </Text>

        <View style={{ gap: space.sm, marginTop: space.xl }}>
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
            style={[styles.feedback, { borderLeftColor: isRight ? colors.blue : colors.red }]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.feedbackHead}>
              <Icon name={isRight ? glyph.check : glyph.close} size={30} color={isRight ? colors.blue : colors.red} />
              <Text style={[styles.feedbackTitle, { color: isRight ? colors.blue : colors.red }]}>
                {isRight ? 'Correct' : 'Not quite'}
              </Text>
            </View>
            {cur.q.reference ? (
              <Text style={styles.refText}>
                <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>REFERENCE </Text>
                {cur.q.reference}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {isExam ? (
          <View style={styles.footRow}>
            <Button
              label="Back"
              variant="ghost"
              disabled={idx === 0}
              onPress={() => setIdx(Math.max(0, idx - 1))}
              style={{ flex: 1 }}
            />
            <Button
              label={idx === total - 1 ? `Submit ${answeredCount}/${total}` : 'Next'}
              variant={idx === total - 1 ? 'red' : 'primary'}
              trailing={glyph.arrow}
              onPress={idx === total - 1 ? finish : () => setIdx(idx + 1)}
              style={{ flex: 2 }}
            />
          </View>
        ) : (
          <Button
            label={revealed ? (idx === total - 1 ? 'See results' : 'Next question') : 'Select an answer'}
            variant={revealed ? 'primary' : 'ghost'}
            trailing={revealed ? glyph.arrow : undefined}
            disabled={!revealed}
            onPress={next}
          />
        )}
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper },
    content: { padding: space.lg, paddingBottom: 24 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.md },
    kicker: { ...type.kicker, flex: 1 },
    counter: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -1 },
    question: {
      fontFamily: fonts.bold,
      fontSize: 22,
      lineHeight: 29,
      color: colors.ink,
      marginTop: space.md,
    },
    feedback: {
      borderLeftWidth: rule.heavy,
      paddingLeft: space.md,
      paddingVertical: space.xs,
      marginTop: space.xl,
    },
    feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    feedbackTitle: { fontFamily: fonts.black, fontSize: 22, textTransform: 'uppercase', letterSpacing: 1 },
    refText: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkSoft, lineHeight: 20, marginTop: 6 },
    footer: {
      padding: space.lg,
      paddingTop: space.md,
      borderTopWidth: rule.thick,
      borderTopColor: colors.ink,
      backgroundColor: colors.paper,
    },
    footRow: { flexDirection: 'row', gap: space.md },
  }),
);
