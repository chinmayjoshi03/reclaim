import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BOSS_TRACKERS, DAILY_QUESTS, LOG_FILLED_POINTS, type QuestField } from '../config/rules';
import { colors, radius, space } from '../config/theme';
import { prettyTime } from '../logic/dates';
import { dayBreakdown } from '../logic/points';
import { useApp } from '../store/useApp';
import { QuestRow } from './QuestRow';
import { Rating } from './Rating';
import { Stepper } from './Stepper';
import { Button, Card, Muted } from './ui';

/** Full editor for one day's log. Every change saves immediately. */
export function DayLogEditor({ date, readOnly }: { date: string; readOnly?: boolean }) {
  const day = useApp((s) => s.days[date]) ?? useApp.getState().getDay(date);
  const saveDay = useApp((s) => s.saveDay);
  const plugIn = useApp((s) => s.settings?.plugInTime ?? '22:30');
  const b = dayBreakdown(day);

  const toggle = (field: QuestField) => (next: boolean) => saveDay(date, { [field]: next });

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <SectionTitle title="Daily quests" right={`${b.total} pts this day`} />
        {DAILY_QUESTS.map((q) => (
          <QuestRow
            key={q.field}
            label={q.label.replace('{plugIn}', prettyTime(plugIn))}
            points={q.points}
            checked={day[q.field]}
            disabled={readOnly}
            onToggle={toggle(q.field)}
          />
        ))}
        <QuestRow
          label="Filled in this day’s log"
          points={LOG_FILLED_POINTS}
          checked={day.log_filled}
          disabled={readOnly || day.log_filled}
          onToggle={() => saveDay(date, {})}
        />
        {(day.urge_battles > 0 || day.comeback) && (
          <Muted style={{ paddingHorizontal: space.xs }}>
            {[
              day.urge_battles > 0 && `Urge battles: ${day.urge_battles} (+${b.urgeBattles})`,
              day.comeback && 'Comeback (+15)',
            ]
              .filter(Boolean)
              .join('   ·   ')}
          </Muted>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <SectionTitle title="Boss trackers" right="no points" />
        {BOSS_TRACKERS.map((q) => (
          <QuestRow
            key={q.field}
            label={q.label}
            checked={day[q.field]}
            disabled={readOnly}
            onToggle={toggle(q.field)}
          />
        ))}
      </View>

      <Card style={{ gap: space.lg }}>
        <View style={styles.inline}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Episodes</Text>
            <Muted>Tracked, never scored.</Muted>
          </View>
          <Stepper
            value={day.episodes ?? 0}
            disabled={readOnly}
            onChange={(v) => saveDay(date, { episodes: v })}
          />
        </View>
        <View style={{ gap: space.sm }}>
          <Text style={styles.label}>Sleep quality</Text>
          <Rating
            value={day.sleep_quality}
            disabled={readOnly}
            onChange={(v) => saveDay(date, { sleep_quality: v })}
          />
        </View>
        <NoteField date={date} value={day.note} readOnly={readOnly} />
      </Card>

      {!day.log_filled && !readOnly && (
        <Button
          variant="primary"
          big
          label={`Save this day  +${LOG_FILLED_POINTS}`}
          onPress={() => saveDay(date, {})}
        />
      )}
    </View>
  );
}

function NoteField({ date, value, readOnly }: { date: string; value: string; readOnly?: boolean }) {
  const saveDay = useApp((s) => s.saveDay);
  const [text, setText] = useState(value);
  const latest = useRef({ text, value });
  latest.current = { text, value };
  useEffect(() => setText(value), [value, date]);
  // Save an unsaved note if the editor goes away without a blur (e.g. day switched).
  useEffect(
    () => () => {
      const { text: t, value: v } = latest.current;
      if (t !== v) saveDay(date, { note: t });
    },
    [date, saveDay],
  );
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.label}>Note</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => text !== value && saveDay(date, { note: text })}
        editable={!readOnly}
        multiline
        placeholder="Trigger, what happened, what helped"
        placeholderTextColor={colors.muted}
        style={styles.note}
      />
    </View>
  );
}

function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <View style={[styles.inline, { paddingHorizontal: space.xs }]}>
      <Text style={styles.section}>{title}</Text>
      {right ? <Muted>{right}</Muted> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  section: { color: colors.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  note: {
    minHeight: 88,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
});
