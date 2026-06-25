import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Disclaimer } from '../components/Disclaimer';
import { EXAM_SIZE, PASS_PCT, QUESTIONS, SECTIONS } from '../data';
import { useNav } from '../nav';
import { useProgress } from '../storage';
import { colors, font, radius, shadow, space } from '../theme';
import { Card, Pill, ProgressBar } from '../components/ui';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModeTile({
  title,
  desc,
  icon,
  tint,
  onPress,
}: {
  title: string;
  desc: string;
  icon: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: tint }]}>
        <Text style={styles.tileEmoji}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileDesc}>{desc}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const nav = useNav();
  const p = useProgress();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const seenIds = Object.keys(p.stats);
  const totalSeen = seenIds.length;
  const totalCorrect = seenIds.reduce((n, id) => n + (p.stats[id].lastCorrect ? 1 : 0), 0);
  const accuracy = totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : 0;
  const coverage = QUESTIONS.length ? totalSeen / QUESTIONS.length : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Text style={styles.kicker}>TRANSPORT CANADA · TP 11919E</Text>
          <Pill label="7th ED · 2022" tone="navy" />
        </View>
        <Text style={styles.heroTitle}>PSTAR Prep</Text>
        <Text style={styles.heroSub}>
          Aviation Regulations for the Student Pilot Permit & Private Pilot Licence. {QUESTIONS.length}{' '}
          official questions across {SECTIONS.length} sections.
        </Text>
        <View style={styles.heroStats}>
          <Stat value={`${EXAM_SIZE}`} label="Exam Qs" />
          <View style={styles.vline} />
          <Stat value={`${PASS_PCT}%`} label="Pass mark" />
          <View style={styles.vline} />
          <Stat value={p.bestExamPct == null ? '—' : `${p.bestExamPct}%`} label="Best score" />
        </View>
      </View>

      <Card style={{ marginTop: -28 }}>
        <View style={styles.cardHead}>
          <Text style={font.h3}>Your progress</Text>
          <Text style={font.mute}>
            {totalSeen}/{QUESTIONS.length} seen
          </Text>
        </View>
        <ProgressBar value={coverage} />
        <View style={styles.progRow}>
          <Text style={font.mute}>Recall accuracy</Text>
          <Text style={[font.h3, { color: accuracy >= PASS_PCT ? colors.green : colors.navy }]}>
            {totalSeen ? `${accuracy}%` : '—'}
          </Text>
        </View>
        <View style={styles.miniStats}>
          <Pill label={`${p.bookmarks.length} bookmarked`} tone="amber" />
          <Pill label={`${p.known.length} cards mastered`} tone="green" />
          <Pill label={`${p.examsTaken} exams taken`} tone="sky" />
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Study modes</Text>

      <View style={{ gap: space.md }}>
        <ModeTile
          title="Mock Exam"
          desc={`${EXAM_SIZE} random questions · ${PASS_PCT}% to pass`}
          icon="📝"
          tint={colors.sky}
          onPress={() => nav.push({ name: 'quiz', scope: 'exam' })}
        />
        <ModeTile
          title="Practice Quiz"
          desc="Drill a single section with instant feedback"
          icon="🎯"
          tint={colors.greenSoft}
          onPress={() => nav.resetTab('quizSetup')}
        />
        <ModeTile
          title="Flashcards"
          desc="Flip cards · question, answer & reference"
          icon="🗂️"
          tint={colors.amberSoft}
          onPress={() => nav.resetTab('cardsSetup')}
        />
        <ModeTile
          title="Answer Key Review"
          desc="Browse every question with the correct answer"
          icon="✅"
          tint={colors.greenSoft}
          onPress={() => nav.resetTab('review')}
        />
      </View>

      <Pressable onPress={() => setShowDisclaimer(true)} style={styles.disclaimerBtn}>
        <Text style={styles.disclaimer}>
          Study material reproduced from Transport Canada TP 11919E (Dec 2022). Always verify against
          current CARs and the TC AIM. Not affiliated with Transport Canada.{'\n'}
          <Text style={styles.disclaimerLink}>Read full disclaimer ›</Text>
        </Text>
      </Pressable>

      <Disclaimer visible={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40, gap: space.md },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: space.xl,
    paddingBottom: 44,
    ...shadow.float,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.blueBright, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: colors.white, fontSize: 34, fontWeight: '900', marginTop: 10 },
  heroSub: { color: '#B9CBE3', fontSize: 14, marginTop: 8, lineHeight: 20 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.lg,
    paddingVertical: space.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.white, fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#94A9C4', fontSize: 11, fontWeight: '600', marginTop: 2 },
  vline: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  miniStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  sectionLabel: {
    ...font.h2,
    marginTop: space.lg,
    marginBottom: 2,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
    ...shadow.card,
  },
  tileIcon: { width: 50, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 24 },
  tileTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  tileDesc: { fontSize: 13, color: colors.textMute, marginTop: 2 },
  chev: { fontSize: 28, color: colors.textFaint, fontWeight: '300' },
  disclaimerBtn: { marginTop: space.lg },
  disclaimer: {
    fontSize: 11,
    color: colors.textFaint,
    lineHeight: 16,
    textAlign: 'center',
  },
  disclaimerLink: { color: colors.blue, fontWeight: '700' },
});
