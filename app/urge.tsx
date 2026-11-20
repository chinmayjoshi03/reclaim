import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressRing } from '../src/components/ProgressRing';
import { Button, Muted } from '../src/components/ui';
import { URGE_COPY, URGE_STEPS } from '../src/config/messages';
import { colors, MIN_TAP, radius, space } from '../src/config/theme';
import { formatCountdown, URGE_TIMER_MS, urgeStepIndex } from '../src/logic/urge';
import { useApp } from '../src/store/useApp';

type Phase = 'running' | 'ask' | 'reply';
type Outcome = keyof typeof URGE_COPY.outcomes;

export default function UrgeScreen() {
  const active = useApp((s) => s.activeUrge);
  const startUrge = useApp((s) => s.startUrge);
  const finishUrge = useApp((s) => s.finishUrge);
  const [now, setNow] = useState(Date.now());
  const [phase, setPhase] = useState<Phase>('running');
  const [reply, setReply] = useState('');
  // Captured at open so the "+10" line doesn't change as the session settles.
  const [awarded] = useState(() => useApp.getState().activeUrge?.awarded);

  // Opening this screen starts a timer (or resumes the running one).
  useEffect(() => {
    if (!useApp.getState().activeUrge) startUrge();
  }, [startUrge]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startedAt = active?.startedAt ?? now;
  const elapsed = now - startedAt;
  const remaining = URGE_TIMER_MS - elapsed;
  const step = urgeStepIndex(elapsed);

  useEffect(() => {
    if (phase === 'running' && active && remaining <= 0) setPhase('ask');
  }, [phase, active, remaining]);

  const choose = async (o: Outcome) => {
    await finishUrge(o);
    if (o === 'slipped') {
      router.replace('/slip');
      return;
    }
    setReply(URGE_COPY.outcomes[o].reply);
    setPhase('reply');
  };

  const wasAwarded = awarded ?? active?.awarded ?? true;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Muted style={{ flex: 1 }}>{phase === 'running' ? (wasAwarded ? URGE_COPY.started : URGE_COPY.startedNoPoints) : ''}</Muted>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close. The timer keeps running."
          onPress={() => router.back()}
          style={styles.close}
        >
          <Ionicons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {phase === 'running' && (
        <View style={styles.body}>
          <View style={styles.ringWrap}>
            <ProgressRing size={220} stroke={10} progress={elapsed / URGE_TIMER_MS} />
            <View style={styles.ringCenter}>
              <Text style={styles.clock}>{formatCountdown(remaining)}</Text>
              <Muted>it will pass</Muted>
            </View>
          </View>

          <View style={{ gap: space.sm, alignSelf: 'stretch' }}>
            {URGE_STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'now' : 'next';
              return (
                <View key={s.title} style={[styles.step, state === 'now' && styles.stepNow]}>
                  <Ionicons
                    name={state === 'done' ? 'checkmark-circle' : state === 'now' ? 'arrow-forward-circle' : 'ellipse-outline'}
                    size={22}
                    color={state === 'next' ? colors.border : colors.green}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepTitle, state === 'next' && { color: colors.muted }]}>{s.title}</Text>
                    <Text style={[styles.stepText, state !== 'now' && { color: colors.muted }]}>{s.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Button variant="ghost" label="I’m done early" onPress={() => setPhase('ask')} style={{ alignSelf: 'stretch' }} />
        </View>
      )}

      {phase === 'ask' && (
        <View style={[styles.body, { justifyContent: 'center' }]}>
          <Text style={styles.big}>{URGE_COPY.endTitle}</Text>
          <Muted style={{ textAlign: 'center' }}>{URGE_COPY.endSubtitle}</Muted>
          <View style={{ gap: space.md, alignSelf: 'stretch', marginTop: space.lg }}>
            <Button big variant="secondary" label={URGE_COPY.outcomes.passed.label} onPress={() => choose('passed')} />
            <Button big variant="secondary" label={URGE_COPY.outcomes.still.label} onPress={() => choose('still')} />
            <Button big variant="secondary" label={URGE_COPY.outcomes.slipped.label} onPress={() => choose('slipped')} />
          </View>
        </View>
      )}

      {phase === 'reply' && (
        <View style={[styles.body, { justifyContent: 'center' }]}>
          <Text style={[styles.big, { fontSize: 22 }]}>{reply}</Text>
          <Button big variant="primary" label="Close" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: space.xl }} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  close: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', gap: space.xl, paddingTop: space.lg },
  ringWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  clock: { color: colors.text, fontSize: 52, fontWeight: '300', fontVariant: ['tabular-nums'] },
  step: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepNow: { backgroundColor: colors.surface, borderColor: colors.border },
  stepTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  stepText: { color: colors.text, fontSize: 15, marginTop: 2 },
  big: { color: colors.text, fontSize: 28, fontWeight: '700', textAlign: 'center' },
});
