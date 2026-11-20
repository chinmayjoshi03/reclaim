import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { colors } from '../config/theme';
import type { DayStatus } from '../logic/streaks';

/** The small icon under a day number (also used in the legend). */
export function StatusIcon({ status, size = 16 }: { status: DayStatus | 'today'; size?: number }) {
  switch (status) {
    case 'completed':
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={size * 0.72} color={colors.white} />
        </View>
      );
    case 'comeback':
      return <Ionicons name="refresh-circle" size={size + 2} color={colors.amber} />;
    case 'not_completed':
      return <Ionicons name="close-circle-outline" size={size + 2} color={colors.muted} />;
    case 'today':
      return (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.gold }} />
      );
    default:
      return null;
  }
}
