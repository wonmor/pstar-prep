import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useExam, useSetExam } from '../exam';
import { EXAM_ORDER, EXAMS } from '../exams';
import { colors, radius, space } from '../theme';

// Segmented control that switches the active exam (PSTAR / ROC-A). The whole
// app re-renders against the newly selected exam's data and progress.
export function ExamSwitch({ style }: { style?: any }) {
  const { id } = useExam();
  const setExam = useSetExam();
  return (
    <View style={[styles.wrap, style]}>
      {EXAM_ORDER.map((exam) => {
        const on = exam === id;
        return (
          <Pressable
            key={exam}
            onPress={() => setExam(exam)}
            style={[styles.seg, on && styles.segOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.label, { color: on ? colors.white : colors.blue }]}>
              {EXAMS[exam].shortName}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.sky,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOn: { backgroundColor: colors.blueBright },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
});
