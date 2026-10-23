import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEntitlements } from '../entitlements';
import { EXAMS } from '../exams';
import { FREE_SECTION_COUNT } from '../gating';
import { useNav } from '../nav';
import type { Plan, PlanId } from '../purchases.types';
import { colors, fonts, glyph, rule, space, TOUCH, type, themed } from '../theme';
import { Button, FlowBar, Glyph } from '../components/ui';
import { APP_STORE_URL, PLAY_STORE_URL, PRIVACY_URL, TERMS_URL } from '../config';

const REASONS: Record<string, string> = {
  section: `This section is part of Pro. Free covers the first ${FREE_SECTION_COUNT} sections of each exam.`,
  mock: 'You’ve used today’s free mock exam. Pro removes the limit.',
};

const PLAN_COPY: Record<PlanId, { name: string; note: string; tag?: string }> = {
  lifetime: { name: 'Lifetime', note: 'Pay once · yours forever', tag: 'BEST VALUE' },
  monthly: { name: '1-Month Pass', note: 'Renews monthly · cancel anytime' },
};

function Feature({ mark, tint, text }: { mark: string; tint: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Glyph size={22} color={tint} style={{ width: 28 }}>
        {mark}
      </Glyph>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function PlanRow({ plan, selected, onPress }: { plan: Plan; selected: boolean; onPress: () => void }) {
  const copy = PLAN_COPY[plan.id];
  const per = plan.id === 'monthly' ? ' / month' : '';
  return (
    <Pressable
      testID={`plan-${plan.id}`}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={`${copy.name}, ${plan.priceString}${per}. ${copy.note}`}
      style={[styles.plan, selected && styles.planOn]}
    >
      <Glyph size={22} color={selected ? colors.yellow : colors.ink} style={{ width: 26 }}>
        {selected ? glyph.circle : '○'}
      </Glyph>
      <View style={{ flex: 1 }}>
        <View style={styles.planHead}>
          <Text style={[styles.planName, selected && { color: colors.paper }]}>{copy.name}</Text>
          {copy.tag ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{copy.tag}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.planNote, selected && { color: colors.paper }]}>{copy.note}</Text>
      </View>
      <Text style={[styles.planPrice, selected && { color: colors.paper }]}>
        {plan.priceString}
        <Text style={styles.planPer}>{per}</Text>
      </Text>
    </Pressable>
  );
}

export default function PaywallScreen({ reason }: { reason?: string }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const ent = useEntitlements();
  const [selected, setSelected] = useState<PlanId>('lifetime');
  const [busy, setBusy] = useState<null | 'buy' | 'restore'>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { refreshPlans } = ent;
  // On web the store is only "available" in the ?store=demo preview.
  const web = ent.isWeb && !ent.storeAvailable;
  useEffect(() => {
    if (ent.storeAvailable) refreshPlans();
  }, [ent.storeAvailable, refreshPlans]);

  const plan = ent.plans.find((p) => p.id === selected) ?? ent.plans[0];
  const sections = EXAMS.pstar.dataset.sections.length + EXAMS.roca.dataset.sections.length;
  const questions = EXAMS.pstar.dataset.questions.length + EXAMS.roca.dataset.questions.length;

  async function buy() {
    if (!plan) return;
    setBusy('buy');
    setMessage(null);
    const r = await ent.purchase(plan);
    setBusy(null);
    if (r.entitled) setMessage(`${glyph.check} Pro unlocked. Thank you!`);
    else if (!r.cancelled) setMessage(r.error ?? 'Purchase did not complete.');
  }

  async function restore() {
    setBusy('restore');
    setMessage(null);
    const ok = await ent.restore();
    setBusy(null);
    setMessage(ok ? `${glyph.check} Pro restored.` : 'No previous Pro purchase found for this account.');
  }

  const storeState = web
    ? 'web'
    : ent.storeAvailable === null || (ent.storeAvailable && ent.loadingPlans && ent.plans.length === 0)
      ? 'loading'
      : !ent.storeAvailable || ent.plans.length === 0
        ? 'unavailable'
        : 'ready';

  return (
    <View style={styles.root}>
      <FlowBar onClose={nav.back} closeLabel="Close" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={type.kicker}>PSTAR & ROC-A TRAINER</Text>
        <View style={styles.heroRow}>
          <Text style={styles.hero} accessibilityRole="header" accessibilityLabel="Pro">
            PRO
          </Text>
          <View style={styles.heroGlyphs}>
            <Glyph size={40} color={colors.red}>
              {glyph.circle}
            </Glyph>
            <Glyph size={40} color={colors.blue}>
              {glyph.square}
            </Glyph>
            <Glyph size={40} color={colors.yellow}>
              {glyph.triangle}
            </Glyph>
          </View>
        </View>
        <View style={{ height: rule.heavy, backgroundColor: colors.ink }} />
        {reason && REASONS[reason] ? <Text style={styles.reason}>{REASONS[reason]}</Text> : null}

        {ent.isPro && !web ? (
          <View style={styles.done}>
            <Glyph size={48} color={colors.blue}>
              {glyph.check}
            </Glyph>
            <Text style={type.h2}>Pro is active</Text>
            <Text style={type.mute}>Every section and unlimited mock exams are unlocked.</Text>
          </View>
        ) : null}

        <View style={styles.features}>
          <Feature
            mark={glyph.circle}
            tint={colors.red}
            text={`All ${sections} sections · ${questions} questions`}
          />
          <Feature mark={glyph.square} tint={colors.blue} text="Unlimited full mock exams" />
          <Feature mark={glyph.triangle} tint={colors.ink} text="Every flashcard & the full answer key" />
          <Feature mark={glyph.check} tint={colors.blue} text="One unlock covers PSTAR and ROC-A" />
        </View>

        {storeState === 'web' && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Purchases happen in the app</Text>
            <Text style={type.mute}>
              The web version is free. To study offline on your phone, get the app — your Pro unlock lives in
              your Apple or Google account.
            </Text>
            <Button
              label="App Store"
              variant="primary"
              trailing={glyph.arrow}
              onPress={() => Linking.openURL(APP_STORE_URL)}
              style={{ marginTop: space.md }}
            />
            <Button
              label="Google Play"
              variant="ghost"
              trailing={glyph.arrow}
              onPress={() => Linking.openURL(PLAY_STORE_URL)}
              style={{ marginTop: space.sm }}
            />
          </View>
        )}

        {storeState === 'loading' && (
          <View style={styles.notice}>
            <ActivityIndicator color={colors.ink} />
            <Text style={[type.mute, { textAlign: 'center', marginTop: space.sm }]}>Loading prices…</Text>
          </View>
        )}

        {storeState === 'unavailable' && (
          <View style={styles.notice} testID="store-unavailable">
            <Text style={styles.noticeTitle}>{glyph.triangle} Store unavailable</Text>
            <Text style={type.mute}>
              Purchases can’t be loaded right now. The free tier keeps working — try again later, or restore a
              previous purchase.
            </Text>
            <Button
              label="Try again"
              variant="ghost"
              small
              trailing={glyph.refresh}
              onPress={refreshPlans}
              style={{ marginTop: space.md }}
            />
          </View>
        )}

        {storeState === 'ready' && !ent.isPro && (
          <View style={{ marginTop: space.xl }} accessibilityRole="radiogroup">
            <View style={{ gap: space.sm }}>
              {ent.plans.map((p) => (
                <PlanRow key={p.id} plan={p} selected={plan?.id === p.id} onPress={() => setSelected(p.id)} />
              ))}
            </View>
          </View>
        )}

        {message ? (
          <Text style={styles.message} accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}

        {!web && (
          <View style={styles.links}>
            <Pressable
              onPress={restore}
              accessibilityRole="button"
              style={styles.link}
              disabled={busy !== null}
            >
              <Text style={styles.linkText}>{busy === 'restore' ? 'Restoring…' : 'Restore purchases'}</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL(TERMS_URL)}
              accessibilityRole="link"
              style={styles.link}
            >
              <Text style={styles.linkText}>Terms</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL(PRIVACY_URL)}
              accessibilityRole="link"
              style={styles.link}
            >
              <Text style={styles.linkText}>Privacy</Text>
            </Pressable>
          </View>
        )}

        {!web && (
          <Text style={styles.fine}>
            Lifetime is a one-time purchase. The 1-Month Pass is an auto-renewing subscription: payment is
            charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google account'} at confirmation and renews each month unless cancelled
            at least 24 hours before the end of the period. Manage or cancel in{' '}
            {Platform.OS === 'ios' ? 'Settings > Apple ID > Subscriptions' : 'Google Play > Subscriptions'}.
          </Text>
        )}
      </ScrollView>

      {storeState === 'ready' && !ent.isPro && plan ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Button
            testID="buy"
            label={
              busy === 'buy'
                ? 'Processing…'
                : plan.id === 'lifetime'
                  ? `Unlock forever · ${plan.priceString}`
                  : `Start pass · ${plan.priceString}`
            }
            variant="red"
            trailing={glyph.arrow}
            disabled={busy !== null}
            onPress={buy}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper },
    content: { padding: space.lg, paddingBottom: 32 },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: space.xs,
    },
    hero: { fontFamily: fonts.black, fontSize: 120, lineHeight: 118, letterSpacing: -6, color: colors.ink },
    heroGlyphs: { alignItems: 'center', paddingBottom: space.sm },
    reason: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.red, marginTop: space.md },
    done: { alignItems: 'flex-start', gap: space.xs, marginTop: space.lg },
    features: { marginTop: space.lg, gap: space.sm },
    feature: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 32 },
    featureText: { flex: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: colors.ink },
    notice: { marginTop: space.xl, borderWidth: rule.mid, borderColor: colors.ink, padding: space.lg },
    noticeTitle: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink, marginBottom: space.xs },
    plan: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 72,
      padding: space.md,
      borderWidth: rule.thick,
      borderColor: colors.ink,
      backgroundColor: colors.paper,
    },
    planOn: { backgroundColor: colors.ink },
    planHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
    planName: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink },
    planNote: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
    planPrice: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
    planPer: { fontFamily: fonts.medium, fontSize: 12 },
    tag: { backgroundColor: colors.yellow, paddingHorizontal: 6, paddingVertical: 1 },
    tagText: { fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 1.5, color: colors.onYellow },
    message: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue, marginTop: space.lg },
    links: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.lg, gap: space.md },
    link: { minHeight: TOUCH, justifyContent: 'center' },
    linkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blue, textDecorationLine: 'underline' },
    fine: {
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 16,
      color: colors.inkSoft,
      marginTop: space.sm,
    },
    footer: {
      padding: space.lg,
      paddingTop: space.md,
      borderTopWidth: rule.thick,
      borderTopColor: colors.ink,
    },
  }),
);
