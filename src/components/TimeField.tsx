import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TAP, radius, space } from '../config/theme';
import { hmToMinutes, minutesToHm, prettyTime } from '../logic/dates';
import { Stepper } from './Stepper';
import { Button } from './ui';

/** A settings row showing a time; tap to change it in a small dialog. */
export function TimeField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (hm: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const mins = hmToMinutes(draft);
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${prettyTime(value)}. Tap to change.`}
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        <Text style={styles.value}>{prettyTime(value)}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{label}</Text>
            <Text style={styles.big}>{prettyTime(draft)}</Text>
            <View style={styles.stepRow}>
              <Text style={styles.stepLabel}>Hour</Text>
              <Stepper value={h} min={0} max={23} onChange={(v) => setDraft(minutesToHm(v * 60 + m))} />
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepLabel}>Minute</Text>
              <Stepper
                value={m}
                min={0}
                max={55}
                onChange={(v) => setDraft(minutesToHm(h * 60 + (v > m ? Math.min(55, m + 5) : Math.max(0, m - 5))))}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.sm }}>
              <Button label="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setOpen(false)} />
              <Button
                label="Save"
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  setOpen(false);
                  if (draft !== value) onChange(draft);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_TAP + 8, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  label: { color: colors.text, fontSize: 16 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  value: { color: colors.green, fontSize: 16, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: space.xl },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.md,
  },
  dialogTitle: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  big: { color: colors.text, fontSize: 40, fontWeight: '300', textAlign: 'center', marginBottom: space.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepLabel: { color: colors.text, fontSize: 16 },
});
