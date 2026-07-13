import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type AppButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export const AppButton = forwardRef<View, AppButtonProps>(function AppButton(
  { title, variant = 'primary', disabled, style, ...props },
  ref,
) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        state.pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <Text style={[styles.title, isSecondary ? styles.secondaryTitle : styles.primaryTitle]}>
        {title}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryTitle: {
    color: colors.surface,
  },
  secondaryTitle: {
    color: colors.text,
  },
});
