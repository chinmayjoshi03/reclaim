import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { URGE_TIMER_MINUTES } from '../config/rules';
import { colors, radius, space } from '../config/theme';
import { formatCountdown, URGE_TIMER_MS } from '../logic/urge';
import { useApp } from '../store/useApp';

/** Big, always-visible button. Shows the running timer if there is one. */
export function UrgeButton() {
  const active = useApp((s) => s.activeUrge);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const remaining = active ? URGE_TIMER_MS - (now - active.startedAt) : 0;
  const running = !!active && remaining > 0;
  const label = active
    ? running
      ? `Timer running · ${formatCountdown(remaining)}`
      : 'Timer done · how did it go?'
    : `Urge? Start the ${URGE_TIMER_MINUTES}-minute timer`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push('/urge')}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={active ? 'timer-outline' : 'flash-outline'} size={24} color={colors.onAccent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>{label}</Text>
        {!active && <Text style={styles.sub}>Get up, start it, +10. Whatever happens after.</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 64,
    borderRadius: radius.md,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  text: { color: colors.onAccent, fontSize: 17, fontWeight: '800' },
  sub: { color: colors.onAccent, opacity: 0.75, fontSize: 12 },
});
