# Reclaim

A private, offline Android tracker for a sleep-routine plan. Daily quests, points,
levels with boss fights, a streak calendar, weekly trends and timed reminders.

- **No backend, no accounts, no analytics.** The release APK has no internet permission at all.
- All data lives in SQLite on the phone. Android's cloud auto-backup is turned off.
- Backup is a JSON file you export and import yourself. The app-lock PIN is kept in the
  Android Keystore and is never written to a backup.

Built with Expo SDK 58, TypeScript, expo-router, expo-sqlite, expo-notifications and zustand.

---

## Run it on your phone (Expo Go)

1. Install **Expo Go** from the Play Store. It must support SDK 58.
2. On your computer:
   ```bash
   cd reclaim
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go. Phone and computer must be on the same Wi-Fi; otherwise use
   `npx expo start --tunnel`.

Use the phone, not the browser. This app is Android-only, so pressing `w` (web) shows an error.

**Expo Go limitation:** it only partly supports notifications, so reminders may not arrive
there. Use a development build or the APK (below) to test reminders.

### Test data
In a dev build or Expo Go, **Settings → Developer → Seed 30 days of fake data** fills 30 days
covering every calendar state, an improving trend and a few blank days. This button never
appears in the release APK. The generator is `src/db/seed.ts`.

---

## Build the APK (EAS)

One-time setup, with a free Expo account:
```bash
npm install -g eas-cli      # or prefix commands with: npx eas-cli@latest
eas login
eas init                    # links the project to your account (adds a projectId)
```

Build an installable APK in the cloud:
```bash
eas build -p android --profile preview
```
When it finishes, EAS shows a link and QR code. Open it on your phone, download the `.apk`
and install it (allow "install unknown apps" for your browser once).

Profiles (`eas.json`):

| Profile | Output | Use |
|---|---|---|
| `development` | APK with dev client | Testing with the dev server, including notifications |
| `preview` | APK | **The one to install.** Network permission removed, no dev tools |
| `production` | AAB | Only if you ever publish to the Play Store |

The network permission is removed for `preview` and `production` in `app.config.ts`.

---

## Change the rules

Everything game-related is in **`src/config/rules.ts`**:

- `DAILY_QUESTS`: quest labels and points
- `LOG_FILLED_POINTS`, `URGE_BATTLE_POINTS`, `URGE_BATTLE_MAX_PER_DAY`, `COMEBACK_POINTS`
- `LEVELS`: names, point thresholds, boss requirements, default rewards
- `BOSS_WINDOW_DAYS` / `BOSS_REQUIRED_HITS`: the "5 of 7" rule
- `URGE_TIMER_MINUTES`, `EDITABLE_DAYS`, `DAY_ROLLOVER_HOUR` (the day ends at 04:00, so 01:30 still counts as last night)
- `DEFAULT_TIMES`, `NOTIFY_OFFSETS`, `MAX_NOTIFICATIONS_PER_DAY`

Coaching and notification text is in **`src/config/messages.ts`**. Tests check it: no
shaming words anywhere, and nothing revealing in notification text (a lock-screen word list).

After changing rules, run the tests:
```bash
npm test          # runs in Asia/Kolkata time
npm run typecheck
```

Rewards and times can also be changed in the app under Settings.

---

## How things work

- **Points** are the sum of every day's points (`src/logic/points.ts`). Nothing is ever deducted.
- **Streaks** count consecutive Completed days: slept without porn and 0 episodes
  (`src/logic/streaks.ts`). If tonight isn't logged yet, the streak counts up to yesterday.
- **Bosses**: any 7-day window starting on or after the level unlocks. A level unlocks once the
  points are reached and the previous boss is cleared (`src/logic/bosses.ts`). A cleared boss
  stays cleared.
- **Reminders** (`src/notifications/`):
  - 4 daily repeating reminders. Their text rotates whenever the app opens.
  - Plus one 6 pm follow-up, only if yesterday is still empty. At most 5 a day.
  - No exact alarms are used, so Android may deliver them a few minutes late.
- **Night mode**: between plug-in time and 04:00, opening the app shows the Charger time
  screen first.
- **App lock**: a 4-digit PIN, plus fingerprint if you want it. It locks again after
  30 seconds in the background. If you forget the PIN: Android Settings → Apps → Reclaim →
  Clear storage. That erases all data, so export a backup first.

## Folders

```
app/                 screens (expo-router): tabs, urge, slip, night, boss
src/config/          rules.ts, messages.ts, theme.ts, about.ts
src/db/              SQLite schema + migrations, repository, settings, seed, backup files
src/logic/           pure functions (points, streaks, bosses, weeks, dates, backup) + tests
src/notifications/   reminder plan (pure, tested) and scheduler
src/lock/            PIN + fingerprint
src/components/      UI pieces
src/store/           zustand store
```

---

This app is a tool, not a replacement for a professional. If things don't improve in 4–6 weeks,
talk to a psychologist or your college counsellor.
