import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../config/theme';

export const PIN_LENGTH = 4;

/** Four dots and a 3×4 keypad. Calls onComplete when 4 digits are entered. */
export function PinPad({
  value,
  onChange,
  onComplete,
  extraKey,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  /** Optional bottom-left key (e.g. fingerprint). */
  extraKey?: { icon: 'finger-print'; label: string; onPress: () => void };
}) {
  const press = (d: string) => {
    if (value.length >= PIN_LENGTH) return;
    const next = value + d;
    onChange(next);
    if (next.length === PIN_LENGTH) onComplete(next);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <View style={{ gap: space.xl, alignItems: 'center' }}>
      <View style={styles.dots} accessibilityLabel={`${value.length} of ${PIN_LENGTH} digits entered`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotOn]} />
        ))}
      </View>
      <View style={styles.grid}>
        {keys.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)} />
        ))}
        {extraKey ? (
          <Key
            icon={<Ionicons name={extraKey.icon} size={28} color={colors.green} />}
            label={extraKey.label}
            onPress={extraKey.onPress}
          />
        ) : (
          <View style={styles.key} />
        )}
        <Key label="0" onPress={() => press('0')} />
        <Key
          icon={<Ionicons name="backspace-outline" size={26} color={colors.muted} />}
          label="Delete"
          onPress={() => onChange(value.slice(0, -1))}
        />
      </View>
    </View>
  );
}

function Key({ label, icon, onPress }: { label: string; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.key, styles.keyFace, pressed && { backgroundColor: colors.border }]}
    >
      {icon ?? <Text style={styles.keyText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: space.lg },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.muted },
  dotOn: { backgroundColor: colors.green, borderColor: colors.green },
  grid: { width: 276, flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  keyFace: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  keyText: { color: colors.text, fontSize: 28, fontWeight: '400' },
});
