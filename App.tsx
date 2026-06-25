import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavContext, Route, TAB_ROOT, TabKey, tabForRoute } from './src/nav';
import { useDisclaimerGate } from './src/storage';
import { Disclaimer } from './src/components/Disclaimer';
import { colors } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import QuizSetupScreen from './src/screens/QuizSetupScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import CardsSetupScreen from './src/screens/CardsSetupScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import AboutScreen from './src/screens/AboutScreen';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'quizSetup', label: 'Practice', icon: '✎' },
  { key: 'cardsSetup', label: 'Cards', icon: '▣' },
  { key: 'review', label: 'Answers', icon: '✓' },
  { key: 'about', label: 'About', icon: 'ⓘ' },
];

// Routes that take over the full screen (hide the tab bar).
const FULLSCREEN = new Set<Route['name']>(['quiz', 'cards']);

function Screen({ route }: { route: Route }) {
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
  }
}

function TabBar({ active, onPress }: { active: TabKey; onPress: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} style={styles.tab} onPress={() => onPress(t.key)}>
            <Text style={[styles.tabIcon, { color: on ? colors.blueBright : colors.textFaint }]}>
              {t.icon}
            </Text>
            <Text style={[styles.tabLabel, { color: on ? colors.blueBright : colors.textFaint }]}>
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

  const current = stacks[tab][stacks[tab].length - 1];

  const push = useCallback((r: Route) => {
    const owner = tabForRoute(r);
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
          <Screen route={current} />
        </View>
        {!fullscreen && <TabBar active={tab} onPress={onTabPress} />}
      </View>
    </NavContext.Provider>
  );
}

export default function App() {
  const { accepted, accept } = useDisclaimerGate();
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Root />
      {/* First-launch disclaimer — shown once on web and native until acknowledged. */}
      <Disclaimer visible={accepted === false} onAccept={accept} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    ...(Platform.OS === 'web' ? { maxWidth: 720, width: '100%', alignSelf: 'center' } : null),
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: { fontSize: 20, fontWeight: '700' },
  tabLabel: { fontSize: 11, fontWeight: '700' },
});
