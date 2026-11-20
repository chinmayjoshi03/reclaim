import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Settings } from '../db/settings';
import type { DateKey, DayLog } from '../logic/types';
import { planNotifications } from './plan';

export const CHANNEL_ID = 'reminders';

/** Foreground behaviour: show in the list quietly, no sound. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady: boolean | null = null;

/**
 * Neutral channel name — it shows in Android's app settings. Never throws:
 * Expo Go's notification module can reject channel creation, and that must
 * not block the permission prompt or scheduling (the default channel is used).
 */
export async function ensureChannel(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (channelReady !== null) return channelReady;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    channelReady = true;
  } catch (e) {
    console.warn('Notification channel unavailable, using the default one.', e);
    channelReady = false;
  }
  return channelReady;
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<{ state: PermissionState; canAskAgain: boolean }> {
  const p = await Notifications.getPermissionsAsync();
  return { state: p.granted ? 'granted' : (p.status as PermissionState), canAskAgain: p.canAskAgain };
}

/** Android 13+ shows the POST_NOTIFICATIONS prompt; the channel must exist first. */
export async function requestPermission(): Promise<boolean> {
  await ensureChannel();
  try {
    const p = await Notifications.requestPermissionsAsync();
    return p.granted;
  } catch (e) {
    console.warn('Notification permission request failed', e);
    return false;
  }
}

type Snapshot = () => { settings: Settings | null; days: Record<DateKey, DayLog> };

let running: Promise<void> | null = null;
let again = false;

/**
 * Cancel and re-create every scheduled reminder from current settings + logs.
 * Calls made while one is running are coalesced into one more run that reads
 * the latest state through `snapshot`.
 */
export function reschedule(snapshot: Snapshot): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        const { settings, days } = snapshot();
        if (settings) await doReschedule(settings, days);
      } while (again);
    } catch (e) {
      console.warn('reschedule failed', e);
    } finally {
      running = null;
    }
  })();
  return running;
}

async function doReschedule(settings: Settings, days: Record<DateKey, DayLog>) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  const channelId = (await ensureChannel()) ? CHANNEL_ID : undefined;
  for (const n of planNotifications(settings, days, new Date())) {
    const trigger: Notifications.NotificationTriggerInput =
      n.trigger.kind === 'daily'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: n.trigger.hour,
            minute: n.trigger.minute,
            channelId,
          }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.trigger.date, channelId };
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, data: { url: n.url }, sound: false },
      trigger,
    });
  }
}
