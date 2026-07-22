import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { ActionMenuButton } from '@/components/ActionMenuButton';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge, type StatusBadgeStatus } from '@/components/StatusBadge';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatProgressPercent } from '@/utils/progress';

export type ChallengeCardProps = PressableProps & {
  title: string;
  typeLabel: string;
  status: StatusBadgeStatus;
  deadlineLabel: string;
  progressPercent: number;
  onActionPress?: () => void;
};

export const ChallengeCard = forwardRef<View, ChallengeCardProps>(function ChallengeCard(
  { title, typeLabel, status, deadlineLabel, progressPercent, onActionPress, style, ...props },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      style={(state) => [
        styles.card,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <StatusBadge status={status} />
        {onActionPress ? (
          <ActionMenuButton
            onPress={(event) => {
              event.stopPropagation();
              onActionPress();
            }}
          />
        ) : null}
      </View>
      <Text style={styles.meta}>{typeLabel}</Text>
      <Text style={styles.meta}>{deadlineLabel}</Text>
      <ProgressBar progressPercent={progressPercent} />
      <Text style={styles.progress}>{formatProgressPercent(progressPercent)}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  progress: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
