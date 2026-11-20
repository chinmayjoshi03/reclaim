import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, MIN_TAP, space } from '../config/theme';

export function SwitchRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: colors.border, true: colors.greenSoft }}
        thumbColor={value ? colors.green : colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_TAP + 8, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
  label: { color: colors.text, fontSize: 16 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
