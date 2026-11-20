import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../config/theme';

export function StatTrio({ items }: { items: { label: string; value: number }[] }) {
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <View key={it.label} style={styles.tile} accessible accessibilityLabel={`${it.label}: ${it.value}`}>
          <Text style={styles.value}>{it.value}</Text>
          <Text style={styles.label} numberOfLines={2}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    gap: 2,
  },
  value: { color: colors.text, fontSize: 28, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
