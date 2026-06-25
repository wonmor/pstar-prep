import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QUESTIONS, questionsForSection, sectionName, shuffle, type Question } from '../data';
import { useNav } from '../nav';
import { useActions, useProgress } from '../storage';
import { colors, font, radius, shadow, space } from '../theme';
import { Button, Pill, ProgressBar } from '../components/ui';

function deckFor(scope: 'all' | 'bookmarks' | number, bookmarks: string[]): Question[] {
  if (scope === 'all') return shuffle(QUESTIONS);
  if (scope === 'bookmarks') return shuffle(QUESTIONS.filter((q) => bookmarks.includes(q.id)));
  return shuffle(questionsForSection(scope));
}

export default function FlashcardsScreen({ scope }: { scope: 'all' | 'bookmarks' | number }) {
  const nav = useNav();
  const progress = useProgress();
  const { setKnown, toggleBookmark } = useActions();

  const deck = useMemo(() => deckFor(scope, progress.bookmarks), [scope]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (deck.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 40 }}>🗂️</Text>
        <Text style={[font.h3, { marginTop: 10 }]}>No cards in this deck yet.</Text>
        <Button label="Back" variant="ghost" onPress={nav.back} style={{ marginTop: space.lg }} />
      </View>
    );
  }

  const q = deck[idx];
  const isKnown = progress.known.includes(q.id);
  const bookmarked = progress.bookmarks.includes(q.id);
  const title =
    scope === 'all' ? 'All cards' : scope === 'bookmarks' ? 'Bookmarked' : sectionName(scope);

  function advance(known: boolean) {
    setKnown(q.id, known);
    if (idx < deck.length - 1) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      nav.back();
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Pressable onPress={nav.back} hitSlop={10} style={styles.barBtn}>
          <Text style={styles.barBtnText}>✕</Text>
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: space.md }}>
          <ProgressBar value={(idx + 1) / deck.length} />
        </View>
        <Pressable onPress={() => toggleBookmark(q.id)} hitSlop={10} style={styles.barBtn}>
          <Text style={[styles.barBtnText, { fontSize: 18 }]}>{bookmarked ? '★' : '☆'}</Text>
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Pill label={title.toUpperCase()} tone="sky" />
        <Text style={font.mute}>
          {idx + 1} / {deck.length}
        </Text>
      </View>

      {/* The card */}
      <Pressable style={styles.cardWrap} onPress={() => setFlipped((f) => !f)}>
        <View style={[styles.card, flipped ? styles.cardBack : styles.cardFront]}>
          <Text style={[styles.face, { color: flipped ? colors.green : colors.blueBright }]}>
            {flipped ? 'ANSWER' : 'QUESTION'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <Text style={styles.qText}>{q.question}</Text>

            {!flipped ? (
              <View style={{ marginTop: space.lg, gap: 8 }}>
                {q.options.map((o, i) => (
                  <Text key={i} style={styles.optDim}>
                    ({i + 1}) {o}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: space.lg }}>
                <View style={styles.answerBox}>
                  <View style={styles.answerCircle}>
                    <Text style={styles.answerCircleText}>✓</Text>
                  </View>
                  <Text style={styles.answerText}>{q.options[q.answer - 1]}</Text>
                </View>
                {q.reference ? (
                  <Text style={styles.ref}>
                    <Text style={{ fontWeight: '800' }}>📖 Reference{'\n'}</Text>
                    {q.reference}
                  </Text>
                ) : null}
              </View>
            )}
          </ScrollView>
          <Text style={styles.flipHint}>{flipped ? 'Tap to see question' : 'Tap to reveal answer'}</Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        {isKnown ? <Pill label="✓ Marked as mastered" tone="green" /> : <View />}
        <View style={styles.footRow}>
          <Button
            label="↻ Review again"
            variant="ghost"
            onPress={() => advance(false)}
            style={{ flex: 1 }}
          />
          <Button label="✓ Got it" variant="success" onPress={() => advance(true)} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: space.sm },
  barBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  barBtnText: { fontSize: 20, color: colors.navy, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  cardWrap: { flex: 1, padding: space.lg },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    padding: space.xl,
    borderWidth: 1.5,
    ...shadow.float,
  },
  cardFront: { backgroundColor: colors.card, borderColor: colors.skyLine },
  cardBack: { backgroundColor: '#F2FBF6', borderColor: colors.green },
  face: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: space.md },
  qText: { fontSize: 21, fontWeight: '700', color: colors.text, lineHeight: 29 },
  optDim: { fontSize: 14, color: colors.textMute, lineHeight: 20 },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  answerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerCircleText: { color: colors.white, fontWeight: '900', fontSize: 16 },
  answerText: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.navy, lineHeight: 23 },
  ref: { fontSize: 13, color: colors.textMute, lineHeight: 19, marginTop: space.lg },
  flipHint: { textAlign: 'center', fontSize: 12, color: colors.textFaint, marginTop: space.md, fontWeight: '600' },
  footer: {
    padding: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: space.md,
  },
  footRow: { flexDirection: 'row', gap: space.md },
});
