import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Question } from '../data';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { useActions, useProgress } from '../storage';
import { colors, fonts, glyph, rule, space, TOUCH, type, themed } from '../theme';
import { Glyph, IconButton, OptionRow, ScreenHeader } from '../components/ui';
import { ProBanner } from '../components/ProBanner';

type Filter = 'all' | 'bookmarks' | number;

function Chip({
  label,
  active,
  locked,
  onPress,
}: {
  label: string;
  active: boolean;
  locked?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${locked ? ', locked, Pro only' : ''}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipOn,
        pressed && !active && { backgroundColor: colors.paperDeep },
      ]}
    >
      {locked ? (
        <Glyph size={11} color={colors.red}>
          {glyph.lock}
        </Glyph>
      ) : null}
      <Text
        style={[styles.chipText, { color: active ? colors.paper : locked ? colors.inkSoft : colors.ink }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function QuestionCard({ q }: { q: Question }) {
  const { toggleBookmark } = useActions();
  const progress = useProgress();
  const marked = progress.bookmarks.includes(q.id);
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.qNum}>Q {q.id}</Text>
        <IconButton
          glyphText={marked ? glyph.star : glyph.starOpen}
          color={marked ? colors.red : colors.ink}
          size={22}
          label={marked ? `Remove bookmark from question ${q.id}` : `Bookmark question ${q.id}`}
          onPress={() => toggleBookmark(q.id)}
        />
      </View>
      <Text style={styles.qText}>{q.question}</Text>
      <View style={{ gap: space.sm, marginTop: space.md }}>
        {q.options.map((opt, i) => (
          <OptionRow key={i} index={i} text={opt} state={i === q.answer - 1 ? 'correct' : 'idle'} disabled />
        ))}
      </View>
      {q.reference ? (
        <Text style={styles.ref}>
          REF {glyph.dot} {q.reference}
        </Text>
      ) : null}
    </View>
  );
}

export default function ReviewScreen({ initialSection }: { initialSection?: number | 'bookmarks' }) {
  const nav = useNav();
  const progress = useProgress();
  const gate = useGate();
  const { QUESTIONS, SECTIONS } = useExam();
  const [filter, setFilter] = useState<Filter>(initialSection ?? 'all');
  const [query, setQuery] = useState('');

  const { data, hidden } = useMemo(() => {
    let list = QUESTIONS;
    if (filter === 'bookmarks') list = list.filter((q) => progress.bookmarks.includes(q.id));
    else if (typeof filter === 'number') list = list.filter((q) => q.section === filter);
    const term = query.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (q) =>
          q.question.toLowerCase().includes(term) ||
          q.options.some((o) => o.toLowerCase().includes(term)) ||
          q.id.includes(term),
      );
    }
    const visible = gate.visible(list);
    return { data: visible, hidden: list.length - visible.length };
  }, [QUESTIONS, filter, query, progress.bookmarks, gate]);

  const pickSection = (id: number) =>
    gate.canSection(id) ? setFilter(id) : nav.push({ name: 'paywall', reason: 'section' });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <ScreenHeader
          index="04"
          title="Answer Key"
          accent="blue"
          sub={`Every question with the correct answer marked ${glyph.check}.`}
        />
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions…"
            placeholderTextColor={colors.inkSoft}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search questions"
          />
          {query ? (
            <IconButton glyphText={glyph.close} size={18} label="Clear search" onPress={() => setQuery('')} />
          ) : null}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => <QuestionCard q={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.chipsWrap}>
            <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip
              label={`${glyph.star} Saved ${progress.bookmarks.length}`}
              active={filter === 'bookmarks'}
              onPress={() => setFilter('bookmarks')}
            />
            {SECTIONS.map((s) => (
              <Chip
                key={s.id}
                label={`${s.id}. ${s.name}`}
                active={filter === s.id}
                locked={!gate.canSection(s.id)}
                onPress={() => pickSection(s.id)}
              />
            ))}
          </View>
        }
        ListFooterComponent={
          hidden > 0 ? (
            <View style={{ marginTop: space.md }}>
              <Text style={[type.mute, { marginBottom: space.sm }]}>
                {glyph.lock} {hidden} more {hidden === 1 ? 'answer' : 'answers'} in locked sections.
              </Text>
              <ProBanner reason="answers" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          hidden > 0 ? null : (
            <View style={styles.emptyState}>
              <Glyph size={56} color={colors.red}>
                {glyph.close}
              </Glyph>
              <Text style={[type.mute, { marginTop: 8 }]}>No questions match.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper },
    header: { paddingHorizontal: space.lg, paddingTop: space.lg },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      borderWidth: rule.mid,
      borderColor: colors.ink,
      paddingLeft: space.md,
      minHeight: TOUCH + 4,
      marginBottom: space.md,
    },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, fontFamily: fonts.medium, color: colors.ink },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingBottom: space.lg },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: TOUCH,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: rule.mid,
      borderColor: colors.ink,
    },
    chipOn: { backgroundColor: colors.ink },
    chipText: { fontFamily: fonts.bold, fontSize: 13 },
    listContent: { paddingHorizontal: space.lg, paddingBottom: 40 },
    card: {
      borderTopWidth: rule.thick,
      borderTopColor: colors.ink,
      paddingTop: space.xs,
      marginBottom: space.xl,
    },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qNum: { ...type.kicker, color: colors.blue },
    qText: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, lineHeight: 23 },
    ref: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.inkSoft,
      marginTop: space.md,
      lineHeight: 19,
    },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
  }),
);
