// "Spot it": tap the right marking, light, sign or leg on a diagram. Targets
// are rectangles from the manifest laid over the drawing; a tap reveals the
// answer and the explanation, then moves on. Diagrams whose questions are all
// in locked sections are left out for free users.
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shuffle } from '../data';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useActions } from '../storage';
import { questionIdsFor, spotsForExam, type Illustration as Ill, type SpotTarget } from '../illustrations';
import { dur, useReducedMotion } from '../motion';
import { cardSurface, colors, fonts, glyph, radius, rule, space, type, themed } from '../theme';
import { Button, FlowBar, Icon } from '../components/ui';
import { Illustration } from '../components/Illustration';
import { Ring } from '../components/Ring';

function Target({
  t,
  ill,
  state,
  onPress,
}: {
  t: SpotTarget;
  ill: Ill;
  state: 'idle' | 'correct' | 'wrong' | 'reveal';
  onPress: () => void;
}) {
  const [x, y, w, h] = t.rect;
  const pct = (v: number, of: number) => `${(v / of) * 100}%` as const;
  const border = state === 'correct' || state === 'reveal' ? colors.blue : state === 'wrong' ? colors.red : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={state !== 'idle'}
      accessibilityRole="button"
      accessibilityLabel={t.label}
      accessibilityState={{ disabled: state !== 'idle', selected: state === 'correct' || state === 'wrong' }}
      testID={`spot-${t.id}`}
      style={({ pressed }) => [
        {
          position: 'absolute',
          left: pct(x, ill.width),
          top: pct(y, ill.height),
          width: pct(w, ill.width),
          height: pct(h, ill.height),
          borderWidth: state === 'idle' ? 0 : 3,
          borderColor: border,
          borderRadius: 4,
          backgroundColor: pressed && state === 'idle' ? colors.backdrop : 'transparent',
          opacity: pressed && state === 'idle' ? 0.15 : 1,
        },
      ]}
    >
      {state === 'correct' || state === 'reveal' ? (
        <View style={styles.mark}>
          <Icon name={glyph.check} size={16} color={colors.onAccent} />
        </View>
      ) : state === 'wrong' ? (
        <View style={[styles.mark, { backgroundColor: colors.red }]}>
          <Icon name={glyph.close} size={16} color={colors.onAccent} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function SpotScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const gate = useGate();
  const reduced = useReducedMotion();
  const { id: exam, QUESTIONS } = useExam();
  const { recordSpot } = useActions();

  const items = useMemo(() => {
    const all = spotsForExam(exam).filter((ill) => {
      const qids = questionIdsFor(ill, exam);
      if (qids.length === 0) return true;
      return gate.visible(QUESTIONS.filter((q) => qids.includes(q.id))).length > 0;
    });
    return shuffle(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const fb = useRef(new Animated.Value(0)).current;

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name={glyph.spot} size={72} color={colors.blue} />
        <Text style={[type.h3, { marginTop: 10 }]}>No diagrams to spot yet.</Text>
        <Button label="Back" variant="ghost" onPress={nav.back} style={{ marginTop: space.lg, alignSelf: 'stretch' }} />
      </View>
    );
  }

  if (done) {
    const pct = score / items.length;
    return (
      <View style={styles.root}>
        <FlowBar onClose={nav.back} closeLabel="Close spot it" progress={1} />
        <View style={styles.summary}>
          <Ring value={pct} size={160} stroke={14} color={pct >= 0.7 ? colors.blue : colors.red} label={`${score}/${items.length}`} sub="spotted" />
          <Text style={[type.h2, { marginTop: space.xl, textAlign: 'center' }]}>
            {pct === 1 ? 'Sharp eyes.' : pct >= 0.7 ? 'Good spotting.' : 'Keep looking.'}
          </Text>
          <Text style={[type.mute, { textAlign: 'center', marginTop: space.sm }]}>
            Each diagram is also in the visual flashcard deck and on its questions.
          </Text>
          <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xl, alignSelf: 'stretch' }}>
            <Button
              label="Again"
              variant="ghost"
              trailing={glyph.refresh}
              style={{ flex: 1 }}
              onPress={() => {
                setIdx(0);
                setPicked(null);
                setScore(0);
                setDone(false);
              }}
            />
            <Button label="Done" variant="blue" trailing={glyph.check} style={{ flex: 1 }} onPress={nav.back} />
          </View>
        </View>
      </View>
    );
  }

  const ill = items[idx];
  const spot = ill.spot!;
  const correctId = spot.targets.find((t) => t.correct)!.id;
  const isRight = picked === correctId;

  function choose(t: SpotTarget) {
    if (picked) return;
    setPicked(t.id);
    const ok = t.correct;
    if (ok) setScore((s) => s + 1);
    recordSpot(ill.id, ok);
    fb.setValue(0);
    Animated.timing(fb, { toValue: 1, duration: dur(260, reduced), useNativeDriver: true }).start();
  }

  function next() {
    if (idx < items.length - 1) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  }

  const stateFor = (t: SpotTarget): 'idle' | 'correct' | 'wrong' | 'reveal' => {
    if (!picked) return 'idle';
    if (t.id === picked) return t.correct ? 'correct' : 'wrong';
    if (t.correct) return 'reveal';
    return 'idle';
  };

  return (
    <View style={styles.root}>
      <FlowBar onClose={nav.back} closeLabel="Close spot it" progress={(idx + (picked ? 1 : 0)) / items.length} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <Text style={[type.kicker, { flex: 1 }]} numberOfLines={1}>
            SPOT IT | {ill.topic.toUpperCase()}
          </Text>
          <Text style={styles.counter}>
            <Text style={{ color: colors.blue }}>{String(idx + 1).padStart(2, '0')}</Text>
            <Text style={{ color: colors.inkSoft }}>/{items.length}</Text>
          </Text>
        </View>
        <Text style={styles.prompt} accessibilityRole="header">
          {spot.prompt}
        </Text>
        <Illustration ill={ill} caption={false} style={{ marginTop: space.lg }} testID={`spot-illustration-${ill.id}`}>
          {spot.targets.map((t) => (
            <Target key={t.id} t={t} ill={ill} state={stateFor(t)} onPress={() => choose(t)} />
          ))}
        </Illustration>
        {!picked ? (
          <Text style={[type.mute, { marginTop: space.sm }]}>
            <Icon name={glyph.eye} size={14} color={colors.inkSoft} /> Tap the diagram where the answer is.
          </Text>
        ) : (
          <Animated.View
            style={[
              styles.feedback,
              { borderLeftColor: isRight ? colors.blue : colors.red },
              { opacity: fb, transform: [{ translateY: fb.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
            ]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.feedbackHead}>
              <Icon name={isRight ? glyph.check : glyph.close} size={28} color={isRight ? colors.blue : colors.red} />
              <Text style={[styles.feedbackTitle, { color: isRight ? colors.blue : colors.red }]}>
                {isRight ? 'Spotted' : 'Not there'}
              </Text>
            </View>
            <Text style={styles.answer}>{spot.targets.find((t) => t.correct)!.label}</Text>
            <Text style={styles.explain}>{ill.explanation}</Text>
          </Animated.View>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button
          label={picked ? (idx === items.length - 1 ? 'See score' : 'Next diagram') : 'Tap the diagram'}
          variant={picked ? 'primary' : 'ghost'}
          trailing={picked ? glyph.arrow : undefined}
          disabled={!picked}
          onPress={next}
          testID="spot-next"
        />
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
    content: { padding: space.lg, paddingBottom: 24 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.md },
    counter: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -1 },
    prompt: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, color: colors.ink, marginTop: space.md },
    mark: {
      position: 'absolute',
      top: -12,
      right: -12,
      width: 24,
      height: 24,
      borderRadius: 4,
      backgroundColor: colors.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedback: { ...cardSurface(), borderLeftWidth: 4, padding: space.lg, marginTop: space.lg },
    feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    feedbackTitle: { fontFamily: fonts.black, fontSize: 20, textTransform: 'uppercase', letterSpacing: 1 },
    answer: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, marginTop: space.sm },
    explain: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.inkSoft, marginTop: space.sm },
    footer: {
      padding: space.lg,
      paddingTop: space.md,
      borderTopWidth: rule.hair,
      borderTopColor: colors.line,
      backgroundColor: colors.card,
    },
    summary: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  }),
);
