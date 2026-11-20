import { StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../config/theme';
import { levelHeadline, levelViews } from '../logic/levels';
import { totalPoints } from '../logic/points';
import { useApp } from '../store/useApp';
import { Card } from './ui';

export function PointsHeader() {
  const days = useApp((s) => s.days);
  const levels = useApp((s) => s.levels);
  const total = totalPoints(days);
  const head = levelHeadline(levelViews(total, levels));
  const ready = head.subtitle === 'Beat the boss';
  return (
    <Card style={styles.card}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.level}>{head.title}</Text>
        <Text style={[styles.sub, ready && { color: colors.gold, fontWeight: '700' }]}>{head.subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.total}>{total}</Text>
        <Text style={styles.sub}>points</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  level: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 14 },
  total: { color: colors.green, fontSize: 34, fontWeight: '800' },
});
