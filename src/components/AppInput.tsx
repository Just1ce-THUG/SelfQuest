import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputContentSizeChangeEventData,
  type TextInputProps,
  type NativeSyntheticEvent,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({ label, error, style, onContentSizeChange, ...props }: AppInputProps) {
  const [multilineHeight, setMultilineHeight] = useState<number>();

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    if (props.multiline) {
      setMultilineHeight(Math.max(96, event.nativeEvent.contentSize.height + 18));
    }

    onContentSizeChange?.(event);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          props.multiline && multilineHeight ? { height: multilineHeight } : null,
          style,
        ]}
        onContentSizeChange={handleContentSizeChange}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
