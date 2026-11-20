import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from '../../src/components/BarChart';
import { Card, H1, Muted, Screen } from '../../src/components/ui';
import { colors, space } from '../../src/config/theme';
import { dayMonth } from '../../src/logic/dates';
import { weekOrigin, weekSummaries, type WeekSummary } from '../../src/logic/weeks';
import { useApp } from '../../src/store/useApp';
import { useToday } from '../../src/store/useToday';

const CHART_WEEKS = 12;

export default function WeekScreen() {
  const today = useToday();
  const days = useApp((s) => s.days);
  const startDate = useApp((s) => s.settings?.startDate ?? today);
  const weeks = useMemo(() => weekSummaries(days, weekOrigin(days, startDate), today), [days, startDate, today]);
  const recent = weeks.slice(-CHART_WEEKS);
  const range = (w: WeekSummary) => `${dayMonth(w.start)} – ${dayMonth(w.end)}`;

  return (
    <Screen>
      <H1>Week</H1>
      <Muted style={{ fontSize: 14 }}>The goal is the trend, not perfection.</Muted>

      <Card style={{ gap: space.xl }}>
        <BarChart
          title="Points per week"
          unit="points"
          color={colors.green}
          data={recent.map((w) => ({ label: `W${w.number}`, value: w.points, detail: `Week ${w.number}` }))}
        />
        <BarChart
          title="Episodes per week"
          unit="episodes"
          color={colors.muted}
          data={recent.map((w) => ({ label: `W${w.number}`, value: w.episodes, detail: `Week ${w.number}` }))}
        />
        {weeks.length > CHART_WEEKS && <Muted>Charts show the last {CHART_WEEKS} weeks.</Muted>}
        <Muted>Tap a bar to see its value.</Muted>
      </Card>

      {[...weeks].reverse().map((w) => (
        <Card key={w.number} style={{ gap: space.md }}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.week}>Week {w.number}</Text>
              <Muted>
                {range(w)}
                {w.daysSoFar < 7 ? ` · ${w.daysSoFar} of 7 days so far` : ''}
              </Muted>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.points}>{w.points}</Text>
              <Muted>points</Muted>
            </View>
          </View>
          <View style={styles.grid}>
            <Stat label="Nights on charger" value={`${w.charger}/${w.daysSoFar}`} />
            <Stat label="Afternoons planned" value={`${w.afternoonsPlanned}/${w.daysSoFar}`} />
            <Stat label="Wind-downs" value={`${w.windDowns}/${w.daysSoFar}`} />
            <Stat label="Nights without porn" value={`${w.nightsWithoutPorn}/${w.daysSoFar}`} />
            <Stat label="Episodes" value={String(w.episodes)} />
            <Stat label="Average sleep" value={w.avgSleep === null ? '–' : `${w.avgSleep}/5`} />
          </View>
          {w.loggedDays < w.daysSoFar && (
            <Muted>
              {w.loggedDays} of {w.daysSoFar} days logged.
            </Muted>
          )}
        </Card>
      ))}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  week: { color: colors.text, fontSize: 17, fontWeight: '700' },
  points: { color: colors.green, fontSize: 24, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  stat: { width: '50%', gap: 2, paddingRight: space.sm },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 12 },
});
