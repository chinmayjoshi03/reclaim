import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../config/theme';
import { PinPad } from './PinPad';
import { Button, Muted } from './ui';

/** Enter a new 4-digit PIN twice. */
export function PinSetup({
  visible,
  onDone,
  onCancel,
}: {
  visible: boolean;
  onDone: (pin: string) => void;
  onCancel: () => void;
}) {
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  const reset = () => {
    setFirst(null);
    setValue('');
    setMsg('');
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => (reset(), onCancel())}>
      <View style={styles.screen}>
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <Text style={styles.title}>{first ? 'Enter it again' : 'Choose a 4-digit PIN'}</Text>
          <Muted style={{ minHeight: 20 }}>{msg || 'Don’t use your phone’s unlock code.'}</Muted>
        </View>
        <PinPad
          value={value}
          onChange={setValue}
          onComplete={(v) => {
            if (!first) {
              setFirst(v);
              setValue('');
              setMsg('');
            } else if (v === first) {
              reset();
              onDone(v);
            } else {
              setFirst(null);
              setValue('');
              setMsg('They didn’t match. Start again.');
            }
          }}
        />
        <Button label="Cancel" variant="ghost" onPress={() => (reset(), onCancel())} style={{ alignSelf: 'stretch' }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'space-evenly', padding: space.xl },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
});
