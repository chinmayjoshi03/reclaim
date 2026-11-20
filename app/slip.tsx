import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, H1, Muted, Screen } from '../src/components/ui';
import { SLIP_COPY } from '../src/config/messages';
import { colors, radius, space } from '../src/config/theme';
import { logicalDayKey, shortLabel } from '../src/logic/dates';
import { slipHasContent, type SlipFields } from '../src/logic/slip';
import { useApp } from '../src/store/useApp';

const nowHm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function SlipScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = logicalDayKey();
  const date = typeof params.date === 'string' && params.date ? params.date : today;
  const logSlip = useApp((s) => s.logSlip);

  const [f, setF] = useState<SlipFields>({ time: date === today ? nowHm() : '', place: '', feeling: '', change: '' });
  const [saved, setSaved] = useState<null | { newComeback: boolean }>(null);
  const [busy, setBusy] = useState(false);
  const ok = slipHasContent({ ...f, time: '' }); // the pre-filled time alone doesn't count

  if (saved) {
    return (
      <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
        <Text style={styles.big}>{SLIP_COPY.saved}</Text>
        <Muted style={{ textAlign: 'center', fontSize: 15 }}>
          {saved.newComeback ? SLIP_COPY.savedSub : SLIP_COPY.savedSubAgain}
        </Muted>
        <Button big variant="primary" label="Back to the plan" onPress={() => router.back()} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const field = (key: keyof SlipFields, multiline = false) => (
    <View style={{ gap: space.xs }} key={key}>
      <Text style={styles.label}>{SLIP_COPY.fields[key].label}</Text>
      <TextInput
        value={f[key]}
        onChangeText={(v) => setF((p) => ({ ...p, [key]: v }))}
        placeholder={SLIP_COPY.fields[key].placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 72, textAlignVertical: 'top' }]}
      />
    </View>
  );

  return (
    <Screen>
      <H1>{SLIP_COPY.title}</H1>
      <Muted style={{ fontSize: 15 }}>
        {SLIP_COPY.intro} {date !== today ? `(${shortLabel(date)})` : ''}
      </Muted>
      <Card style={{ gap: space.lg }}>
        {field('time')}
        {field('place')}
        {field('feeling')}
        {field('change', true)}
      </Card>
      {!ok && <Muted>{SLIP_COPY.needOne}</Muted>}
      <Button
        big
        variant="amber"
        label="Log it and come back  +15"
        disabled={!ok || busy}
        onPress={async () => {
          setBusy(true);
          const newComeback = await logSlip(date, f);
          setSaved({ newComeback });
        }}
      />
      <Button variant="ghost" label="Not now" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontWeight: '600', fontSize: 15 },
  input: {
    minHeight: 48,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  big: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 34 },
});
