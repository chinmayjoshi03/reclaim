import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getPermission, requestPermission } from '../notifications/schedule';
import { useApp } from '../store/useApp';
import { Body, Button, Card, Muted } from './ui';
import { View } from 'react-native';

/** Asks once for notification permission (Android 13+), with a way to say no. */
export function ReminderPrompt() {
  const dismissed = useApp((s) => s.settings?.reminderPromptDismissed ?? true);
  const saveSettings = useApp((s) => s.saveSettings);
  const refresh = useApp((s) => s.refreshNotifications);
  const [show, setShow] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (dismissed) return setShow(false);
      getPermission()
        .then((p) => setShow(p.state !== 'granted' && p.canAskAgain))
        .catch(() => setShow(false));
    }, [dismissed]),
  );

  if (!show) return null;
  return (
    <Card style={{ gap: 10 }}>
      <Body style={{ fontWeight: '700' }}>Turn on reminders?</Body>
      <Muted>Up to 5 short nudges a day: desk log, afternoon, wind-down, charger. The text never says what the plan is about.</Muted>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Not now" variant="ghost" style={{ flex: 1 }} onPress={() => saveSettings({ reminderPromptDismissed: true })} />
        <Button
          label="Turn on"
          variant="primary"
          style={{ flex: 1 }}
          onPress={async () => {
            await requestPermission();
            setShow(false);
            await saveSettings({ reminderPromptDismissed: true });
            await refresh();
          }}
        />
      </View>
    </Card>
  );
}
