import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type StatusBadgeStatus = 'active' | 'completed';

export type StatusBadgeProps = {
  status: StatusBadgeStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const isCompleted = status === 'completed';

  return (
    <View style={[styles.badge, isCompleted ? styles.completed : styles.active]}>
      <Text style={[styles.text, isCompleted ? styles.completedText : styles.activeText]}>
        {isCompleted ? 'Выполнен' : 'Активный'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  active: {
    backgroundColor: colors.surfaceMuted,
  },
  completed: {
    backgroundColor: '#DCFCE7',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeText: {
    color: colors.textMuted,
  },
  completedText: {
    color: colors.success,
  },
});
