import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type ChallengeCardProps = PressableProps & {
  title: string;
  typeLabel: string;
  statusLabel: string;
  progressPercent: number;
};

export const ChallengeCard = forwardRef<View, ChallengeCardProps>(function ChallengeCard(
  { title, typeLabel, statusLabel, progressPercent, style, ...props },
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        {typeLabel} • {statusLabel}
      </Text>
      <ProgressBar progressPercent={progressPercent} />
      <Text style={styles.progress}>{Math.round(progressPercent)}%</Text>
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
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
