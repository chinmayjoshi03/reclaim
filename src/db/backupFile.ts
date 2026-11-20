import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildBackup, parseBackup, type Backup } from '../logic/backup';
import { logicalDayKey } from '../logic/dates';
import * as repo from './repo';

/** Write a JSON backup to the cache folder and open the share sheet. */
export async function exportBackup(): Promise<void> {
  const data = await repo.exportAll();
  const backup = buildBackup(data);
  const file = new File(Paths.cache, `reclaim-backup-${logicalDayKey()}.json`);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup, null, 2));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save backup' });
}

/** Let the user pick a backup file. Returns the parsed backup, or null if cancelled. */
export async function pickBackup(): Promise<Backup | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const text = await new File(res.assets[0].uri).text();
  return parseBackup(text);
}

/** Replace all data with the backup. The lock settings on this phone are kept. */
export async function restoreBackup(b: Backup): Promise<void> {
  const current = await repo.getSettings();
  await repo.importAll({
    days: b.days,
    levels: b.levels,
    settings: { ...b.settings, lock: current.lock, reminderPromptDismissed: current.reminderPromptDismissed },
    urgeSessions: b.urgeSessions,
  });
}
