import { Link, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ChallengeCard } from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const placeholderChallenges = [
  {
    id: 'demo-numeric',
    title: 'Read 500 pages',
    typeLabel: 'Numeric',
    statusLabel: 'Active',
    progressPercent: 25,
  },
];

export default function ChallengesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {placeholderChallenges.length === 0 ? (
          <EmptyState
            title="No challenges yet"
            description="Create your first challenge and start moving toward a goal."
          />
        ) : (
          <View style={styles.list}>
            {placeholderChallenges.map((challenge) => (
              <Link key={challenge.id} href={`/challenges/${challenge.id}` as Href} asChild>
                <ChallengeCard {...challenge} />
              </Link>
            ))}
          </View>
        )}

        <Link href={'/challenges/create' as Href} asChild>
          <AppButton title="Create challenge" />
        </Link>
      </ScrollView>
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
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
});
