import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { DateSwitcher } from '../../src/components/DateSwitcher';
import { DayLogEditor } from '../../src/components/DayLogEditor';
import { PointsHeader } from '../../src/components/PointsHeader';
import { ReminderPrompt } from '../../src/components/ReminderPrompt';
import { UrgeButton } from '../../src/components/UrgeButton';
import { Button, Screen } from '../../src/components/ui';
import { EDITABLE_DAYS } from '../../src/config/rules';
import { addDays } from '../../src/logic/dates';
import { useToday } from '../../src/store/useToday';

export default function TodayScreen() {
  const today = useToday();
  const [date, setDate] = useState(today);
  const minDate = addDays(today, -(EDITABLE_DAYS - 1));

  // When the day rolls over, jump to the new today.
  useEffect(() => setDate(today), [today]);

  // Opened from the desk-log reminder: show yesterday.
  const { day } = useLocalSearchParams<{ day?: string }>();
  useEffect(() => {
    if (day === 'yesterday') {
      setDate(addDays(today, -1));
      router.setParams({ day: undefined });
    }
  }, [day, today]);

  return (
    <Screen footer={<UrgeButton />}>
      <PointsHeader />
      <ReminderPrompt />
      <DateSwitcher date={date} today={today} minDate={minDate} onChange={setDate} />
      <DayLogEditor key={date} date={date} />
      <Button
        variant="amber"
        label="I slipped — log it and come back  +15"
        onPress={() => router.push({ pathname: '/slip', params: { date } })}
      />
    </Screen>
  );
}
