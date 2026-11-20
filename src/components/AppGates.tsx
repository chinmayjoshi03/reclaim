import * as Notifications from 'expo-notifications';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { isNightWindow } from '../logic/dates';
import { useApp } from '../store/useApp';

/** Screens that are fine to stay on at night (don't redirect away from them). */
const NIGHT_SAFE = ['/night', '/urge', '/slip', '/boss'];

/**
 * App-wide behaviour that isn't a screen:
 *  - after plug-in time, opening the app shows the calm night screen first
 *  - tapping a notification opens the screen it belongs to
 *  - reminders are re-planned whenever the app comes to the foreground
 */
export function AppGates() {
  const navReady = !!useRootNavigationState()?.key;
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const nightShown = useRef(false);
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  // Notification taps.
  useEffect(() => {
    if (!navReady || !response) return;
    const key = `${response.notification.request.identifier}:${response.notification.date}`;
    if (handled.current === key) return;
    handled.current = key;
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') {
      if (url === '/night') nightShown.current = true;
      router.push(url as never);
    }
  }, [navReady, response]);

  // Night mode + foreground refresh.
  useEffect(() => {
    if (!navReady) return;
    const check = () => {
      const plugIn = useApp.getState().settings?.plugInTime;
      if (!plugIn || nightShown.current) return;
      if (isNightWindow(new Date(), plugIn) && !NIGHT_SAFE.includes(pathRef.current)) {
        nightShown.current = true;
        router.push('/night');
      }
    };
    // Let a launching notification route first.
    const t = setTimeout(check, 300);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') nightShown.current = false;
      if (s === 'active') {
        useApp.getState().refreshNotifications();
        setTimeout(check, 300);
      }
    });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [navReady]);

  return null;
}
