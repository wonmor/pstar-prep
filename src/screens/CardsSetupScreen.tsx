import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { QUESTIONS } from '../data';
import { useNav } from '../nav';
import { useProgress } from '../storage';
import { colors, font, space } from '../theme';
import { Card, Pill } from '../components/ui';
import { SectionList } from '../components/SectionList';
import { Pressable } from 'react-native';

function BigChoice({
  title,
  desc,
  count,
  tint,
  onPress,
  disabled,
}: {
  title: string;
  desc: string;
  count: number;
  tint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.choice, { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <View style={{ flex: 1 }}>
        <Text style={font.h3}>{title}</Text>
        <Text style={font.mute}>{desc}</Text>
      </View>
      <Pill label={`${count}`} tone="sky" />
    </Pressable>
  );
}

export default function CardsSetupScreen() {
  const nav = useNav();
  const p = useProgress();
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={font.h1}>Flashcards</Text>
      <Text style={[font.mute, { marginTop: 4, marginBottom: space.lg }]}>
        Tap a card to flip it — front shows the question, back reveals the answer & reference.
      </Text>

      <Card style={{ gap: space.md, padding: space.md }}>
        <BigChoice
          title="All questions"
          desc="Shuffle the entire bank"
          count={QUESTIONS.length}
          tint={colors.blueBright}
          onPress={() => nav.push({ name: 'cards', scope: 'all' })}
        />
        <BigChoice
          title="Bookmarked"
          desc="Cards you starred"
          count={p.bookmarks.length}
          tint={colors.amber}
          disabled={p.bookmarks.length === 0}
          onPress={() => nav.push({ name: 'cards', scope: 'bookmarks' })}
        />
      </Card>

      <Text style={[font.h2, { marginTop: space.xl, marginBottom: space.md }]}>By section</Text>
      <SectionList onPick={(id) => nav.push({ name: 'cards', scope: id })} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
