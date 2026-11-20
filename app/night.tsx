import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuestRow } from '../src/components/QuestRow';
import { Button, Muted } from '../src/components/ui';
import { NIGHT_COPY } from '../src/config/messages';
import { DAILY_QUESTS } from '../src/config/rules';
import { colors, space } from '../src/config/theme';
import { logicalDayKey, prettyTime } from '../src/logic/dates';
import { useApp } from '../src/store/useApp';

/** Calm screen shown first after plug-in time. Two ways out, both short. */
export default function NightScreen() {
  const [quick, setQuick] = useState(false);
  const date = logicalDayKey();
  const day = useApp((s) => s.days[date]) ?? useApp.getState().getDay(date);
  const saveDay = useApp((s) => s.saveDay);
  const plugIn = useApp((s) => s.settings?.plugInTime ?? '22:30');

  if (!quick) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Ionicons name="battery-charging-outline" size={64} color={colors.green} />
          <Text style={styles.title}>{NIGHT_COPY.title}</Text>
          <Muted style={styles.body}>{NIGHT_COPY.body}</Muted>
        </View>
        <View style={{ gap: space.md }}>
          <Button big variant="primary" label={NIGHT_COPY.startUrge} onPress={() => router.replace('/urge')} />
          <Button big variant="secondary" label={NIGHT_COPY.quickLog} onPress={() => setQuick(true)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ gap: space.sm, marginBottom: space.lg }}>
        <Text style={[styles.title, { textAlign: 'left' }]}>{NIGHT_COPY.quickTitle}</Text>
        <Muted style={{ fontSize: 15 }}>{NIGHT_COPY.quickSub}</Muted>
      </View>
      <View style={{ flex: 1, gap: space.sm }}>
        {DAILY_QUESTS.filter((q) => q.field !== 'slept_without_porn').map((q) => (
          <QuestRow
            key={q.field}
            label={q.label.replace('{plugIn}', prettyTime(plugIn))}
            points={q.points}
            checked={day[q.field]}
            onToggle={(v) => saveDay(date, { [q.field]: v })}
          />
        ))}
        <Muted style={{ marginTop: space.sm }}>The rest can wait for the desk tomorrow.</Muted>
      </View>
      <Button
        big
        variant="primary"
        label={NIGHT_COPY.done}
        onPress={async () => {
          await saveDay(date, {});
          BackHandler.exitApp();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 23 },
});
