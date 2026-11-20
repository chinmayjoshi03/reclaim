import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TAP } from '../config/theme';

/** 1–5 picker. Tapping the selected value clears it. */
export function Rating({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value === n;
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled }}
            accessibilityLabel={`Sleep quality ${n} of 5`}
            disabled={disabled}
            onPress={() => onChange(on ? null : n)}
            style={[styles.dot, on && styles.dotOn]}
          >
            <Text style={[styles.text, on && { color: colors.onAccent }]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: {
    width: MIN_TAP + 4,
    height: MIN_TAP + 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.green, borderColor: colors.green },
  text: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
