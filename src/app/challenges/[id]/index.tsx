import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionMenuButton } from '@/components/ActionMenuButton';
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
  const updateProjectNodeTitle = useChallengeStore((state) => state.updateProjectNodeTitle);
  const deleteProjectNode = useChallengeStore((state) => state.deleteProjectNode);
  const toggleProjectStep = useChallengeStore((state) => state.toggleProjectStep);

  const numericEntries = numericEntriesFromStore ?? EMPTY_NUMERIC_ENTRIES;
  const dailyEntries = dailyEntriesFromStore ?? EMPTY_DAILY_ENTRIES;
  const projectNodes = projectNodesFromStore ?? EMPTY_PROJECT_NODES;

  const [numericValue, setNumericValue] = useState('');
  const [numericError, setNumericError] = useState('');
  const [stepTitle, setStepTitle] = useState('');
  const [stepError, setStepError] = useState('');
  const [stageTitles, setStageTitles] = useState<Record<string, string>>({});
  const [stageErrors, setStageErrors] = useState<Record<string, string>>({});
  const [actionStepId, setActionStepId] = useState('');
  const [editingStepId, setEditingStepId] = useState('');
  const [editingStepTitle, setEditingStepTitle] = useState('');
  const [editingStepError, setEditingStepError] = useState('');
  const [pendingDeletedStageIds, setPendingDeletedStageIds] = useState<string[]>([]);

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
  const projectStepCards = projectNodes
    .filter((node) => node.nodeType === 'stage')
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const actionStepIndex = projectStepCards.findIndex((step) => step.id === actionStepId);
  const actionStep = actionStepIndex >= 0 ? projectStepCards[actionStepIndex] : undefined;
  const editingStep = projectStepCards.find((step) => step.id === editingStepId);
  const editingStepStages = editingStep
    ? projectNodes
        .filter((node) => node.parentId === editingStep.id)
        .filter((node) => !pendingDeletedStageIds.includes(node.id))
        .sort((left, right) => left.orderIndex - right.orderIndex)
    : EMPTY_PROJECT_NODES;

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

  const handleAddStepCard = () => {
    const error = validateRequiredText(stepTitle, 'Введи название шага.');

    if (error) {
      setStepError(error);
      return;
    }

    addProjectStage(challenge.id, stepTitle.trim());
    setStepTitle('');
    setStepError('');
  };

  const handleAddStageInsideStep = (stepId: string) => {
    const title = stageTitles[stepId] ?? '';
    const error = validateRequiredText(title, 'Введи название этапа.');

    if (error) {
      setStageErrors((current) => ({ ...current, [stepId]: error }));
      return;
    }

    addProjectStep(challenge.id, stepId, title.trim());
    setStageTitles((current) => ({ ...current, [stepId]: '' }));
    setStageErrors((current) => ({ ...current, [stepId]: '' }));
  };

  const openEditStep = (step: ProjectNode) => {
    setActionStepId('');
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
    setEditingStepError('');
    setPendingDeletedStageIds([]);
  };

  const closeEditStep = () => {
    setEditingStepId('');
    setEditingStepTitle('');
    setEditingStepError('');
    setPendingDeletedStageIds([]);
  };

  const confirmDeleteStep = (step: ProjectNode) => {
    setActionStepId('');
    Alert.alert('Удалить шаг?', 'Все вложенные этапы будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteProjectNode(challenge.id, step.id),
      },
    ]);
  };

  const confirmDeleteStageFromEditor = (stage: ProjectNode) => {
    Alert.alert('Удалить этап?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () =>
          setPendingDeletedStageIds((current) =>
            current.includes(stage.id) ? current : [...current, stage.id],
          ),
      },
    ]);
  };

  const saveEditedStep = () => {
    const error = validateRequiredText(editingStepTitle, 'Название шага не может быть пустым.');

    if (error) {
      setEditingStepError(error);
      return;
    }

    updateProjectNodeTitle(challenge.id, editingStepId, editingStepTitle.trim());
    pendingDeletedStageIds.forEach((stageId) => deleteProjectNode(challenge.id, stageId));
    closeEditStep();
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

    return (
      <View style={styles.section}>
        <ProgressBar progressPercent={progress.progressPercent} />
        <Text style={styles.bodyText}>
          Готово этапов: {progress.completedLeafItems} / {progress.totalLeafItems}
        </Text>
        <Text style={styles.bodyText}>Прогресс: {formatProgressPercent(progress.progressPercent)}</Text>

        {projectStepCards.length === 0 ? (
          <EmptyState
            title="Пока нет шагов"
            description="Добавь первый шаг, чтобы разбить проект на понятные части."
          />
        ) : (
          <View style={styles.projectList}>
            {projectStepCards.map((stepCard, index) => (
              <ProjectStepCard
                key={stepCard.id}
                index={index}
                stepCard={stepCard}
                nodes={projectNodes}
                stageTitle={stageTitles[stepCard.id] ?? ''}
                stageError={stageErrors[stepCard.id]}
                onStageTitleChange={(value) =>
                  setStageTitles((current) => ({ ...current, [stepCard.id]: value }))
                }
                onAddStage={() => handleAddStageInsideStep(stepCard.id)}
                onToggleStage={(stageId) => toggleProjectStep(challenge.id, stageId)}
                onOpenActions={() => setActionStepId(stepCard.id)}
              />
            ))}
          </View>
        )}

        <AppInput
          label="Новый шаг"
          placeholder="Название шага"
          value={stepTitle}
          error={stepError}
          onChangeText={setStepTitle}
        />
        <AppButton title="Добавить шаг" onPress={handleAddStepCard} />
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

        {challenge.type === 'numeric' ? renderNumericDetails() : null}
        {challenge.type === 'daily' ? renderDailyDetails() : null}
        {challenge.type === 'project' ? renderProjectDetails() : null}
      </ScrollView>

      <StepActionModal
        visible={Boolean(actionStep)}
        title={actionStepIndex >= 0 ? `Шаг ${actionStepIndex + 1}` : ''}
        onClose={() => setActionStepId('')}
        onEdit={() => actionStep && openEditStep(actionStep)}
        onDelete={() => actionStep && confirmDeleteStep(actionStep)}
      />

      <StepEditModal
        visible={Boolean(editingStep)}
        stepTitle={editingStepTitle}
        stepError={editingStepError}
        stages={editingStepStages}
        onChangeStepTitle={setEditingStepTitle}
        onDeleteStage={confirmDeleteStageFromEditor}
        onSave={saveEditedStep}
        onCancel={closeEditStep}
      />
    </SafeAreaView>
  );
}

