import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors } from '../config/theme';

/** A small "+10" that floats up and fades. Re-fires whenever `trigger` changes (and is > 0). */
export function PointsPop({ points, trigger }: { points: number; trigger: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }).start();
  }, [trigger, anim]);

  if (!trigger) return null;
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.pop,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
        },
      ]}
    >
      +{points}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  pop: { position: 'absolute', right: 16, top: 4, color: colors.green, fontWeight: '700', fontSize: 16 },
});
