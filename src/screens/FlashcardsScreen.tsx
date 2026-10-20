import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shuffle, type Question } from '../data';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useActions, useProgress } from '../storage';
import { colors, fonts, glyph, rule, space, type, themed } from '../theme';
import { Button, FlowBar, Glyph, IconButton } from '../components/ui';

export default function FlashcardsScreen({ scope }: { scope: 'all' | 'bookmarks' | number }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const gate = useGate();
  const { QUESTIONS, questionsForSection, sectionName } = useExam();
  const { setKnown, toggleBookmark } = useActions();

  // Free tier: "all" and "bookmarks" decks only draw from free sections.
  const deck = useMemo<Question[]>(() => {
    if (scope === 'all') return shuffle(gate.visible(QUESTIONS));
    if (scope === 'bookmarks')
      return shuffle(gate.visible(QUESTIONS.filter((q) => progress.bookmarks.includes(q.id))));
    return shuffle(questionsForSection(scope));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (deck.length === 0) {
    return (
      <View style={styles.empty}>
        <Glyph size={72} color={colors.yellow}>
          {glyph.square}
        </Glyph>
        <Text style={[type.h3, { marginTop: 10 }]}>No cards in this deck yet.</Text>
        <Button
          label="Back"
          variant="ghost"
          onPress={nav.back}
          style={{ marginTop: space.lg, alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  const q = deck[idx];
  const isKnown = progress.known.includes(q.id);
  const bookmarked = progress.bookmarks.includes(q.id);
  const title = scope === 'all' ? 'All cards' : scope === 'bookmarks' ? 'Bookmarked' : sectionName(scope);

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
      <FlowBar
        onClose={nav.back}
        closeLabel="Close flashcards"
        progress={(idx + 1) / deck.length}
        right={
          <IconButton
            glyphText={bookmarked ? glyph.star : glyph.starOpen}
            color={bookmarked ? colors.red : colors.ink}
            label={bookmarked ? 'Remove bookmark' : 'Bookmark card'}
            onPress={() => toggleBookmark(q.id)}
          />
        }
      />

      <View style={styles.metaRow}>
        <Text style={[type.kicker, { flex: 1 }]} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>
        <Text style={styles.counter}>
          <Text style={{ color: colors.red }}>{String(idx + 1).padStart(2, '0')}</Text>
          <Text style={{ color: colors.inkSoft }}>/{deck.length}</Text>
        </Text>
      </View>

      <Pressable
        testID="flashcard"
        style={styles.cardWrap}
        onPress={() => setFlipped((f) => !f)}
        accessibilityRole="button"
        accessibilityHint={flipped ? 'Shows the question' : 'Reveals the answer'}
      >
        <View style={[styles.card, flipped && styles.cardBack]}>
          <View style={[styles.face, { backgroundColor: flipped ? colors.blue : colors.yellow }]}>
            <Text style={[styles.faceText, { color: flipped ? colors.onAccent : colors.onYellow }]}>
              {flipped ? 'ANSWER' : 'QUESTION'}
            </Text>
            <Glyph size={18} color={flipped ? colors.onAccent : colors.onYellow}>
              {flipped ? glyph.check : '?'}
            </Glyph>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardBody}
          >
            <Text style={styles.qText}>{q.question}</Text>

            {!flipped ? (
              <View style={{ marginTop: space.lg, gap: space.sm }}>
                {q.options.map((o, i) => (
                  <View key={i} style={styles.optLine}>
                    <Text style={styles.optNum}>{i + 1}</Text>
                    <Text style={styles.optDim}>{o}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: space.lg }}>
                <View style={styles.answerBox}>
                  <Glyph size={28} color={colors.onAccent}>
                    {glyph.check}
                  </Glyph>
                  <Text style={styles.answerText}>{q.options[q.answer - 1]}</Text>
                </View>
                {q.reference ? (
                  <Text style={styles.ref}>
                    <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>REFERENCE{'\n'}</Text>
                    {q.reference}
                  </Text>
                ) : null}
              </View>
            )}
          </ScrollView>
          <Text style={styles.flipHint}>
            {glyph.refresh} {flipped ? 'Tap to see question' : 'Tap to reveal answer'}
          </Text>
        </View>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {isKnown ? <Text style={styles.mastered}>{glyph.check} MARKED AS MASTERED</Text> : null}
        <View style={styles.footRow}>
          <Button
            label="Again"
            variant="ghost"
            trailing={glyph.refresh}
            onPress={() => advance(false)}
            style={{ flex: 1 }}
          />
          <Button
            label="Got it"
            variant="blue"
            trailing={glyph.check}
            onPress={() => advance(true)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space.xl,
      backgroundColor: colors.paper,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: space.lg,
      marginTop: space.md,
      gap: space.md,
    },
    counter: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -1 },
    cardWrap: { flex: 1, padding: space.lg, paddingTop: space.md },
    card: { flex: 1, borderWidth: rule.thick, borderColor: colors.ink, backgroundColor: colors.paper },
    cardBack: { borderColor: colors.blue },
    face: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
    },
    faceText: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3 },
    cardBody: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
    qText: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink, lineHeight: 29 },
    optLine: { flexDirection: 'row', gap: space.md },
    optNum: { fontFamily: fonts.black, fontSize: 16, color: colors.inkSoft, width: 14 },
    optDim: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.inkSoft, lineHeight: 21 },
    answerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: colors.blue,
      padding: space.lg,
    },
    answerText: { flex: 1, fontFamily: fonts.bold, fontSize: 18, color: colors.onAccent, lineHeight: 24 },
    ref: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.inkSoft,
      lineHeight: 20,
      marginTop: space.lg,
    },
    flipHint: {
      textAlign: 'center',
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1,
      color: colors.inkSoft,
      paddingVertical: space.sm,
    },
    footer: {
      padding: space.lg,
      paddingTop: space.md,
      borderTopWidth: rule.thick,
      borderTopColor: colors.ink,
      backgroundColor: colors.paper,
      gap: space.sm,
    },
    mastered: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 2, color: colors.blue },
    footRow: { flexDirection: 'row', gap: space.md },
  }),
);
