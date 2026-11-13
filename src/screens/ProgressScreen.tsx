// Visual progress: overall recall ring, study streak with a calendar of the
// last twelve weeks, mock exam history, weak topics first, then every topic
// as a mastery ring. Printed in the paper palette; rings and bars animate
// unless Reduce Motion is on.
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgT } from 'react-native-svg';
import { useExam } from '../exam';
import { useGate } from '../entitlements';
import { useNav } from '../nav';
import { streakDays, todayKey, useProgress } from '../storage';
import { spotsForExam } from '../illustrations';
import { cardSurface, colors, fonts, glyph, radius, rule, space, type, themed } from '../theme';
import { Button, Icon, Kicker, LockTag, ProgressBar, ScreenHeader } from '../components/ui';
import { ExamSwitch } from '../components/ExamSwitch';
import { Ring } from '../components/Ring';

const WEEKS = 12;

function StreakCalendar({ activity }: { activity: Record<string, number> }) {
  // Columns are weeks (oldest left), rows are weekdays Monday to Sunday.
  const cell = 14;
  const gap = 3;
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Monday = 0
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (WEEKS - 1) * 7);
  const days: { key: string; n: number; col: number; row: number }[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > today) break;
    const key = todayKey(d);
    days.push({ key, n: activity[key] ?? 0, col: Math.floor(i / 7), row: i % 7 });
  }
  const w = WEEKS * (cell + gap) + 24;
  const h = 7 * (cell + gap);
  const level = (n: number) => (n === 0 ? 0 : n < 5 ? 0.35 : n < 15 ? 0.6 : n < 30 ? 0.8 : 1);
  const labels = ['M', '', 'W', '', 'F', '', 'S'];
  return (
    <View accessible accessibilityLabel={`Study calendar, last ${WEEKS} weeks. ${days.filter((d) => d.n > 0).length} active days.`}>
      <Svg width={w} height={h}>
        {labels.map((l, r) =>
          l ? (
            <SvgText key={r} x={0} y={r * (cell + gap) + cell - 3} label={l} />
          ) : null,
        )}
        {days.map((d) => (
          <Rect
            key={d.key}
            x={20 + d.col * (cell + gap)}
            y={d.row * (cell + gap)}
            width={cell}
            height={cell}
            rx={2}
            fill={d.n ? colors.blue : colors.paperDeep}
            fillOpacity={d.n ? level(d.n) : 1}
            stroke={d.key === todayKey() ? colors.ink : 'none'}
            strokeWidth={1.5}
          />
        ))}
      </Svg>
    </View>
  );
}

// react-native-svg Text needs the font family explicitly; keep it tiny.
function SvgText({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <SvgT x={x} y={y} fontSize={10} fontFamily={fonts.bold} fill={colors.inkSoft}>
      {label}
    </SvgT>
  );
}

