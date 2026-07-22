import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors } from '@/theme/colors';

export type ActionMenuButtonProps = PressableProps;

export function ActionMenuButton({ style, ...props }: ActionMenuButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Открыть действия"
      hitSlop={8}
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <Text style={styles.text}>⋯</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
});
