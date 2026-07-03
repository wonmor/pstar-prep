import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, space } from '../theme';
import { Button } from './ui';
import { useExam } from '../exam';

export function Disclaimer({
  visible,
  onAccept,
  onClose,
}: {
  visible: boolean;
  onAccept?: () => void;
  onClose?: () => void; // when present, modal is dismissible (re-opened from About)
}) {
  const { meta } = useExam();
  const firstRun = !onClose;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handleBadge}>
            <Text style={styles.badgeText}>⚠︎ IMPORTANT</Text>
          </View>
          <Text style={styles.title}>Disclaimer</Text>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {meta.disclaimer.map((p, i) => (
              <Text key={i} style={styles.para}>
                {p}
              </Text>
            ))}
            <Pressable onPress={() => Linking.openURL(meta.sourceUrl)}>
              <Text style={styles.link}>View the official {meta.authority} source →</Text>
            </Pressable>
          </ScrollView>
          {firstRun ? (
            <Button label="I understand & agree" variant="primary" onPress={onAccept} />
          ) : (
            <Button label="Close" variant="ghost" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,37,69,0.6)',
    justifyContent: 'center',
    padding: space.lg,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.xl,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '86%',
    ...shadow.float,
  },
  handleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.amberSoft,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeText: { color: colors.amber, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  title: { ...font.h1, marginTop: space.md, marginBottom: space.sm },
  body: { marginBottom: space.lg },
  para: { fontSize: 14, color: colors.textMute, lineHeight: 21, marginBottom: space.md },
  link: { fontSize: 14, color: colors.blue, fontWeight: '700', marginBottom: space.sm },
});
