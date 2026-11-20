import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../config/theme';
import { PointsPop } from './PointsPop';

interface Props {
  label: string;
  checked: boolean;
  points?: number;
  /** Small text on the right when points = 0 (e.g. "boss"). */
  tag?: string;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}

export function QuestRow({ label, checked, points = 0, tag, disabled, onToggle }: Props) {
  const [pop, setPop] = useState(0);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={points ? `${label}, ${points} points` : label}
      disabled={disabled}
      onPress={() => {
        const next = !checked;
        if (next && points) setPop((n) => n + 1);
        onToggle(next);
      }}
      style={({ pressed }) => [
        styles.row,
        checked && styles.rowOn,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked && <Ionicons name="checkmark" size={18} color={colors.onAccent} />}
      </View>
      <Text style={styles.label}>{label}</Text>
      {points ? (
        <Text style={[styles.points, checked && { color: colors.green }]}>+{points}</Text>
      ) : tag ? (
        <Text style={styles.tag}>{tag}</Text>
      ) : null}
      {points ? <PointsPop points={points} trigger={pop} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  rowOn: { borderColor: colors.greenSoft, backgroundColor: '#14201B' },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.green, borderColor: colors.green },
  label: { flex: 1, color: colors.text, fontSize: 16 },
  points: { color: colors.muted, fontWeight: '700', fontSize: 15 },
  tag: { color: colors.muted, fontSize: 12 },
});
