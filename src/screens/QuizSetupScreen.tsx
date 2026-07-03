import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExam } from '../exam';
import { useNav } from '../nav';
import { colors, font, space } from '../theme';
import { Button, Card } from '../components/ui';
import { SectionList } from '../components/SectionList';
import { ExamSwitch } from '../components/ExamSwitch';

export default function QuizSetupScreen() {
  const nav = useNav();
  const { meta, QUESTIONS, EXAM_SIZE, PASS_PCT } = useExam();
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={font.h1}>Practice</Text>
      <Text style={[font.mute, { marginTop: 4, marginBottom: space.md }]}>
        Take a full mock exam, or drill one section at a time.
      </Text>

      <ExamSwitch style={{ marginBottom: space.lg }} />

      <Card style={styles.examCard}>
        <Text style={styles.examTitle}>📝 Full Mock Exam</Text>
        <Text style={styles.examDesc}>
          {EXAM_SIZE} questions drawn at random from all {QUESTIONS.length}. Pass mark {PASS_PCT}%, just
          like the real {meta.shortName}. Answers are revealed at the end.
        </Text>
        <Button
          label="Start mock exam"
          variant="primary"
          onPress={() => nav.push({ name: 'quiz', scope: 'exam' })}
          style={{ marginTop: space.md }}
        />
      </Card>

      <Text style={[font.h2, { marginTop: space.xl, marginBottom: space.md }]}>By section</Text>
      <Text style={[font.mute, { marginTop: -8, marginBottom: space.md }]}>
        Instant feedback after each question.
      </Text>
      <SectionList onPick={(id) => nav.push({ name: 'quiz', scope: id })} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 40 },
  examCard: { backgroundColor: colors.navy, borderColor: colors.navy },
  examTitle: { color: colors.white, fontSize: 19, fontWeight: '800' },
  examDesc: { color: '#B9CBE3', fontSize: 14, lineHeight: 20, marginTop: 8 },
});
