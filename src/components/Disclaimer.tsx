import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, glyph, rule, space, type, themed } from '../theme';
import { Button, Glyph, Rule, Icon } from './ui';
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
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.band}>
            <Icon name={glyph.warning} size={22} color={colors.onYellow} />
            <Text style={styles.bandText}>IMPORTANT</Text>
          </View>
          <View style={styles.inner}>
            <Text style={type.h1} accessibilityRole="header">
              Disclaimer
            </Text>
            <Rule style={{ marginTop: space.sm, marginBottom: space.md }} />
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {meta.disclaimer.map((p, i) => (
                <Text key={i} style={styles.para}>
                  {p}
                </Text>
              ))}
              <Pressable
                onPress={() => Linking.openURL(meta.sourceUrl)}
                accessibilityRole="link"
                style={styles.linkRow}
              >
                <Text style={styles.link}>Official {meta.authority} source</Text>
                <Icon name={glyph.arrow} size={18} color={colors.blue} />
              </Pressable>
            </ScrollView>
            {firstRun ? (
              <Button label="I understand & agree" variant="red" trailing={glyph.arrow} onPress={onAccept} />
            ) : (
              <Button label="Close" variant="ghost" trailing={glyph.close} onPress={onClose} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: 'center',
      padding: space.lg,
    },
    sheet: {
      backgroundColor: colors.paper,
      borderWidth: rule.thick,
      borderColor: colors.ink,
      maxWidth: 520,
      width: '100%',
      alignSelf: 'center',
      maxHeight: '88%',
    },
    band: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: colors.yellow,
      paddingHorizontal: space.xl,
      paddingVertical: space.sm,
      borderBottomWidth: rule.thick,
      borderBottomColor: colors.ink,
    },
    bandText: { fontFamily: fonts.heavy, fontSize: 13, letterSpacing: 3, color: colors.onYellow },
    inner: { padding: space.xl, flexShrink: 1 },
    body: { marginBottom: space.lg },
    para: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.ink,
      lineHeight: 22,
      marginBottom: space.md,
    },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
    link: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue, textDecorationLine: 'underline' },
  }),
);
