import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { BOSS_REQUIRED_HITS, type ManualField } from '../config/rules';
import { colors, radius, space } from '../config/theme';
import type { BossProgress } from '../logic/bosses';
import { dayMonth } from '../logic/dates';
import type { LevelStatus, LevelView } from '../logic/levels';
import { useApp } from '../store/useApp';
import { QuestRow } from './QuestRow';
import { Card, Muted } from './ui';

const CHIP: Record<LevelStatus, { text: string; fg: string; bg: string }> = {
  locked: { text: 'Locked', fg: colors.muted, bg: colors.surfaceRaised },
  in_progress: { text: 'In progress', fg: colors.text, bg: colors.surfaceRaised },
  boss_ready: { text: 'Boss ready', fg: colors.gold, bg: colors.goldSoft },
  cleared: { text: 'Cleared', fg: colors.green, bg: colors.greenSoft },
};

export function LevelCard({
  view,
  boss,
  total,
  reward,
}: {
  view: LevelView;
  boss: BossProgress;
  total: number;
  reward: string;
}) {
  const saveLevel = useApp((s) => s.saveLevel);
  const { rule, state, status } = view;
  const chip = CHIP[status];
  const locked = status === 'locked';
  const practice = status === 'in_progress';

  const setManual = (field: ManualField, v: boolean) => saveLevel({ ...state, [field]: v });

  const manualRows: { field: ManualField; label: string }[] = [];
  for (const r of rule.boss) {
    if (r.kind === 'manual') manualRows.push({ field: r.field, label: r.label });
    else if (r.manualOverride) manualRows.push({ field: r.manualOverride, label: r.manualLabel ?? r.label });
  }

  return (
    <Card style={[{ gap: space.md }, status === 'boss_ready' && { borderColor: colors.gold }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Muted>Level {rule.level}</Muted>
          <Text style={[styles.name, locked && { color: colors.muted }]}>{rule.name}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: chip.bg }]}>
          {locked && <Ionicons name="lock-closed" size={12} color={chip.fg} />}
          <Text style={[styles.chipText, { color: chip.fg }]}>{chip.text}</Text>
        </View>
      </View>

      {status !== 'cleared' && (
        <View style={{ gap: 6 }}>
          <Bar progress={Math.min(1, total / rule.points)} color={colors.green} />
          <Muted>
            {Math.min(total, rule.points)} / {rule.points} points
            {view.pointsToGo > 0 ? ` · ${view.pointsToGo} to go` : ''}
          </Muted>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        <Text style={styles.bossTitle}>Boss: {rule.bossTitle}</Text>
        {boss.current.map((p, i) => {
          const showProgress = !locked && status !== 'cleared';
          return (
            <View key={i} style={styles.req}>
              <Ionicons
                name={status === 'cleared' || (showProgress && p.met) ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={status === 'cleared' || (showProgress && p.met) ? colors.green : colors.border}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.reqLabel}>{p.req.label}</Text>
                {showProgress && p.req.kind === 'count' && (
                  <>
                    <Bar progress={Math.min(1, p.hits / BOSS_REQUIRED_HITS)} color={p.met ? colors.green : colors.gold} />
                    <Muted>
                      {practice ? 'Practice: ' : ''}
                      {p.text}
                    </Muted>
                  </>
                )}
              </View>
            </View>
          );
        })}
        {practice && <Muted>The boss fight starts once you reach {rule.points} points.</Muted>}
        {status === 'boss_ready' && boss.unlockedOn && (
          <Muted>Any 7 days from {dayMonth(boss.unlockedOn)} on count.</Muted>
        )}
      </View>

      {manualRows.length > 0 && status !== 'cleared' && (
        <View style={{ gap: space.sm }}>
          {manualRows.map((r) => (
            <QuestRow
              key={r.field}
              label={r.label}
              tag="manual"
              checked={!!state[r.field]}
              onToggle={(v) => setManual(r.field, v)}
            />
          ))}
        </View>
      )}

      <View style={styles.reward}>
        <Ionicons name="gift-outline" size={18} color={status === 'cleared' ? colors.green : colors.gold} />
        <Text style={styles.rewardText}>Reward: {reward}</Text>
      </View>
      {status === 'cleared' && state.cleared_on && <Muted>Cleared on {dayMonth(state.cleared_on)}.</Muted>}
    </Card>
  );
}

function Bar({ progress, color }: { progress: number; color: string }) {
  return (
    <View style={styles.bar}>
      <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  chipText: { fontSize: 12, fontWeight: '700' },
  bossTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  req: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  reqLabel: { color: colors.text, fontSize: 15 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rewardText: { color: colors.text, fontSize: 15, flex: 1 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
