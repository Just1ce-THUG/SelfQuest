import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import type {
  DailyProgressEntry,
  DailyProgressStatus,
  NumericProgressEntry,
  ProjectNode,
} from '@/features/challenges/types';
import { parsePositiveNumber, validateRequiredText } from '@/features/challenges/validation';
import { useChallengeStore } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { toDateKey } from '@/utils/dates';
import {
  calculateDailyProgress,
  calculateNumericProgress,
  calculateProjectProgress,
  calculateProjectStageProgress,
  formatProgressPercent,
  isProgressCompleted,
} from '@/utils/progress';

const EMPTY_NUMERIC_ENTRIES: NumericProgressEntry[] = [];
const EMPTY_DAILY_ENTRIES: DailyProgressEntry[] = [];
const EMPTY_PROJECT_NODES: ProjectNode[] = [];

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

function getDailyStatusLabel(status: DailyProgressStatus) {
  if (status === 'completed') {
    return 'Готово';
  }
  if (status === 'missed') {
    return 'Пропуск';
  }
  return 'Пусто';
}

function getNextDailyStatus(status: DailyProgressStatus): DailyProgressStatus {
  if (status === 'empty') {
    return 'completed';
  }
  if (status === 'completed') {
    return 'missed';
  }
  return 'empty';
}

