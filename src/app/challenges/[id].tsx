import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ProgressBar } from '@/components/ProgressBar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Challenge details</Text>
          <Text style={styles.description}>Placeholder details for challenge: {id}</Text>
        </View>

        <ProgressBar progressPercent={25} />
        <Text style={styles.progressText}>25% complete</Text>

        <Link href={'/challenges' as Href} asChild>
          <AppButton title="Back to challenges" variant="secondary" />
        </Link>
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
