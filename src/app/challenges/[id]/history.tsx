import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import type { NumericProgressEntry } from '@/features/challenges/types';
import { useChallengeStore } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatHistoryDateRu } from '@/utils/dates';
import { calculateNumericProgressHistory, formatProgressPercent } from '@/utils/progress';

const EMPTY_NUMERIC_ENTRIES: NumericProgressEntry[] = [];

export default function ChallengeHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = useChallengeStore((state) =>
    typeof id === 'string' ? state.challenges.find((item) => item.id === id) : undefined,
  );
  const numericData = useChallengeStore((state) =>
    typeof id === 'string' ? state.numericDataByChallengeId[id] : undefined,
  );
  const numericEntriesFromStore = useChallengeStore((state) =>
    typeof id === 'string' ? state.numericEntriesByChallengeId[id] : undefined,
  );
  const numericEntries = numericEntriesFromStore ?? EMPTY_NUMERIC_ENTRIES;

  if (!challenge || challenge.type !== 'numeric' || !numericData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <EmptyState
            title="История недоступна"
            description="Числовой челлендж не найден или был удалён."
          />
        </View>
      </SafeAreaView>
    );
  }

  const historyItems = calculateNumericProgressHistory(
    numericData.targetValue,
    numericEntries,
  ).reverse();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>История выполнений</Text>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
        </View>

        {historyItems.length === 0 ? (
          <EmptyState
            title="История пока пустая"
            description="Добавь первый прогресс в челлендже."
          />
        ) : (
          <View style={styles.historyList}>
            {historyItems.map((item) => (
              <View key={item.entry.id} style={styles.historyCard}>
                <Text style={styles.historyValue}>
                  {item.entry.value} {numericData.unit}
                </Text>
                <Text style={styles.historyDate}>{formatHistoryDateRu(item.entry.date)}</Text>
                <Text style={styles.historyMeta}>
                  Прогресс на момент выполнения: {formatProgressPercent(item.progressPercent)}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  challengeTitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    gap: spacing.xs,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  historyValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  historyDate: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  historyMeta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
