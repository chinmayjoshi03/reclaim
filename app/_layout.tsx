import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppGates } from '../src/components/AppGates';
import { LockGate } from '../src/components/LockGate';
import { colors } from '../src/config/theme';
import { useApp } from '../src/store/useApp';

SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});

export default function RootLayout() {
  const ready = useApp((s) => s.ready);
  const error = useApp((s) => s.error);
  const load = useApp((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {!ready ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          {error ? (
            <Text style={{ color: colors.muted, padding: 24, textAlign: 'center' }}>
              Couldn’t open your data: {error}
            </Text>
          ) : (
            <ActivityIndicator color={colors.green} />
          )}
        </View>
      ) : (
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          />
          <AppGates />
          <LockGate />
        </>
      )}
    </SafeAreaProvider>
  );
}
