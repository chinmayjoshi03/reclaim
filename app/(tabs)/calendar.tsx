import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DaySheet } from '../../src/components/DaySheet';
import { MonthCalendar } from '../../src/components/MonthCalendar';
import { StatTrio } from '../../src/components/StatTrio';
import { Card, Screen } from '../../src/components/ui';
import { colors, space, type } from '../../src/config/theme';
import { parseKey } from '../../src/logic/dates';
import { streakSummary } from '../../src/logic/streaks';
import { useApp } from '../../src/store/useApp';
import { useToday } from '../../src/store/useToday';

const ym = (y: number, m: number) => y * 12 + (m - 1);

export default function CalendarScreen() {
  const today = useToday();
  const days = useApp((s) => s.days);
  const startDate = useApp((s) => s.settings?.startDate ?? today);
  const t = parseKey(today);
  const [view, setView] = useState({ y: t.y, m: t.m });
  const [open, setOpen] = useState<string | null>(null);

  const summary = useMemo(() => streakSummary(days, today), [days, today]);

  // Earliest month you can go back to: the plan start or the first log, whichever is earlier.
  const earliest = useMemo(() => {
    const first = Object.keys(days).sort()[0];
    const k = first && first < startDate ? first : startDate;
    const p = parseKey(k);
    return ym(p.y, p.m);
  }, [days, startDate]);

  const cur = ym(view.y, view.m);
  const canPrev = cur > earliest;
  const canNext = cur < ym(t.y, t.m);
  const shift = (delta: -1 | 1) => {
    const n = cur + delta;
    setView({ y: Math.floor(n / 12), m: (n % 12) + 1 });
  };

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Text style={type.serifTitle}>Activity calendar</Text>
        <View style={styles.underline} />
        <Text style={styles.helper}>Tap a day to open its log. Your calendar shows how each day went.</Text>
      </View>

      <StatTrio
        items={[
          { label: 'Current streak', value: summary.current },
          { label: 'Best streak', value: summary.best },
          { label: 'Clean days this month', value: summary.cleanThisMonth },
        ]}
      />

      {summary.restartMessage && (
        <Card>
          <Text style={styles.restart}>{summary.restartMessage}</Text>
        </Card>
      )}

      <MonthCalendar
        y={view.y}
        m={view.m}
        today={today}
        days={days}
        canPrev={canPrev}
        canNext={canNext}
        onMonth={shift}
        onDay={setOpen}
      />

      <DaySheet date={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  underline: { width: 70, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  helper: { color: colors.muted, fontSize: 14, marginTop: space.xs },
  restart: { color: colors.text, fontSize: 15, lineHeight: 22 },
});
