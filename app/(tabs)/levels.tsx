import { useMemo } from 'react';
import { LevelCard } from '../../src/components/LevelCard';
import { H1, Muted, Screen } from '../../src/components/ui';
import { bossProgress } from '../../src/logic/bosses';
import { levelViews } from '../../src/logic/levels';
import { totalPoints } from '../../src/logic/points';
import { useApp } from '../../src/store/useApp';
import { useToday } from '../../src/store/useToday';

export default function LevelsScreen() {
  const today = useToday();
  const days = useApp((s) => s.days);
  const levels = useApp((s) => s.levels);
  const rewards = useApp((s) => s.settings?.rewards ?? {});
  const total = useMemo(() => totalPoints(days), [days]);
  const views = useMemo(() => levelViews(total, levels), [total, levels]);

  return (
    <Screen>
      <H1>Levels</H1>
      <Muted style={{ fontSize: 14 }}>
        {total} points. Each boss is any 7 days where you hit it 5 times. Points never go down.
      </Muted>
      {views.map((v) => (
        <LevelCard
          key={v.rule.level}
          view={v}
          total={total}
          boss={bossProgress(v.rule, days, levels, today)}
          reward={rewards[String(v.rule.level)] ?? v.rule.defaultReward}
        />
      ))}
    </Screen>
  );
}
