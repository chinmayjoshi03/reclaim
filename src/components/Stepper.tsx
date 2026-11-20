import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TAP, radius } from '../config/theme';

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const btn = (icon: 'remove' | 'add', next: number, can: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase' : 'Decrease'}
      disabled={disabled || !can}
      onPress={() => onChange(next)}
      style={({ pressed }) => [styles.btn, (!can || disabled) && { opacity: 0.35 }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={styles.wrap}>
      {btn('remove', value - 1, value > min)}
      <Text style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </Text>
      {btn('add', value + 1, value < max)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btn: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 36, textAlign: 'center', color: colors.text, fontSize: 20, fontWeight: '700' },
});
