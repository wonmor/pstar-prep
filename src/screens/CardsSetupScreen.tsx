import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useProgress } from '../storage';
import { colors, fonts, glyph, rule, space, type, themed } from '../theme';
import { Glyph, ScreenHeader } from '../components/ui';
import { SectionList } from '../components/SectionList';
import { ExamSwitch } from '../components/ExamSwitch';
import { ProBanner } from '../components/ProBanner';

function DeckRow({
  mark,
  tint,
  title,
  desc,
  count,
  onPress,
  disabled,
}: {
  mark: string;
  tint: string;
  title: string;
  desc: string;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} cards. ${desc}`}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.deck,
        disabled && { opacity: 0.45 },
        pressed && { backgroundColor: colors.paperDeep },
      ]}
    >
      <Glyph size={30} color={tint} style={{ width: 36 }}>
        {mark}
      </Glyph>
      <View style={{ flex: 1 }}>
        <Text style={styles.deckTitle}>{title}</Text>
        <Text style={type.mute}>{desc}</Text>
      </View>
      <Text style={styles.deckCount}>{count}</Text>
    </Pressable>
  );
}

export default function CardsSetupScreen() {
  const nav = useNav();
  const p = useProgress();
  const gate = useGate();
  const { QUESTIONS } = useExam();
  const allCount = gate.visible().length;
  const saved = gate.visible(QUESTIONS.filter((q) => p.bookmarks.includes(q.id))).length;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        index="03"
        title="Flashcards"
        accent="yellow"
        sub="Tap a card to flip it — question on the front, answer & reference on the back."
      />

      <ExamSwitch style={{ marginBottom: space.xl }} />

      <View style={styles.decks}>
        <DeckRow
          mark={glyph.square}
          tint={colors.blue}
          title={gate.isPro ? 'All questions' : 'All free cards'}
          desc={gate.isPro ? 'Shuffle the entire bank' : `Free sample · all ${QUESTIONS.length} with Pro`}
          count={allCount}
          onPress={() => nav.push({ name: 'cards', scope: 'all' })}
        />
        <DeckRow
          mark={glyph.star}
          tint={colors.red}
          title="Bookmarked"
          desc="Cards you starred"
          count={saved}
          disabled={saved === 0}
          onPress={() => nav.push({ name: 'cards', scope: 'bookmarks' })}
        />
      </View>

      <Text style={[type.h2, { marginTop: space.xxl, marginBottom: space.sm }]}>By section</Text>
      <SectionList
        onPick={(id) => nav.push({ name: 'cards', scope: id })}
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
    decks: { borderTopWidth: rule.thick, borderTopColor: colors.ink },
    deck: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 64,
      paddingVertical: space.md,
      borderBottomWidth: rule.mid,
      borderBottomColor: colors.ink,
    },
    deckTitle: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
    deckCount: { fontFamily: fonts.black, fontSize: 30, color: colors.ink, letterSpacing: -1 },
  }),
);
