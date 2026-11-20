import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MIN_TAP, space } from '../config/theme';
import { shortLabel } from '../logic/dates';
import { dayStatus } from '../logic/streaks';
import { useApp } from '../store/useApp';
import { DayLogEditor } from './DayLogEditor';
import { StatusIcon } from './StatusIcon';
import { Button } from './ui';

const STATUS_TEXT = {
  completed: 'Completed',
  comeback: 'Comeback',
  not_completed: 'Logged',
  not_logged: 'Not logged yet',
} as const;

/** Bottom sheet showing one day's log (view + edit). */
export function DaySheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const day = useApp((s) => (date ? s.days[date] : undefined));
  const status = dayStatus(day);
  return (
    <Modal visible={!!date} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior="height" style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        <View style={styles.handle} />
        {date && (
          <>
            <View style={styles.head}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{shortLabel(date)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <StatusIcon status={status} size={14} />
                  <Text style={styles.sub}>{STATUS_TEXT[status]}</Text>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
              <DayLogEditor key={date} date={date} />
              <Button
                variant="amber"
                label="Log a slip for this day  +15"
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/slip', params: { date } });
                }}
              />
            </ScrollView>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.md },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 13 },
  close: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
});
