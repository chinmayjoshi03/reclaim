import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { PinSetup } from '../../src/components/PinSetup';
import { SwitchRow } from '../../src/components/SwitchRow';
import { TimeField } from '../../src/components/TimeField';
import { Body, Button, Card, H1, Muted, Screen } from '../../src/components/ui';
import { HOUSE_RULES, PROFESSIONAL_NOTE } from '../../src/config/about';
import { LEVELS, NOTIFY_OFFSETS } from '../../src/config/rules';
import { colors, radius, space } from '../../src/config/theme';
import { exportBackup, pickBackup, restoreBackup } from '../../src/db/backupFile';
import * as repo from '../../src/db/repo';
import { seedDatabase } from '../../src/db/seed';
import type { NotifyToggles } from '../../src/db/settings';
import { dayMonth, prettyTime, shortLabel } from '../../src/logic/dates';
import { biometricAvailable, clearPin, setPin } from '../../src/lock/pin';
import { reminderTimes } from '../../src/notifications/plan';
import { getPermission, requestPermission, type PermissionState } from '../../src/notifications/schedule';
import { useApp } from '../../src/store/useApp';

export default function SettingsScreen() {
  const settings = useApp((s) => s.settings);
  const save = useApp((s) => s.saveSettings);
  const load = useApp((s) => s.load);
  const [perm, setPerm] = useState<{ state: PermissionState; canAskAgain: boolean } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPermission().then(setPerm).catch(() => setPerm(null));
    }, []),
  );

  if (!settings) return null;
  const times = reminderTimes(settings);
  const setNotify = (k: keyof NotifyToggles) => (v: boolean) => save({ notify: { ...settings.notify, [k]: v } });
  const granted = perm?.state === 'granted';

  return (
    <Screen>
      <H1>Settings</H1>

      <Section title="Times">
        <TimeField
          label="Plug-in time"
          hint="Phone on the charger by this time. Night mode starts here."
          value={settings.plugInTime}
          onChange={(v) => save({ plugInTime: v })}
        />
        <TimeField
          label="Risky afternoon hour"
          value={settings.riskyAfternoonTime}
          onChange={(v) => save({ riskyAfternoonTime: v })}
        />
        <TimeField
          label="Desk log time"
          hint="When you fill in yesterday, at a desk."
          value={settings.deskLogTime}
          onChange={(v) => save({ deskLogTime: v })}
        />
      </Section>

      <Section title="Reminders">
        {!granted && (
          <View style={{ gap: space.sm, paddingBottom: space.sm }}>
            <Muted>Notifications are off for this app.</Muted>
            <Button
              label={perm?.canAskAgain === false ? 'Open Android settings' : 'Allow notifications'}
              variant="primary"
              onPress={async () => {
                if (perm?.canAskAgain === false) return Linking.openSettings();
                await requestPermission();
                setPerm(await getPermission());
                useApp.getState().refreshNotifications();
              }}
            />
          </View>
        )}
        <SwitchRow
          label="Daily log"
          hint={`${prettyTime(times.dailyLog)} · plus one follow-up at 6:00 pm if yesterday is empty`}
          value={settings.notify.dailyLog}
          onChange={setNotify('dailyLog')}
          disabled={!granted}
        />
        <SwitchRow
          label="Follow-up if yesterday is empty"
          hint="6:00 pm, only when needed"
          value={settings.notify.followUp}
          onChange={setNotify('followUp')}
          disabled={!granted}
        />
        <SwitchRow
          label="Afternoon plan"
          hint={`${prettyTime(times.afternoon)} · ${NOTIFY_OFFSETS.afternoonBefore} min before the risky hour`}
          value={settings.notify.afternoon}
          onChange={setNotify('afternoon')}
          disabled={!granted}
        />
        <SwitchRow
          label="Wind-down"
          hint={`${prettyTime(times.windDown)} · ${NOTIFY_OFFSETS.windDownBefore} min before plug-in`}
          value={settings.notify.windDown}
          onChange={setNotify('windDown')}
          disabled={!granted}
        />
        <SwitchRow
          label="Plug-in"
          hint={prettyTime(times.plugIn)}
          value={settings.notify.plugIn}
          onChange={setNotify('plugIn')}
          disabled={!granted}
        />
        <Muted>Reminder text is always neutral, safe for the lock screen.</Muted>
      </Section>

      <Section title="Rewards">
        <Muted>Pick things that have nothing to do with your phone or staying in bed.</Muted>
        {LEVELS.map((l) => (
          <RewardInput
            key={l.level}
            label={`Level ${l.level} · ${l.name}`}
            value={settings.rewards[String(l.level)] ?? l.defaultReward}
            onSave={(v) =>
              save({ rewards: { ...settings.rewards, [String(l.level)]: v.trim() || l.defaultReward } })
            }
          />
        ))}
      </Section>

      <LockSection />

      <Section title="Backup">
        <Muted>A JSON file with all your logs, levels and settings. Your PIN is never included.</Muted>
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button
            label="Export backup"
            onPress={() => exportBackup().catch((e) => Alert.alert('Export didn’t work', String(e?.message ?? e)))}
          />
          <Button
            label="Import backup"
            onPress={async () => {
              try {
                const b = await pickBackup();
                if (!b) return;
                const when = b.exportedAt ? ` from ${dayMonth(b.exportedAt.slice(0, 10))}` : '';
                Alert.alert(
                  'Replace all data?',
                  `This backup${when} has ${b.days.length} logged days. Everything on this phone will be replaced. Your app lock stays as it is.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Replace',
                      style: 'destructive',
                      onPress: async () => {
                        await restoreBackup(b);
                        await load();
                        Alert.alert('Backup restored', `${b.days.length} days imported.`);
                      },
                    },
                  ],
                );
              } catch (e) {
                Alert.alert('Import didn’t work', e instanceof Error ? e.message : String(e));
              }
            }}
          />
        </View>
      </Section>

      <Section title="About this plan">
        <Body style={{ fontWeight: '700' }}>House rules</Body>
        {HOUSE_RULES.map((r) => (
          <View key={r} style={styles.rule}>
            <Text style={styles.bullet}>•</Text>
            <Body style={{ flex: 1, lineHeight: 21 }}>{r}</Body>
          </View>
        ))}
        <Body style={{ color: colors.muted, lineHeight: 21, marginTop: space.sm }}>{PROFESSIONAL_NOTE}</Body>
        <Muted style={{ marginTop: space.sm }}>Plan started {shortLabel(settings.startDate)}. Everything stays on this phone.</Muted>
      </Section>

      <Section title="Data">
        <Button
          variant="danger"
          label="Reset all data"
          onPress={() =>
            Alert.alert('Reset all data?', 'Every log, point, level and setting on this phone will be deleted.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Continue',
                style: 'destructive',
                onPress: () =>
                  Alert.alert('Are you sure?', 'This cannot be undone. Export a backup first if you might want it.', [
                    { text: 'Keep my data', style: 'cancel' },
                    {
                      text: 'Delete everything',
                      style: 'destructive',
                      onPress: async () => {
                        await repo.wipeAll();
                        await clearPin();
                        await load();
                      },
                    },
                  ]),
              },
            ])
          }
        />
      </Section>

      {__DEV__ && (
        <Section title="Developer (dev builds only)">
          <Button
            label="Seed 30 days of fake data"
            onPress={() =>
              Alert.alert('Replace all data?', 'Your real logs will be deleted and replaced with 30 fake days.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Seed',
                  style: 'destructive',
                  onPress: async () => {
                    await seedDatabase();
                    await load();
                  },
                },
              ])
            }
          />
        </Section>
      )}
    </Screen>
  );
}

function LockSection() {
  const lock = useApp((s) => s.settings?.lock ?? { enabled: false, useBiometric: false });
  const save = useApp((s) => s.saveSettings);
  const setUnlocked = useApp((s) => s.setUnlocked);
  const [setup, setSetup] = useState(false);
  const [bioOk, setBioOk] = useState(false);

  useEffect(() => {
    biometricAvailable().then(setBioOk);
  }, []);

  return (
    <Section title="App lock">
      <SwitchRow
        label="Lock with a PIN"
        hint="Asked when you open the app, and again after 30 seconds away."
        value={lock.enabled}
        onChange={async (v) => {
          if (v) return setSetup(true);
          await clearPin();
          await save({ lock: { enabled: false, useBiometric: false } });
        }}
      />
      <SwitchRow
        label="Unlock with fingerprint"
        hint={bioOk ? 'PIN still works as a backup.' : 'No fingerprint set up on this phone.'}
        value={lock.useBiometric}
        disabled={!lock.enabled || !bioOk}
        onChange={(v) => save({ lock: { ...lock, useBiometric: v } })}
      />
      {lock.enabled && <Button label="Change PIN" variant="ghost" onPress={() => setSetup(true)} />}
      <PinSetup
        visible={setup}
        onCancel={() => setSetup(false)}
        onDone={async (pin) => {
          await setPin(pin);
          setUnlocked(true);
          await save({ lock: { ...lock, enabled: true } });
          setSetup(false);
        }}
      />
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.section}>{title}</Text>
      <Card style={{ gap: space.xs }}>{children}</Card>
    </View>
  );
}

function RewardInput({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <View style={{ gap: 6, paddingVertical: space.sm }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => text !== value && onSave(text)}
        onSubmitEditing={() => text !== value && onSave(text)}
        returnKeyType="done"
        style={styles.input}
        placeholderTextColor={colors.muted}
        accessibilityLabel={`${label} reward`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: space.xs,
  },
  label: { color: colors.text, fontSize: 15 },
  input: {
    minHeight: 48,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
  },
  rule: { flexDirection: 'row', gap: space.sm },
  bullet: { color: colors.green, fontSize: 15, lineHeight: 21 },
});
