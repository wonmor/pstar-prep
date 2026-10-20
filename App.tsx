import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Jost_400Regular,
  Jost_500Medium,
  Jost_700Bold,
  Jost_800ExtraBold,
  Jost_900Black,
} from '@expo-google-fonts/jost';

import { NavContext, Route, TAB_ROOT, TabKey, tabForRoute } from './src/nav';
import { useDisclaimerGate } from './src/storage';
import { ExamProvider, useExam } from './src/exam';
import { EntitlementsProvider, useEntitlements } from './src/entitlements';
import { routeAllowed } from './src/gating';
import { ThemeModeProvider, useThemeState } from './src/themeMode';
import { Disclaimer } from './src/components/Disclaimer';
import { Glyph } from './src/components/ui';
import { colors, fonts, rule, TOUCH, themed } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import QuizSetupScreen from './src/screens/QuizSetupScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import CardsSetupScreen from './src/screens/CardsSetupScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import AboutScreen from './src/screens/AboutScreen';
import PaywallScreen from './src/screens/PaywallScreen';

// Tab glyphs — typographic, coloured with the Bauhaus primaries when active.
const TABS: { key: TabKey; label: string; glyph: string; tint: 'red' | 'blue' | 'yellow' }[] = [
  { key: 'home', label: 'Home', glyph: '●', tint: 'red' },
  { key: 'quizSetup', label: 'Practice', glyph: '▲', tint: 'blue' },
  { key: 'cardsSetup', label: 'Cards', glyph: '■', tint: 'yellow' },
  { key: 'review', label: 'Answers', glyph: '✓', tint: 'blue' },
  { key: 'about', label: 'About', glyph: '?', tint: 'red' },
];

// Routes that take over the full screen (hide the tab bar).
const FULLSCREEN = new Set<Route['name']>(['quiz', 'cards', 'paywall']);

function Screen({ route }: { route: Route }) {
  const { isPro } = useEntitlements();
  const { SECTIONS } = useExam();
  // Central guard: a locked section can never render, whatever pushed it.
  if (!routeAllowed(isPro, SECTIONS, route)) return <PaywallScreen reason="section" />;
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'quizSetup':
      return <QuizSetupScreen />;
    case 'quiz':
      return <QuizScreen scope={route.scope} />;
    case 'results':
      return (
        <ResultsScreen
          scope={route.scope}
          correct={route.correct}
          total={route.total}
          isExam={route.isExam}
          wrongIds={route.wrongIds}
        />
      );
    case 'cardsSetup':
      return <CardsSetupScreen />;
    case 'cards':
      return <FlashcardsScreen scope={route.scope} />;
    case 'review':
      return <ReviewScreen initialSection={route.initialSection} />;
    case 'about':
      return <AboutScreen />;
    case 'paywall':
      return <PaywallScreen reason={route.reason} />;
  }
}

function TabBar({ active, onPress }: { active: TabKey; onPress: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 6) }]} accessibilityRole="tablist">
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            style={({ pressed }) => [
              styles.tab,
              on && styles.tabOn,
              pressed && { backgroundColor: colors.paperDeep },
            ]}
            onPress={() => onPress(t.key)}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
          >
            <Glyph size={20} color={on ? colors[t.tint] : colors.inkSoft}>
              {t.glyph}
            </Glyph>
            <Text
              style={[styles.tabLabel, { color: on ? colors.ink : colors.inkSoft }]}
              maxFontSizeMultiplier={1.3}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  // One stack per tab so each tab keeps its own back history.
  const [stacks, setStacks] = useState<Record<TabKey, Route[]>>({
    home: [TAB_ROOT.home],
    quizSetup: [TAB_ROOT.quizSetup],
    cardsSetup: [TAB_ROOT.cardsSetup],
    review: [TAB_ROOT.review],
    about: [TAB_ROOT.about],
  });
  const [tab, setTab] = useState<TabKey>('home');
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const current = stacks[tab][stacks[tab].length - 1];

  const push = useCallback((r: Route) => {
    const owner = tabForRoute(r) ?? tabRef.current;
    setTab(owner);
    setStacks((s) => ({ ...s, [owner]: [...s[owner], r] }));
  }, []);

  const back = useCallback(() => {
    setStacks((s) => {
      const st = s[tab];
      if (st.length <= 1) return s;
      return { ...s, [tab]: st.slice(0, -1) };
    });
  }, [tab]);

  const resetTab = useCallback((t: TabKey) => {
    setTab(t);
    setStacks((s) => ({ ...s, [t]: [TAB_ROOT[t]] }));
  }, []);

  const onTabPress = useCallback(
    (t: TabKey) => {
      // Tapping the active tab pops to its root; otherwise just switch.
      if (t === tab) setStacks((s) => ({ ...s, [t]: [s[t][0]] }));
      setTab(t);
    },
    [tab],
  );

  const api = useMemo(
    () => ({ current, tab, push, back, resetTab, canGoBack: stacks[tab].length > 1 }),
    [current, tab, push, back, resetTab, stacks],
  );

  const fullscreen = FULLSCREEN.has(current.name);

  return (
    <NavContext.Provider value={api}>
      <View style={styles.app}>
        <View style={[styles.body, { paddingTop: insets.top }]}>
          <View style={styles.column}>
            <Screen route={current} />
          </View>
        </View>
        {!fullscreen && <TabBar active={tab} onPress={onTabPress} />}
      </View>
    </NavContext.Provider>
  );
}

export default function App() {
  const { accepted, accept } = useDisclaimerGate();
  const theme = useThemeState();
  const [fontsLoaded, fontError] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_700Bold,
    Jost_800ExtraBold,
    Jost_900Black,
  });
  // Fonts are bundled locally, so this resolves within a frame or two. On
  // error we still render (system font fallback) rather than hang.
  if ((!fontsLoaded && !fontError) || !theme.ready) return <View style={styles.app} />;
  return (
    <SafeAreaProvider>
      <ThemeModeProvider value={theme}>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <ExamProvider>
          <EntitlementsProvider>
            <Root />
            {/* First-launch disclaimer — shown once on web and native until acknowledged. */}
            <Disclaimer visible={accepted === false} onAccept={accept} />
          </EntitlementsProvider>
        </ExamProvider>
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    app: { flex: 1, backgroundColor: colors.paper },
    body: { flex: 1 },
    column: {
      flex: 1,
      ...(Platform.OS === 'web' ? { maxWidth: 720, width: '100%', alignSelf: 'center' } : null),
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.paper,
      borderTopWidth: rule.thick,
      borderTopColor: colors.ink,
      ...(Platform.OS === 'web' ? { maxWidth: 720, width: '100%', alignSelf: 'center' } : null),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH + 8,
      paddingTop: 8,
      paddingBottom: 4,
      gap: 2,
      borderTopWidth: rule.thick,
      borderTopColor: 'transparent',
      marginTop: -rule.thick,
    },
    tabOn: { borderTopColor: colors.yellow },
    tabLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  }),
);
