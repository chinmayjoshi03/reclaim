import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../config/theme';
import { parseKey } from '../logic/dates';
import type { DayStatus } from '../logic/streaks';
import { StatusIcon } from './StatusIcon';

interface Props {
  date: string;
  status: DayStatus;
  isToday: boolean;
  isFuture: boolean;
  charger: boolean;
  onPress: (date: string) => void;
}

const FILL: Partial<Record<DayStatus, { bg: string; fg: string; border?: string }>> = {
  completed: { bg: colors.greenSoft, fg: colors.green },
  comeback: { bg: colors.amberSoft, fg: colors.amber },
  not_completed: { bg: colors.warmFaint, fg: colors.text, border: colors.warmBorder },
};

const LABEL: Record<DayStatus, string> = {
  completed: 'completed',
  comeback: 'comeback',
  not_completed: 'not completed',
  not_logged: 'not logged',
};

export const DayCell = memo(function DayCell({ date, status, isToday, isFuture, charger, onPress }: Props) {
  const fill = isToday ? undefined : FILL[status];
  const fg = isToday ? colors.gold : fill?.fg ?? colors.text;
  const { d } = parseKey(date);
  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={isFuture}
        onPress={() => onPress(date)}
        accessibilityRole="button"
        accessibilityLabel={`${date}, ${isFuture ? 'future' : LABEL[status]}${isToday ? ', today' : ''}${charger ? ', phone on charger' : ''}`}
        style={({ pressed }) => [
          styles.cell,
          fill && { backgroundColor: fill.bg },
          fill?.border && { borderWidth: 1, borderColor: fill.border },
          isToday && { borderWidth: 2, borderColor: colors.gold },
          isFuture && { opacity: 0.35 },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.top}>
          <Text style={[styles.num, { color: fg }]}>{d}</Text>
        </View>
        <View style={styles.bottom}>{!isFuture && <StatusIcon status={status} size={14} />}</View>
        {charger && !isFuture && <View style={styles.dot} />}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: `${100 / 7}%`, padding: 3 },
  cell: { aspectRatio: 1, borderRadius: 16, overflow: 'hidden' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bottom: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 3 },
  num: { fontSize: 15, fontWeight: '600' },
  dot: { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
});
