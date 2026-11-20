import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Muted } from '../src/components/ui';
import { LEVELS } from '../src/config/rules';
import { colors, space } from '../src/config/theme';
import { useApp } from '../src/store/useApp';

export default function BossScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const n = Number(level);
  const rule = LEVELS.find((l) => l.level === n);
  const state = useApp((s) => s.levels.find((l) => l.level === n));
  const reward = useApp((s) => s.settings?.rewards[String(n)]) ?? rule?.defaultReward;
  const saveLevel = useApp((s) => s.saveLevel);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  const close = async () => {
    if (state && !state.celebrated) await saveLevel({ ...state, celebrated: true });
    if (router.canGoBack()) router.back();
    else router.replace('/levels');
  };

  if (!rule) return null;
  const next = LEVELS.find((l) => l.level === n + 1);

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View style={[styles.body, { opacity: fade }]}>
        <View style={styles.badge}>
          <Ionicons name="trophy" size={56} color={colors.gold} />
        </View>
        <Muted style={{ fontSize: 15 }}>Level {rule.level} · {rule.name}</Muted>
        <Text style={styles.title}>Boss beaten</Text>
        <Text style={styles.sub}>{rule.bossTitle}. Done.</Text>
        <View style={styles.rewardBox}>
          <Muted>Your reward</Muted>
          <Text style={styles.reward}>{reward}</Text>
          <Muted style={{ textAlign: 'center' }}>Go get it. Away from the phone.</Muted>
        </View>
        {next && <Muted style={{ textAlign: 'center' }}>Next up: Level {next.level} · {next.name}</Muted>}
      </Animated.View>
      <Button big variant="primary" label="Claim it" onPress={close} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.xl },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.goldSoft,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  title: { fontFamily: 'serif', color: colors.text, fontSize: 38, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  rewardBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 6,
    marginTop: space.lg,
    padding: space.xl,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reward: { color: colors.gold, fontSize: 24, fontWeight: '700', textAlign: 'center' },
});
