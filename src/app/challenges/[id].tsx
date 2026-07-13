import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/ProgressBar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Детали челленджа</Text>
          <Text style={styles.description}>Заглушка деталей для челленджа: {id}</Text>
        </View>

        <ProgressBar progressPercent={25} />
        <Text style={styles.progressText}>Выполнено 25%</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
