import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { QUESTIONS, SECTIONS, type Question } from '../data';
import { useActions, useProgress } from '../storage';
import { colors, font, radius, space } from '../theme';
import { OptionRow } from '../components/ui';

type Filter = 'all' | 'bookmarks' | number;

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipOn : styles.chipOff]}
    >
      <Text style={[styles.chipText, { color: active ? colors.white : colors.blue }]}>{label}</Text>
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
        <Pressable onPress={() => toggleBookmark(q.id)} hitSlop={10}>
          <Text style={[styles.star, marked && { color: colors.amber }]}>{marked ? '★' : '☆'}</Text>
        </Pressable>
      </View>
      <Text style={styles.qText}>{q.question}</Text>
      <View style={{ gap: 8, marginTop: 10 }}>
        {q.options.map((opt, i) => (
          <OptionRow key={i} index={i} text={opt} state={i === q.answer - 1 ? 'correct' : 'idle'} disabled />
        ))}
      </View>
      {q.reference ? <Text style={styles.ref}>📖 {q.reference}</Text> : null}
    </View>
  );
}

export default function ReviewScreen({ initialSection }: { initialSection?: number | 'bookmarks' }) {
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>(initialSection ?? 'all');
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
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
    return list;
  }, [filter, query, progress.bookmarks]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={font.h1}>Answer Key</Text>
        <Text style={[font.mute, { marginTop: 2 }]}>
          Every question with the correct answer in green.
        </Text>
        <View style={styles.search}>
          <Text style={{ color: colors.textFaint, fontSize: 15 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions…"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ color: colors.textFaint, fontSize: 16 }}>✕</Text>
            </Pressable>
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
        ListHeaderComponent={
          <View style={styles.chipsWrap}>
            <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip
              label={`★ Saved (${progress.bookmarks.length})`}
              active={filter === 'bookmarks'}
              onPress={() => setFilter('bookmarks')}
            />
            {SECTIONS.map((s) => (
              <Chip
                key={s.id}
                label={`${s.id}. ${s.name}`}
                active={filter === s.id}
                onPress={() => setFilter(s.id)}
              />
            ))}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 34 }}>🔎</Text>
            <Text style={[font.mute, { marginTop: 8 }]}>No questions match.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    marginTop: space.md,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.text },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: space.md },
  chip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1 },
  chipOn: { backgroundColor: colors.blueBright, borderColor: colors.blueBright },
  chipOff: { backgroundColor: colors.card, borderColor: colors.skyLine },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  listContent: { paddingHorizontal: space.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qNum: { fontSize: 11, fontWeight: '800', color: colors.blue, letterSpacing: 0.5 },
  star: { fontSize: 20, color: colors.textFaint },
  qText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4, lineHeight: 22 },
  ref: { fontSize: 12, color: colors.textMute, marginTop: 10, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
});