export default function ChallengeDetailsScreen() {
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
  const dailyData = useChallengeStore((state) =>
    typeof id === 'string' ? state.dailyDataByChallengeId[id] : undefined,
  );
  const dailyEntriesFromStore = useChallengeStore((state) =>
    typeof id === 'string' ? state.dailyEntriesByChallengeId[id] : undefined,
  );
  const projectNodesFromStore = useChallengeStore((state) =>
    typeof id === 'string' ? state.projectNodesByChallengeId[id] : undefined,
  );
  const addNumericProgress = useChallengeStore((state) => state.addNumericProgress);
  const markDailyDay = useChallengeStore((state) => state.markDailyDay);
  const addProjectStage = useChallengeStore((state) => state.addProjectStage);
  const addProjectStep = useChallengeStore((state) => state.addProjectStep);
  const toggleProjectStep = useChallengeStore((state) => state.toggleProjectStep);
  const deleteChallenge = useChallengeStore((state) => state.deleteChallenge);

  const numericEntries = numericEntriesFromStore ?? EMPTY_NUMERIC_ENTRIES;
  const dailyEntries = dailyEntriesFromStore ?? EMPTY_DAILY_ENTRIES;
  const projectNodes = projectNodesFromStore ?? EMPTY_PROJECT_NODES;

  const [numericValue, setNumericValue] = useState('');
  const [numericError, setNumericError] = useState('');
  const [stageTitle, setStageTitle] = useState('');
  const [stageError, setStageError] = useState('');
  const [stepTitles, setStepTitles] = useState<Record<string, string>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  if (!challenge || typeof id !== 'string') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <EmptyState
            title="Челлендж не найден"
            description="Возможно, он был удален или ссылка устарела."
          />
        </View>
      </SafeAreaView>
    );
  }

  const numericProgress =
    challenge.type === 'numeric' && numericData
      ? calculateNumericProgress(numericData.targetValue, numericEntries).progressPercent
      : 0;
  const dailyProgress =
    challenge.type === 'daily'
      ? calculateDailyProgress(challenge.durationDays, dailyEntries).progressPercent
      : 0;
  const projectProgress =
    challenge.type === 'project' ? calculateProjectProgress(projectNodes).progressPercent : 0;
  const currentProgress =
    challenge.type === 'numeric'
      ? numericProgress
      : challenge.type === 'daily'
        ? dailyProgress
        : projectProgress;

  const handleEdit = () => {
    router.replace(`/challenges/${challenge.id}/edit` as Href);
  };

  const handleDelete = () => {
    Alert.alert('Удалить челлендж?', 'Все данные прогресса будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          deleteChallenge(challenge.id);
          router.replace('/challenges' as Href);
        },
      },
    ]);
  };

  const handleAddNumericProgress = () => {
    const value = parsePositiveNumber(numericValue);

    if (value === null) {
      setNumericError('Значение прогресса должно быть положительным числом.');
      return;
    }

    addNumericProgress(challenge.id, value);
    setNumericValue('');
    setNumericError('');
  };

  const handleMarkTodayCompleted = () => {
    markDailyDay(challenge.id, toDateKey(new Date()), 'completed');
  };

  const handleAddStage = () => {
    const error = validateRequiredText(stageTitle, 'Введи название этапа.');

    if (error) {
      setStageError(error);
      return;
    }

    addProjectStage(challenge.id, stageTitle.trim());
    setStageTitle('');
    setStageError('');
  };

  const handleAddStep = (stageId: string) => {
    const title = stepTitles[stageId] ?? '';
    const error = validateRequiredText(title, 'Введи название шага.');

    if (error) {
      setStepErrors((current) => ({ ...current, [stageId]: error }));
      return;
    }

    addProjectStep(challenge.id, stageId, title.trim());
    setStepTitles((current) => ({ ...current, [stageId]: '' }));
    setStepErrors((current) => ({ ...current, [stageId]: '' }));
  };

  const renderNumericDetails = () => {
    if (!numericData) {
      return null;
    }

    const progress = calculateNumericProgress(numericData.targetValue, numericEntries);

    return (
      <View style={styles.section}>
        <ProgressBar progressPercent={progress.progressPercent} />
        <Text style={styles.bodyText}>
          Сделано: {progress.totalCompleted} / {numericData.targetValue} {numericData.unit}
        </Text>
        <Text style={styles.bodyText}>
          Осталось: {progress.remaining} {numericData.unit}
        </Text>
        <Text style={styles.bodyText}>Прогресс: {formatProgressPercent(progress.progressPercent)}</Text>

        {numericEntries.length === 0 ? (
          <Text style={styles.metaText}>Пока нет записей прогресса.</Text>
        ) : null}

        <AppInput
          label="Сколько сделал сегодня"
          placeholder="Например: 50"
          keyboardType="numeric"
          value={numericValue}
          error={numericError}
          onChangeText={setNumericValue}
        />
        <AppButton title="Добавить прогресс" onPress={handleAddNumericProgress} />
      </View>
    );
  };

  const renderDailyDetails = () => {
    if (!dailyData) {
      return null;
    }

    const progress = calculateDailyProgress(challenge.durationDays, dailyEntries);
    const entriesByDate = Object.fromEntries(dailyEntries.map((entry) => [entry.date, entry]));
    const days = Array.from({ length: challenge.durationDays }, (_, index) =>
      addDays(challenge.startDate, index),
    );

    return (
      <View style={styles.section}>
        <Text style={styles.bodyText}>Действие: {dailyData.dailyActionText}</Text>
        <ProgressBar progressPercent={progress.progressPercent} />
        <Text style={styles.bodyText}>
          Выполнено дней: {progress.completedDays} / {challenge.durationDays}
        </Text>
        <Text style={styles.bodyText}>Прогресс: {formatProgressPercent(progress.progressPercent)}</Text>
        <AppButton title="Выполнено сегодня" onPress={handleMarkTodayCompleted} />

        <View style={styles.dayGrid}>
          {days.map((date, index) => {
            const status = entriesByDate[date]?.status ?? 'empty';

            return (
              <AppButton
                key={date}
                title={`${index + 1}. ${getDailyStatusLabel(status)}`}
                variant={status === 'completed' ? 'primary' : 'secondary'}
                onPress={() => markDailyDay(challenge.id, date, getNextDailyStatus(status))}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderProjectDetails = () => {
    const progress = calculateProjectProgress(projectNodes);
    const stages = projectNodes
      .filter((node) => node.nodeType === 'stage')
      .sort((left, right) => left.orderIndex - right.orderIndex);

    return (
      <View style={styles.section}>
        <ProgressBar progressPercent={progress.progressPercent} />
        <Text style={styles.bodyText}>
          Готово шагов: {progress.completedLeafItems} / {progress.totalLeafItems}
        </Text>
        <Text style={styles.bodyText}>Прогресс: {formatProgressPercent(progress.progressPercent)}</Text>

        {stages.length === 0 ? (
          <EmptyState
            title="Пока нет этапов"
            description="Добавь первый этап, чтобы разбить проект на понятные части."
          />
        ) : (
          <View style={styles.projectList}>
            {stages.map((stage) => (
              <ProjectStage
                key={stage.id}
                stage={stage}
                nodes={projectNodes}
                stepTitle={stepTitles[stage.id] ?? ''}
                stepError={stepErrors[stage.id]}
                onStepTitleChange={(value) =>
                  setStepTitles((current) => ({ ...current, [stage.id]: value }))
                }
                onAddStep={() => handleAddStep(stage.id)}
                onToggleStep={(stepId) => toggleProjectStep(challenge.id, stepId)}
              />
            ))}
          </View>
        )}

        <AppInput
          label="Новый этап"
          placeholder="Название этапа"
          value={stageTitle}
          error={stageError}
          onChangeText={setStageTitle}
        />
        <AppButton title="Добавить этап" onPress={handleAddStage} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{challenge.title}</Text>
            <StatusBadge status={isProgressCompleted(currentProgress) ? 'completed' : 'active'} />
          </View>
          {challenge.description ? (
            <Text style={styles.description}>{challenge.description}</Text>
          ) : null}
          <Text style={styles.metaText}>
            Срок: {challenge.durationDays} дн. • до {challenge.endDate}
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton title="Редактировать" variant="secondary" onPress={handleEdit} />
          <AppButton title="Удалить" variant="secondary" onPress={handleDelete} />
        </View>

        {challenge.type === 'numeric' ? renderNumericDetails() : null}
        {challenge.type === 'daily' ? renderDailyDetails() : null}
        {challenge.type === 'project' ? renderProjectDetails() : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type ProjectStageProps = {
  stage: ProjectNode;
  nodes: ProjectNode[];
  stepTitle: string;
  stepError?: string;
  onStepTitleChange: (value: string) => void;
  onAddStep: () => void;
  onToggleStep: (stepId: string) => void;
};

function ProjectStage({
  stage,
  nodes,
  stepTitle,
  stepError,
  onStepTitleChange,
  onAddStep,
  onToggleStep,
}: ProjectStageProps) {
  const steps = nodes
    .filter((node) => node.parentId === stage.id)
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const stageProgress = calculateProjectStageProgress(stage, nodes);

  return (
    <View style={styles.stage}>
      <View style={styles.stageHeader}>
        <Text style={styles.stageTitle}>
          {stage.title} — {formatProgressPercent(stageProgress)}
        </Text>
        <StatusBadge status={isProgressCompleted(stageProgress) ? 'completed' : 'active'} />
      </View>

      {steps.length === 0 ? (
        <Text style={styles.metaText}>Пока нет шагов.</Text>
      ) : (
        steps.map((step) => (
          <Pressable
            key={step.id}
            style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
            onPress={() => onToggleStep(step.id)}>
            <Text style={styles.stepText}>
              {step.isCompleted ? '✓' : '○'} {step.title}
            </Text>
          </Pressable>
        ))
      )}

      <AppInput
        label="Новый шаг"
        placeholder="Название шага"
        value={stepTitle}
        error={stepError}
        onChangeText={onStepTitleChange}
      />
      <AppButton title="Добавить шаг" variant="secondary" onPress={onAddStep} />
    </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  actions: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  bodyText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  dayGrid: {
    gap: spacing.sm,
  },
  projectList: {
    gap: spacing.md,
  },
  stage: {
    gap: spacing.sm,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stageTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  stepRow: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  stepText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
