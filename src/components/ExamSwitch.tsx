import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useExam, useSetExam } from '../exam';
import { EXAM_ORDER, EXAMS } from '../exams';
import { colors, fonts, glyph, rule, TOUCH, themed } from '../theme';
import { Icon } from './ui';

// Two-cell switch for the active exam (PSTAR / ROC-A). A strict grid: equal
// cells, thick ink frame, the active cell inverted to ink.
export function ExamSwitch({ style }: { style?: any }) {
  const { id } = useExam();
  const setExam = useSetExam();
  return (
    <View style={[styles.wrap, style]} accessibilityRole="radiogroup">
      {EXAM_ORDER.map((exam, i) => {
        const on = exam === id;
        return (
          <Pressable
            key={exam}
            onPress={() => setExam(exam)}
            style={({ pressed }) => [
              styles.seg,
              i > 0 && styles.segDivider,
              on && styles.segOn,
              pressed && !on && { backgroundColor: colors.paperDeep },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={`${EXAMS[exam].shortName} exam`}
            accessibilityState={{ selected: on, checked: on }}
          >
            <Icon name={exam === 'pstar' ? glyph.airplane : glyph.radio} size={18} color={on ? colors.yellow : colors.inkSoft} />
            <Text style={[styles.label, { color: on ? colors.paper : colors.ink }]}>
              {EXAMS[exam].shortName}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', borderWidth: rule.mid, borderColor: colors.ink },
    seg: {
      flex: 1,
      minHeight: TOUCH,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.paper,
    },
    segDivider: { borderLeftWidth: rule.mid, borderLeftColor: colors.ink },
    segOn: { backgroundColor: colors.ink },
    label: { fontFamily: fonts.heavy, fontSize: 15, letterSpacing: 2 },
  }),
);
