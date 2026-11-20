import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TAP, radius } from '../config/theme';
import { addDays, shortLabel } from '../logic/dates';

export function DateSwitcher({
  date,
  today,
  minDate,
  onChange,
}: {
  date: string;
  today: string;
  minDate: string;
  onChange: (d: string) => void;
}) {
  const canBack = date > minDate;
  const canFwd = date < today;
  const label = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : shortLabel(date);
  const arrow = (dir: -1 | 1, can: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? 'Previous day' : 'Next day'}
      disabled={!can}
      onPress={() => onChange(addDays(date, dir))}
      style={({ pressed }) => [styles.arrow, !can && { opacity: 0.3 }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {arrow(-1, canBack)}
      <Pressable
        style={styles.center}
        onPress={() => onChange(today)}
        accessibilityRole="button"
        accessibilityLabel={`Showing ${shortLabel(date)}. Tap to go to today.`}
      >
        <Text style={styles.label}>{label}</Text>
        {date !== today && <Text style={styles.sub}>{shortLabel(date)}</Text>}
      </Pressable>
      {arrow(1, canFwd)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: MIN_TAP },
  label: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12 },
});
