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
  NumericProgressEntry,
  ProjectNode,
} from '@/features/challenges/types';
import { parsePositiveNumber, validateRequiredText } from '@/features/challenges/validation';
import { useChallengeStore } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import {
  calculateDailyStreak,
  formatMonthYearRu,
  getMonthCalendarDays,
  isDateInChallengeRange,
  isSameDate,
  toDateKey,
} from '@/utils/dates';
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
const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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
  const [editingStageTitles, setEditingStageTitles] = useState<Record<string, string>>({});
  const [editingStageErrors, setEditingStageErrors] = useState<Record<string, string>>({});
  const [pendingDeletedStageIds, setPendingDeletedStageIds] = useState<string[]>([]);
  const [expandedStepIds, setExpandedStepIds] = useState<string[]>([]);
  const [dailyCalendarMonth, setDailyCalendarMonth] = useState(() => new Date());

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
  const completedProjectSteps = projectStepCards.filter((step) =>
    isProgressCompleted(calculateProjectStageProgress(step, projectNodes)),
  ).length;

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

  const handleChangeDailyMonth = (offset: number) => {
    setDailyCalendarMonth(
      (currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  const handleToggleDailyDate = (dateKey: string, isCompleted: boolean) => {
    markDailyDay(challenge.id, dateKey, isCompleted ? 'empty' : 'completed');
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
    const stages = projectNodes
      .filter((node) => node.parentId === step.id)
      .sort((left, right) => left.orderIndex - right.orderIndex);

    setActionStepId('');
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
    setEditingStepError('');
    setEditingStageTitles(
      stages.reduce<Record<string, string>>((result, stage) => {
        result[stage.id] = stage.title;
        return result;
      }, {}),
    );
    setEditingStageErrors({});
    setPendingDeletedStageIds([]);
  };

  const closeEditStep = () => {
    setEditingStepId('');
    setEditingStepTitle('');
    setEditingStepError('');
    setEditingStageTitles({});
    setEditingStageErrors({});
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
        onPress: () => {
          setPendingDeletedStageIds((current) =>
            current.includes(stage.id) ? current : [...current, stage.id],
          );
          setEditingStageErrors((current) => {
            const { [stage.id]: _removed, ...nextErrors } = current;
            return nextErrors;
          });
        },
      },
    ]);
  };

  const saveEditedStep = () => {
    const error = validateRequiredText(editingStepTitle, 'Название шага не может быть пустым.');

    if (error) {
      setEditingStepError(error);
      return;
    }

    const nextStageErrors = editingStepStages.reduce<Record<string, string>>((result, stage) => {
      const stageTitle = editingStageTitles[stage.id] ?? stage.title;
      const stageError = validateRequiredText(stageTitle, 'Название этапа не может быть пустым.');

      if (stageError) {
        result[stage.id] = stageError;
      }

      return result;
    }, {});

    if (Object.keys(nextStageErrors).length > 0) {
      setEditingStageErrors(nextStageErrors);
      return;
    }

    updateProjectNodeTitle(challenge.id, editingStepId, editingStepTitle.trim());
    editingStepStages.forEach((stage) => {
      const nextTitle = (editingStageTitles[stage.id] ?? stage.title).trim();

      if (nextTitle !== stage.title) {
        updateProjectNodeTitle(challenge.id, stage.id, nextTitle);
      }
    });
    pendingDeletedStageIds.forEach((stageId) => deleteProjectNode(challenge.id, stageId));
    closeEditStep();
  };

  const toggleStepCollapsed = (stepId: string) => {
    setExpandedStepIds((current) =>
      current.includes(stepId)
        ? current.filter((currentStepId) => currentStepId !== stepId)
        : [...current, stepId],
    );
  };

  const renderNumericDetails = () => {
    if (!numericData) {
      return null;
    }

    const progress = calculateNumericProgress(numericData.targetValue, numericEntries);

    return (
      <View style={styles.section}>
        <ProgressBar progressPercent={progress.progressPercent} />
        <Text style={styles.bodyText}>Прогресс: {formatProgressPercent(progress.progressPercent)}</Text>
        <Text style={styles.bodyText}>
          Сделано: {progress.totalCompleted} / {numericData.targetValue} {numericData.unit}
        </Text>
        <Text style={styles.bodyText}>
          Осталось: {progress.remaining} {numericData.unit}
        </Text>

        {numericEntries.length === 0 ? (
          <Text style={styles.metaText}>Пока нет записей прогресса.</Text>
        ) : null}

        <AppInput
          label="Выполнено сегодня"
          placeholder="Например: 50"
          keyboardType="numeric"
          value={numericValue}
          error={numericError}
          onChangeText={setNumericValue}
        />
        <AppButton title="Добавить прогресс" onPress={handleAddNumericProgress} />
        <AppButton
          title="Посмотреть историю"
          variant="secondary"
          onPress={() => router.push(`/challenges/${challenge.id}/history` as Href)}
        />
      </View>
    );
  };

  const renderDailyDetails = () => {
    if (!dailyData) {
      return null;
    }

    const progress = calculateDailyProgress(challenge.durationDays, dailyEntries);
    const entriesByDate = Object.fromEntries(dailyEntries.map((entry) => [entry.date, entry]));
    const calendarDays = getMonthCalendarDays(
      dailyCalendarMonth.getFullYear(),
      dailyCalendarMonth.getMonth(),
    );
    const calendarWeeks = Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, index) =>
      calendarDays.slice(index * 7, index * 7 + 7),
    );
    const todayKey = toDateKey(new Date());
    const streak = calculateDailyStreak(
      challenge.startDate,
      challenge.durationDays,
      dailyEntries,
      todayKey,
    );

    return (
      <View style={styles.section}>
        <Text style={styles.bodyText}>Действие: {dailyData.dailyActionText}</Text>
        <ProgressBar progressPercent={progress.progressPercent} />
        <Text style={styles.bodyText}>
          Выполнено: {progress.completedDays} / {challenge.durationDays}
        </Text>
        <Text style={styles.bodyText}>Прогресс: {formatProgressPercent(progress.progressPercent)}</Text>
        <Text style={styles.bodyText}>Дней подряд: {streak}</Text>
        <AppButton title="Выполнено сегодня" onPress={handleMarkTodayCompleted} />

        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.calendarNavButton, pressed && styles.pressed]}
              onPress={() => handleChangeDailyMonth(-1)}>
              <Text style={styles.calendarNavText}>←</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>{formatMonthYearRu(dailyCalendarMonth)}</Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.calendarNavButton, pressed && styles.pressed]}
              onPress={() => handleChangeDailyMonth(1)}>
              <Text style={styles.calendarNavText}>→</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((weekday) => (
              <Text key={weekday} style={styles.weekdayText}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.calendarWeekRow}>
                {week.map((day, dayIndex) => {
                  if (!day.dateKey || !day.dayNumber) {
                    return (
                      <View
                        key={`empty-${weekIndex}-${dayIndex}`}
                        style={[styles.calendarCell, styles.emptyCalendarCell]}
                      />
                    );
                  }

                  const isChallengeDay = isDateInChallengeRange(
                    day.dateKey,
                    challenge.startDate,
                    challenge.durationDays,
                  );
                  const isCompleted = entriesByDate[day.dateKey]?.status === 'completed';
                  const isToday = isSameDate(day.dateKey, todayKey);

                  return (
                    <Pressable
                      key={day.dateKey}
                      accessibilityRole={isChallengeDay ? 'button' : undefined}
                      disabled={!isChallengeDay}
                      style={({ pressed }) => [
                        styles.calendarCell,
                        isChallengeDay && styles.challengeDayCell,
                        isToday && styles.todayCell,
                        isCompleted && styles.completedDayCell,
                        !isChallengeDay && styles.disabledDayCell,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleToggleDailyDate(day.dateKey as string, isCompleted)}>
                      <Text
                        style={[
                          styles.calendarDayText,
                          isChallengeDay && styles.challengeDayText,
                          !isChallengeDay && styles.disabledDayText,
                          isCompleted && styles.completedDayText,
                        ]}>
                        {day.dayNumber}
                      </Text>
                      {isCompleted ? (
                        <View pointerEvents="none" style={styles.completedMark}>
                          <View style={[styles.completedMarkLine, styles.completedMarkLineForward]} />
                          <View style={[styles.completedMarkLine, styles.completedMarkLineBackward]} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
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
          Готово шагов: {completedProjectSteps} / {projectStepCards.length}
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
                isCollapsed={!expandedStepIds.includes(stepCard.id)}
                onToggleCollapsed={() => toggleStepCollapsed(stepCard.id)}
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
        stageTitles={editingStageTitles}
        stageErrors={editingStageErrors}
        onChangeStageTitle={(stageId, value) => {
          setEditingStageTitles((current) => ({ ...current, [stageId]: value }));
          setEditingStageErrors((current) => ({ ...current, [stageId]: '' }));
        }}
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
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
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
  isCollapsed,
  onToggleCollapsed,
}: ProjectStepCardProps) {
  const stages = nodes
    .filter((node) => node.parentId === stepCard.id)
    .sort((left, right) => left.orderIndex - right.orderIndex);
  const stepProgress = calculateProjectStageProgress(stepCard, nodes);

  return (
    <View style={styles.stepCard}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.stepCardHeader, pressed && styles.pressed]}
        onPress={onToggleCollapsed}>
        <View style={styles.stepCardTopRow}>
          <View style={styles.stepCardLabelRow}>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevronText}>{isCollapsed ? '⌄' : '⌃'}</Text>
            </View>
            <Text style={styles.stepCardEyebrow}>Шаг {index + 1}</Text>
          </View>
          <View style={styles.stepCardControls}>
            <StatusBadge status={isProgressCompleted(stepProgress) ? 'completed' : 'active'} />
            <ActionMenuButton
              onPress={(event) => {
                event.stopPropagation();
                onOpenActions();
              }}
            />
          </View>
        </View>
        <Text style={styles.stepCardTitle}>
          {stepCard.title} — {formatProgressPercent(stepProgress)}
        </Text>
      </Pressable>

      {!isCollapsed ? (
        <View style={styles.stepCardBody}>
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
      ) : null}
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
      <Text style={styles.stageIndicator}>{stage.isCompleted ? '✓' : '○'}</Text>
      <Text style={styles.stageText}>{stage.title}</Text>
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
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}>
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
  stageTitles: Record<string, string>;
  stageErrors: Record<string, string>;
  onChangeStepTitle: (value: string) => void;
  onChangeStageTitle: (stageId: string, value: string) => void;
  onDeleteStage: (stage: ProjectNode) => void;
  onSave: () => void;
  onCancel: () => void;
};

function StepEditModal({
  visible,
  stepTitle,
  stepError,
  stages,
  stageTitles,
  stageErrors,
  onChangeStepTitle,
  onChangeStageTitle,
  onDeleteStage,
  onSave,
  onCancel,
}: StepEditModalProps) {
  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Изменить шаг</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled">
            <AppInput
              label="Название шага"
              placeholder="Название шага"
              value={stepTitle}
              error={stepError}
              multiline
              onChangeText={onChangeStepTitle}
            />

            <View style={styles.editStageList}>
              {stages.length === 0 ? (
                <Text style={styles.metaText}>Внутри шага пока нет этапов.</Text>
              ) : (
                stages.map((stage) => (
                  <View key={stage.id} style={styles.editStageRow}>
                    <View style={styles.editStageInput}>
                      <AppInput
                        label="Этап"
                        placeholder="Название этапа"
                        value={stageTitles[stage.id] ?? stage.title}
                        error={stageErrors[stage.id]}
                        multiline
                        onChangeText={(value) => onChangeStageTitle(stage.id, value)}
                      />
                    </View>
                    <Pressable accessibilityRole="button" onPress={() => onDeleteStage(stage)}>
                      <Text style={styles.deleteText}>Удалить</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

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
  calendar: {
    gap: spacing.md,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calendarTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  calendarNavText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekdayText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarGrid: {
    gap: spacing.xs,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  emptyCalendarCell: {
    backgroundColor: 'transparent',
  },
  challengeDayCell: {
    backgroundColor: '#E4E9F2',
  },
  todayCell: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  completedDayCell: {
    backgroundColor: '#DBEAFE',
  },
  disabledDayCell: {
    opacity: 0.42,
  },
  calendarDayText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  challengeDayText: {
    color: colors.text,
  },
  disabledDayText: {
    color: colors.textMuted,
  },
  completedDayText: {
    color: colors.text,
  },
  completedMark: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedMarkLine: {
    position: 'absolute',
    width: '88%',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    opacity: 0.82,
  },
  completedMarkLineForward: {
    transform: [{ rotate: '45deg' }],
  },
  completedMarkLineBackward: {
    transform: [{ rotate: '-45deg' }],
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
    gap: spacing.sm,
  },
  stepCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepCardLabelRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepCardControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  chevronText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '800',
  },
  stepCardBody: {
    gap: spacing.md,
  },
  stepCardEyebrow: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  stepCardTitle: {
    width: '100%',
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  stageList: {
    gap: spacing.xs,
  },
  stageToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  stageIndicator: {
    width: 22,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  stageText: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 19, 24, 0.45)',
    padding: spacing.lg,
  },
  modalCard: {
    gap: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
    maxHeight: '88%',
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
  modalScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  editStageList: {
    gap: spacing.sm,
  },
  editStageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
  },
  editStageInput: {
    flex: 1,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 32,
  },
  inlineActions: {
    gap: spacing.sm,
  },
});
