import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../config/theme';
import { monthTitle } from '../logic/dates';
import { dayStatus, monthGrid } from '../logic/streaks';
import type { DayLog } from '../logic/types';
import { DayCell } from './DayCell';
import { StatusIcon } from './StatusIcon';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  y: number;
  m: number;
  today: string;
  days: Record<string, DayLog>;
  canPrev: boolean;
  canNext: boolean;
  onMonth: (delta: -1 | 1) => void;
  onDay: (date: string) => void;
}

export function MonthCalendar({ y, m, today, days, canPrev, canNext, onMonth, onDay }: Props) {
  const cells = useMemo(() => monthGrid(y, m), [y, m]);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0.3);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [y, m, fade]);

  // Swipe left/right to change month. Refs keep the latest limits inside the responder.
  const limits = useRef({ canPrev, canNext, onMonth });
  limits.current = { canPrev, canNext, onMonth };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          const l = limits.current;
          if (g.dx < -50 && l.canNext) l.onMonth(1);
          else if (g.dx > 50 && l.canPrev) l.onMonth(-1);
        },
      }),
    [],
  );

  const press = useCallback((d: string) => onDay(d), [onDay]);

  const navBtn = (dir: -1 | 1, enabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => onMonth(dir)}
      style={({ pressed }) => [styles.nav, !enabled && { opacity: 0.35 }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.gold} />
    </Pressable>
  );

  return (
    <View style={styles.card} {...pan.panHandlers}>
      <View style={styles.header}>
        {navBtn(-1, canPrev)}
        <Text style={styles.month}>{monthTitle(y, m)}</Text>
        {navBtn(1, canNext)}
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <Animated.View style={[styles.grid, { opacity: fade }]}>
        {cells.map((k, i) =>
          k ? (
            <DayCell
              key={k}
              date={k}
              status={dayStatus(days[k])}
              isToday={k === today}
              isFuture={k > today}
              charger={!!days[k]?.phone_on_charger}
              onPress={press}
            />
          ) : (
            <View key={`b${i}`} style={styles.blank} />
          ),
        )}
      </Animated.View>

      <View style={styles.legend}>
        <Legend icon={<StatusIcon status="completed" size={14} />} label="Completed" />
        <Legend icon={<StatusIcon status="comeback" size={14} />} label="Comeback" />
        <Legend icon={<StatusIcon status="not_completed" size={14} />} label="Not completed" />
        <Legend icon={<StatusIcon status="today" size={14} />} label="Today" />
      </View>
      <View style={styles.chargerNote}>
        <View style={styles.dot} />
        <Text style={styles.legendText}>Phone on charger that night</Text>
      </View>
    </View>
  );
}

function Legend({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.legendItem}>
      {icon}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 28,
    padding: space.xl,
    gap: space.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { color: colors.text, fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  blank: { width: `${100 / 7}%`, aspectRatio: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: space.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { color: colors.muted, fontSize: 12 },
  chargerNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
});
