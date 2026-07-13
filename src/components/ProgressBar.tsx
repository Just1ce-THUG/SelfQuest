import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

export type ProgressBarProps = {
  progressPercent: number;
};

export function ProgressBar({ progressPercent }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progressPercent, 100));

  return (
    <View accessibilityRole="progressbar" style={styles.track}>
      <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
