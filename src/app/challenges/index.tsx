import { Link, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ChallengeCard } from '@/components/ChallengeCard';
import { EmptyState } from '@/components/EmptyState';
import type { Challenge, ChallengeType } from '@/features/challenges/types';
import { useChallengeStore } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import {
  calculateDailyProgress,
  calculateNumericProgress,
  calculateProjectProgress,
  isProgressCompleted,
} from '@/utils/progress';

const typeLabels: Record<ChallengeType, string> = {
  numeric: 'Числовой',
  daily: 'Ежедневный',
  project: 'Проектный',
};

function getChallengeProgress(
  challenge: Challenge,
  state: Pick<
    ReturnType<typeof useChallengeStore.getState>,
    | 'numericDataByChallengeId'
    | 'numericEntriesByChallengeId'
    | 'dailyEntriesByChallengeId'
    | 'projectNodesByChallengeId'
  >,
) {
  if (challenge.type === 'numeric') {
    const data = state.numericDataByChallengeId[challenge.id];
    const entries = state.numericEntriesByChallengeId[challenge.id];
    return calculateNumericProgress(data?.targetValue ?? 0, entries ?? []).progressPercent;
  }

  if (challenge.type === 'daily') {
    const entries = state.dailyEntriesByChallengeId[challenge.id];
    return calculateDailyProgress(challenge.durationDays, entries ?? []).progressPercent;
  }

  const nodes = state.projectNodesByChallengeId[challenge.id];
  return calculateProjectProgress(nodes ?? []).progressPercent;
}

export default function ChallengesScreen() {
  const challenges = useChallengeStore((state) => state.challenges);
  const numericDataByChallengeId = useChallengeStore((state) => state.numericDataByChallengeId);
  const numericEntriesByChallengeId = useChallengeStore(
    (state) => state.numericEntriesByChallengeId,
  );
  const dailyEntriesByChallengeId = useChallengeStore((state) => state.dailyEntriesByChallengeId);
  const projectNodesByChallengeId = useChallengeStore((state) => state.projectNodesByChallengeId);
  const progressState = {
    numericDataByChallengeId,
    numericEntriesByChallengeId,
    dailyEntriesByChallengeId,
    projectNodesByChallengeId,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {challenges.length === 0 ? (
          <EmptyState
            title="Пока нет челленджей"
            description="Создай первый челлендж и начни движение к цели."
          />
        ) : (
          <View style={styles.list}>
            {challenges.map((challenge) => {
              const progressPercent = getChallengeProgress(challenge, progressState);

              return (
                <Link key={challenge.id} href={`/challenges/${challenge.id}` as Href} asChild>
                  <ChallengeCard
                    title={challenge.title}
                    typeLabel={typeLabels[challenge.type]}
                    status={isProgressCompleted(progressPercent) ? 'completed' : 'active'}
                    progressPercent={progressPercent}
                  />
                </Link>
              );
            })}
          </View>
        )}

        <Link href={'/challenges/create' as Href} asChild>
          <AppButton title="Создать челлендж" />
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