type ProjectStepCardProps = {
  index: number;
  stepCard: ProjectNode;
  nodes: ProjectNode[];
  stageTitle: string;
  stageError?: string;
  onStageTitleChange: (value: string) => void;
  onAddStage: () => void;
  onToggleStage: (stageId: string) => void;
  onOpenActions: () => void;
};

function ProjectStepCard({
  index,
  stepCard,
  nodes,
  stageTitle,
  stageError,
  onStageTitleChange,
  onAddStage,
  onToggleStage,
  onOpenActions,
}: ProjectStepCardProps) {
  const stages = nodes
    .filter((node) => node.parentId === stepCard.id)
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const stepProgress = calculateProjectStageProgress(stepCard, nodes);

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepCardHeader}>
        <View style={styles.stepCardTitleBlock}>
          <Text style={styles.stepCardEyebrow}>Шаг {index + 1}</Text>
          <Text style={styles.stepCardTitle}>
            {stepCard.title} — {formatProgressPercent(stepProgress)}
          </Text>
        </View>
        <StatusBadge status={isProgressCompleted(stepProgress) ? 'completed' : 'active'} />
        <ActionMenuButton onPress={onOpenActions} />
      </View>

      {stages.length === 0 ? (
        <Text style={styles.metaText}>Пока нет этапов внутри шага.</Text>
      ) : (
        <View style={styles.stageList}>
          {stages.map((stage) => (
            <ProjectStageRow
              key={stage.id}
              stage={stage}
              onToggle={() => onToggleStage(stage.id)}
            />
          ))}
        </View>
      )}

      <AppInput
        label="Новый этап"
        placeholder="Название этапа"
        value={stageTitle}
        error={stageError}
        onChangeText={onStageTitleChange}
      />
      <AppButton title="Добавить этап" variant="secondary" onPress={onAddStage} />
    </View>
  );
}

type ProjectStageRowProps = {
  stage: ProjectNode;
  onToggle: () => void;
};

function ProjectStageRow({ stage, onToggle }: ProjectStageRowProps) {
  return (
    <Pressable style={({ pressed }) => [styles.stageToggle, pressed && styles.pressed]} onPress={onToggle}>
      <Text style={styles.stageText}>
        {stage.isCompleted ? '✓' : '○'} {stage.title}
      </Text>
    </Pressable>
  );
}

type StepActionModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function StepActionModal({ visible, title, onClose, onEdit, onDelete }: StepActionModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.modalActions}>
            <AppButton title="Изменить" onPress={onEdit} />
            <AppButton title="Удалить" variant="secondary" onPress={onDelete} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type StepEditModalProps = {
  visible: boolean;
  stepTitle: string;
  stepError: string;
  stages: ProjectNode[];
  onChangeStepTitle: (value: string) => void;
  onDeleteStage: (stage: ProjectNode) => void;
  onSave: () => void;
  onCancel: () => void;
};

function StepEditModal({
  visible,
  stepTitle,
  stepError,
  stages,
  onChangeStepTitle,
  onDeleteStage,
  onSave,
  onCancel,
}: StepEditModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Изменить шаг</Text>
            <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <AppInput
            label="Название шага"
            placeholder="Название шага"
            value={stepTitle}
            error={stepError}
            onChangeText={onChangeStepTitle}
          />

          <View style={styles.editStageList}>
            {stages.length === 0 ? (
              <Text style={styles.metaText}>Внутри шага пока нет этапов.</Text>
            ) : (
              stages.map((stage) => (
                <View key={stage.id} style={styles.editStageRow}>
                  <Text style={styles.editStageText}>{stage.title}</Text>
                  <Pressable accessibilityRole="button" onPress={() => onDeleteStage(stage)}>
                    <Text style={styles.deleteText}>Удалить</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.inlineActions}>
            <AppButton title="Сохранить" onPress={onSave} />
            <AppButton title="Отмена" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
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
  stepCard: {
    gap: spacing.md,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepCardTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  stepCardEyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  stepCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  stageList: {
    gap: spacing.xs,
  },
  stageToggle: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  stageText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 19, 24, 0.35)',
    padding: spacing.lg,
  },
  modalCard: {
    gap: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  closeText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editStageList: {
    gap: spacing.sm,
  },
  editStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
  },
  editStageText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  inlineActions: {
    gap: spacing.sm,
  },
});