function ExamHistory({ history, passPct }: { history: { day: string; pct: number }[]; passPct: number }) {
  const last = history.slice(-10);
  if (last.length === 0) {
    return <Text style={type.mute}>No mock exams yet. Your scores will be charted here.</Text>;
  }
  const w = 300;
  const h = 90;
  const bw = Math.min(26, (w - 10) / last.length - 6);
  const passY = h - (passPct / 100) * h;
  return (
    <View accessible accessibilityLabel={`Last ${last.length} mock exams: ${last.map((e) => `${e.pct} percent`).join(', ')}. Pass mark ${passPct} percent.`}>
      <Svg width="100%" height={h + 18} viewBox={`0 0 ${w} ${h + 18}`}>
        {last.map((e, i) => {
          const x = 4 + i * ((w - 8) / last.length);
          const bh = Math.max(2, (e.pct / 100) * h);
          const ok = e.pct >= passPct;
          return <Rect key={i} x={x} y={h - bh} width={bw} height={bh} rx={2} fill={ok ? colors.blue : colors.red} />;
        })}
        <Line x1={0} y1={passY} x2={w} y2={passY} stroke={colors.ink} strokeWidth={1.5} strokeDasharray="4 4" />
        <Line x1={0} y1={h} x2={w} y2={h} stroke={colors.lineStrong} strokeWidth={1} />
        <SvgT x={w - 2} y={passY - 4} fontSize={10} fontFamily={fonts.bold} fill={colors.ink} textAnchor="end">
          {`pass ${passPct}%`}
        </SvgT>
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={type.tiny}>OLDEST</Text>
        <Text style={type.tiny}>LATEST {last[last.length - 1].pct}%</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const nav = useNav();
  const p = useProgress();
  const gate = useGate();
  const { id, meta, QUESTIONS, SECTIONS, questionsForSection, PASS_PCT } = useExam();

  const seenIds = Object.keys(p.stats);
  const totalCorrect = seenIds.reduce((n, qid) => n + (p.stats[qid].lastCorrect ? 1 : 0), 0);
  const accuracy = seenIds.length ? totalCorrect / seenIds.length : 0;
  const coverage = QUESTIONS.length ? seenIds.length / QUESTIONS.length : 0;
  const streak = streakDays(p.activity ?? {});
  const activeDays = Object.values(p.activity ?? {}).filter((n) => n > 0).length;

  const topics = useMemo(
    () =>
      SECTIONS.map((s) => {
        const qs = questionsForSection(s.id);
        const seen = qs.filter((q) => p.stats[q.id]);
        const correct = qs.filter((q) => p.stats[q.id]?.lastCorrect).length;
        return { s, total: qs.length, seen: seen.length, correct, pct: qs.length ? correct / qs.length : 0, open: gate.canSection(s.id) };
      }),
    [SECTIONS, questionsForSection, p.stats, gate],
  );
  const weak = topics.filter((t) => t.open && t.seen >= 3 && t.correct / t.seen < 0.7).sort((a, b) => a.correct / a.seen - b.correct / b.seen).slice(0, 3);
  const spots = spotsForExam(id);
  const spotted = spots.filter((s) => p.spots?.[s.id]).length;

  const practice = (sectionId: number) =>
    gate.canSection(sectionId) ? nav.push({ name: 'quiz', scope: sectionId }) : nav.push({ name: 'paywall', reason: 'section' });

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader index="06" title="Progress" accent="blue" sub={`How your ${meta.shortName} study is going.`} />
      <ExamSwitch style={{ marginBottom: space.xl }} />

      {/* Overview */}
      <View style={styles.card}>
        <View style={styles.overview}>
          <Ring value={accuracy} size={124} stroke={12} color={accuracy >= 0.9 ? colors.blue : colors.red} label={seenIds.length ? `${Math.round(accuracy * 100)}%` : '--'} sub="recall" accessibilityLabel={`Recall accuracy ${Math.round(accuracy * 100)} percent`} />
          <View style={{ flex: 1, gap: space.sm }}>
            <View>
              <Text style={styles.big}>{seenIds.length}<Text style={styles.bigUnit}> / {QUESTIONS.length}</Text></Text>
              <Text style={type.tiny}>QUESTIONS SEEN</Text>
            </View>
            <ProgressBar value={coverage} color={colors.blue} />
            <View style={styles.countRow}>
              <Text style={styles.count}><Icon name={glyph.check} size={13} color={colors.blue} /> {p.known.length} mastered</Text>
              <Text style={styles.count}><Icon name={glyph.exam} size={13} color={colors.ink} /> {p.examsTaken} exams</Text>
              <Text style={styles.count}><Icon name={glyph.ribbon} size={13} color={colors.red} /> best {p.bestExamPct == null ? '--' : `${p.bestExamPct}%`}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Streak */}
      <View style={[styles.card, { marginTop: space.lg }]}>
        <View style={styles.rowHead}>
          <Kicker>Study streak</Kicker>
          <Text style={type.mute}>{activeDays} active {activeDays === 1 ? 'day' : 'days'}</Text>
        </View>
        <View style={styles.streakRow}>
          <Icon name={glyph.flame} size={34} color={streak > 0 ? colors.red : colors.inkSoft} />
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>{streak === 1 ? 'day in a row' : 'days in a row'}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: space.xs }}>
          <StreakCalendar activity={p.activity ?? {}} />
        </ScrollView>
        <Text style={[type.tiny, { marginTop: 4 }]}>LAST {WEEKS} WEEKS | DARKER = MORE ANSWERS</Text>
      </View>

      {/* Exam history */}
      <View style={[styles.card, { marginTop: space.lg }]}>
        <View style={styles.rowHead}>
          <Kicker>Mock exams</Kicker>
          <Text style={type.mute}>{PASS_PCT}% to pass</Text>
        </View>
        <ExamHistory history={p.examHistory ?? []} passPct={PASS_PCT} />
      </View>

      {/* Weak spots */}
      {weak.length > 0 && (
        <View style={[styles.card, styles.weakCard, { marginTop: space.lg }]}>
          <View style={styles.rowHead}>
            <Kicker color={colors.red}>Weak spots</Kicker>
            <Icon name={glyph.warning} size={18} color={colors.red} />
          </View>
          {weak.map((t) => (
            <View key={t.s.id} style={styles.weakRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.weakName}>{t.s.id}. {t.s.name}</Text>
                <Text style={type.mute}>{t.correct} of {t.seen} answered correctly</Text>
              </View>
              <Button small label="Drill" variant="red" trailing={glyph.arrow} onPress={() => practice(t.s.id)} />
            </View>
          ))}
        </View>
      )}

      {/* Topic mastery */}
      <Text style={[type.h2, { marginTop: space.xl, marginBottom: space.sm }]}>Topic mastery</Text>
      <View style={styles.topics}>
        {topics.map((t) => (
          <Pressable
            key={t.s.id}
            onPress={() => practice(t.s.id)}
            accessibilityRole="button"
            accessibilityLabel={`${t.s.name}, ${Math.round(t.pct * 100)} percent mastered, ${t.seen} of ${t.total} seen${t.open ? '' : ', locked, Pro only'}`}
            style={({ pressed }) => [styles.topic, pressed && { backgroundColor: colors.paperDeep }]}
          >
            <Ring value={t.open ? t.pct : 0} size={54} stroke={6} color={t.pct >= 0.9 ? colors.blue : t.pct >= 0.6 ? colors.yellow : colors.red} label={t.open ? `${Math.round(t.pct * 100)}` : ''} accessibilityLabel={`${Math.round(t.pct * 100)} percent`} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.topicName, !t.open && { color: colors.inkSoft }]} numberOfLines={2}>{t.s.id}. {t.s.name}</Text>
              {t.open ? <Text style={type.mute}>{t.seen} of {t.total} seen | {t.correct} right</Text> : <LockTag />}
            </View>
            <Icon name={t.open ? glyph.arrow : glyph.lock} size={20} color={t.open ? colors.ink : colors.inkSoft} />
          </Pressable>
        ))}
      </View>

      {/* Diagrams */}
      {spots.length > 0 && (
        <View style={[styles.card, { marginTop: space.lg }]}>
          <View style={styles.rowHead}>
            <Kicker>Spot it</Kicker>
            <Text style={type.mute}>{spotted} of {spots.length} diagrams</Text>
          </View>
          <ProgressBar value={spots.length ? spotted / spots.length : 0} color={colors.blue} />
          <Button label="Spot it" variant="ghost" trailing={glyph.spot} onPress={() => nav.push({ name: 'spot' })} style={{ marginTop: space.md }} />
        </View>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    content: { padding: space.lg, paddingBottom: 40 },
    card: { ...cardSurface(), padding: space.lg, gap: space.sm },
    overview: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    big: { fontFamily: fonts.black, fontSize: 34, lineHeight: 40, color: colors.ink, letterSpacing: -1 },
    bigUnit: { fontFamily: fonts.bold, fontSize: 16, color: colors.inkSoft, letterSpacing: 0 },
    countRow: { gap: 2 },
    count: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
    rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    streakRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
    streakNum: { fontFamily: fonts.black, fontSize: 44, lineHeight: 48, color: colors.ink, letterSpacing: -1.5 },
    streakLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft, paddingBottom: 8 },
    weakCard: { borderLeftWidth: 4, borderLeftColor: colors.red },
    weakRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm, borderTopWidth: rule.hair, borderTopColor: colors.line },
    weakName: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
    topics: { borderTopWidth: rule.thick, borderTopColor: colors.ink },
    topic: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 70,
      paddingVertical: space.sm,
      paddingRight: space.xs,
      borderBottomWidth: rule.hair,
      borderBottomColor: colors.line,
      borderRadius: radius,
    },
    topicName: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.ink },
  }),
);
