import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Release builds (EAS "preview" / "production" profiles) ship with the network
 * permission removed, so the APK physically cannot talk to the internet.
 * Development builds keep it because they need to reach the Metro bundler.
 */
const OFFLINE_PROFILES = ['preview', 'production'];

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE ?? '';
  const offline = OFFLINE_PROFILES.includes(profile);
  const blocked = config.android?.blockedPermissions ?? [];
  return {
    ...config,
    name: config.name ?? 'Reclaim',
    slug: config.slug ?? 'reclaim',
    android: {
      ...config.android,
      blockedPermissions: offline
        ? [...blocked, 'android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE']
        : blocked,
    },
  };
};
