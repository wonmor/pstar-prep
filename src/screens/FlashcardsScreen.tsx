import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shuffle, type Question } from '../data';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useActions, useProgress } from '../storage';
import { illustrationFor, illustrationsForExam, questionIdsFor, type Illustration as Ill } from '../illustrations';
import { cardSurface, colors, fonts, glyph, radius, rule, space, type, themed } from '../theme';
import { Button, FlowBar, IconButton, Icon } from '../components/ui';
import { Illustration } from '../components/Illustration';
import { FlipCard } from '../components/FlipCard';

// A deck holds question cards and, in the visual deck, diagram cards whose
// front is the drawing and whose back is the explanation.
type Card = { kind: 'q'; q: Question; ill?: Ill } | { kind: 'ill'; ill: Ill };

export default function FlashcardsScreen({ scope }: { scope: 'all' | 'bookmarks' | 'visual' | number }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const gate = useGate();
  const { id: examId, QUESTIONS, questionsForSection, sectionName } = useExam();
  const { setKnown, toggleBookmark } = useActions();

  // Free tier: "all", "bookmarks" and "visual" decks only draw from free sections.
  const deck = useMemo<Card[]>(() => {
    const withIll = (qs: Question[]): Card[] => qs.map((q) => ({ kind: 'q', q, ill: illustrationFor(examId, q.id) }));
    if (scope === 'all') return shuffle(withIll(gate.visible(QUESTIONS)));
    if (scope === 'bookmarks')
      return shuffle(withIll(gate.visible(QUESTIONS.filter((q) => progress.bookmarks.includes(q.id)))));
    if (scope === 'visual') {
      const cards: Card[] = illustrationsForExam(examId)
        .filter((ill) => {
          const qids = questionIdsFor(ill, examId);
          return qids.length === 0 || gate.visible(QUESTIONS.filter((q) => qids.includes(q.id))).length > 0;
        })
        .map((ill) => ({ kind: 'ill', ill }));
      return shuffle(cards);
    }
    return shuffle(withIll(questionsForSection(scope)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (deck.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name={glyph.cards} size={72} color={colors.yellow} />
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

  const card = deck[idx];
  const knownKey = card.kind === 'q' ? card.q.id : `ill:${card.ill.id}`;
  const isKnown = progress.known.includes(knownKey);
  const bookmarked = card.kind === 'q' && progress.bookmarks.includes(card.q.id);
  const title =
    scope === 'all' ? 'All cards' : scope === 'bookmarks' ? 'Bookmarked' : scope === 'visual' ? 'Visual cards' : sectionName(scope);

  function advance(known: boolean) {
    setKnown(knownKey, known);
    if (idx < deck.length - 1) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      nav.back();
    }
  }

  const faceHead = (label: string, back: boolean) => (
    <View style={[styles.face, { backgroundColor: back ? colors.blue : colors.yellow }]}>
      <Text style={[styles.faceText, { color: back ? colors.onAccent : colors.onYellow }]}>{label}</Text>
      <Icon name={back ? glyph.check : card.kind === 'ill' ? glyph.diagram : glyph.help} size={18} color={back ? colors.onAccent : colors.onYellow} />
    </View>
  );
  const hint = (back: boolean) => (
    <Text style={styles.flipHint}>
      <Icon name={glyph.flip} size={13} color={colors.inkSoft} /> {back ? 'Tap to see the front' : card.kind === 'ill' ? 'Tap for the explanation' : 'Tap to reveal answer'}
    </Text>
  );

  const front =
    card.kind === 'q' ? (
      <View style={styles.card}>
        {faceHead('QUESTION', false)}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardBody}>
          {card.ill ? <Illustration ill={card.ill} caption={false} maxHeight={220} style={{ marginBottom: space.lg }} /> : null}
          <Text style={styles.qText}>{card.q.question}</Text>
          <View style={{ marginTop: space.lg, gap: space.sm }}>
            {card.q.options.map((o, i) => (
              <View key={i} style={styles.optLine}>
                <Text style={styles.optNum}>{i + 1}</Text>
                <Text style={styles.optDim}>{o}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        {hint(false)}
      </View>
    ) : (
      <View style={styles.card}>
        {faceHead(card.ill.topic.toUpperCase(), false)}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.cardBody, { justifyContent: 'flex-start' }]}>
          <Illustration ill={card.ill} caption={false} maxHeight={320} />
          <Text style={[styles.qText, { marginTop: space.lg }]}>{card.ill.title}</Text>
          <Text style={[type.mute, { marginTop: space.xs }]}>What does this diagram tell you?</Text>
        </ScrollView>
        {hint(false)}
      </View>
    );

  const back =
    card.kind === 'q' ? (
      <View style={[styles.card, styles.cardBack]}>
        {faceHead('ANSWER', true)}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardBody}>
          <Text style={styles.qText}>{card.q.question}</Text>
          <View style={{ marginTop: space.lg }}>
            <View style={styles.answerBox}>
              <Icon name={glyph.check} size={28} color={colors.onAccent} />
              <Text style={styles.answerText}>{card.q.options[card.q.answer - 1]}</Text>
            </View>
            {card.ill ? (
              <Text style={styles.ref}>
                <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>DIAGRAM{'\n'}</Text>
                {card.ill.caption}
              </Text>
            ) : null}
            {card.q.reference ? (
              <Text style={styles.ref}>
                <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>REFERENCE{'\n'}</Text>
                {card.q.reference}
              </Text>
            ) : null}
          </View>
        </ScrollView>
        {hint(true)}
      </View>
    ) : (
      <View style={[styles.card, styles.cardBack]}>
        {faceHead('EXPLANATION', true)}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.cardBody, { justifyContent: 'flex-start' }]}>
          <Text style={styles.qText}>{card.ill.title}</Text>
          <View style={[styles.answerBox, { marginTop: space.lg }]}>
            <Text style={styles.answerText}>{card.ill.caption}</Text>
          </View>
          <Text style={[styles.ref, { color: colors.ink }]}>{card.ill.explanation}</Text>
          {questionIdsFor(card.ill, examId).length > 0 ? (
            <Text style={styles.ref}>
              <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>QUESTIONS{'\n'}</Text>
              {questionIdsFor(card.ill, examId).join(', ')}
            </Text>
          ) : null}
        </ScrollView>
        {hint(true)}
      </View>
    );

  return (
    <View style={styles.root}>
      <FlowBar
        onClose={nav.back}
        closeLabel="Close flashcards"
        progress={(idx + 1) / deck.length}
        right={
          card.kind === 'q' ? (
            <IconButton
              icon={bookmarked ? glyph.star : glyph.starOpen}
              color={bookmarked ? colors.red : colors.ink}
              label={bookmarked ? 'Remove bookmark' : 'Bookmark card'}
              onPress={() => toggleBookmark(card.q.id)}
            />
          ) : undefined
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
        accessibilityHint={flipped ? 'Shows the front of the card' : card.kind === 'ill' ? 'Reveals the explanation' : 'Reveals the answer'}
      >
        <FlipCard flipped={flipped} front={front} back={back} />
      </Pressable>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {isKnown ? <Text style={styles.mastered}><Icon name={glyph.check} size={14} color={colors.blue} /> MARKED AS MASTERED</Text> : null}
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
    root: { flex: 1 },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space.xl,
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
    card: { ...cardSurface(), flex: 1, overflow: 'hidden' },
    cardBack: { borderColor: colors.blue, borderBottomColor: colors.blue },
    face: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space.lg,
      paddingVertical: space.sm,
      borderTopLeftRadius: radius - 1,
      borderTopRightRadius: radius - 1,
    },
    faceText: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 3 },
    cardBody: { flexGrow: 1, justifyContent: 'center', padding: space.lg },
    qText: { fontFamily: fonts.bold, fontSize: 21, color: colors.ink, lineHeight: 28 },
    optLine: { flexDirection: 'row', gap: space.md },
    optNum: { fontFamily: fonts.black, fontSize: 16, color: colors.inkSoft, width: 14 },
    optDim: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.inkSoft, lineHeight: 21 },
    answerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: colors.blue,
      padding: space.lg,
      borderRadius: radius,
    },
    answerText: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: colors.onAccent, lineHeight: 23 },
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
      borderTopWidth: rule.hair,
      borderTopColor: colors.line,
      backgroundColor: colors.card,
      gap: space.sm,
    },
    mastered: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 2, color: colors.blue },
    footRow: { flexDirection: 'row', gap: space.md },
  }),
);
