import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../config/theme';
import { biometricAvailable, biometricUnlock, checkPin } from '../lock/pin';
import { useApp } from '../store/useApp';
import { PinPad } from './PinPad';
import { Muted } from './ui';

/** Full-screen cover shown while the app is locked. */
export function LockScreen() {
  const useBiometric = useApp((s) => s.settings?.lock.useBiometric ?? false);
  const setUnlocked = useApp((s) => s.setUnlocked);
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [bio, setBio] = useState(false);

  const tryBio = useCallback(async () => {
    if (await biometricUnlock()) setUnlocked(true);
  }, [setUnlocked]);

  useEffect(() => {
    if (!useBiometric) return;
    biometricAvailable().then((ok) => {
      setBio(ok);
      if (ok) tryBio();
    });
  }, [useBiometric, tryBio]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Text style={styles.title}>Reclaim</Text>
        <Muted style={{ fontSize: 15, minHeight: 20 }}>{msg || 'Enter your PIN'}</Muted>
      </View>
      <PinPad
        value={pin}
        onChange={(v) => {
          setPin(v);
          if (msg) setMsg('');
        }}
        onComplete={async (v) => {
          if (await checkPin(v)) {
            setUnlocked(true);
          } else {
            setMsg('Not quite. Try again.');
            setPin('');
          }
        }}
        extraKey={bio ? { icon: 'finger-print', label: 'Use fingerprint', onPress: tryBio } : undefined}
      />
      <Muted style={{ textAlign: 'center' }}>Forgot it? Android Settings → Apps → Reclaim → Clear storage resets the app.</Muted>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: space.xl,
    zIndex: 100,
    elevation: 100,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
});
