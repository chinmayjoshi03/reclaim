import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef, type ComponentProps } from 'react';
import { colors } from '../../src/config/theme';
import { useApp } from '../../src/store/useApp';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline' },
  { name: 'calendar', title: 'Calendar', icon: 'calendar-outline' },
  { name: 'levels', title: 'Levels', icon: 'trophy-outline' },
  { name: 'week', title: 'Week', icon: 'bar-chart-outline' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline' },
];

/** Shows the full-screen "Boss beaten" moment once for each newly cleared level. */
function useBossCelebration() {
  const pending = useApp((s) => s.levels.find((l) => l.boss_cleared && !l.celebrated)?.level);
  const shown = useRef<number | null>(null);
  useEffect(() => {
    if (pending && shown.current !== pending) {
      shown.current = pending;
      router.push({ pathname: '/boss', params: { level: String(pending) } });
    }
    if (!pending) shown.current = null;
  }, [pending]);
}

export default function TabLayout() {
  useBossCelebration();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} color={color as string} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
