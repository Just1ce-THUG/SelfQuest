import type {
  DailyProgressEntry,
  NumericProgressEntry,
  ProjectNode,
} from '@/features/challenges/types';

export type NumericProgressResult = {
  totalCompleted: number;
  remaining: number;
  progressPercent: number;
};

export type NumericProgressHistoryItem<TEntry> = {
  entry: TEntry;
  progressPercent: number;
  totalCompleted: number;
};

export type DailyProgressResult = {
  completedDays: number;
  progressPercent: number;
};

export type ProjectProgressResult = {
  completedLeafItems: number;
  totalLeafItems: number;
  progressPercent: number;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(value, 100));
}

export function formatProgressPercent(value: number) {
  return `${clampProgress(value).toFixed(1)}%`;
}

export function isProgressCompleted(value: number) {
  return clampProgress(value) >= 100;
}

export function calculateNumericProgress(
  targetValue: number,
  entries: Pick<NumericProgressEntry, 'value'>[],
): NumericProgressResult {
  const totalCompleted = entries.reduce((sum, entry) => sum + entry.value, 0);
  const remaining = Math.max(targetValue - totalCompleted, 0);
  const progressPercent = targetValue > 0 ? clampProgress((totalCompleted / targetValue) * 100) : 0;

  return {
    totalCompleted,
    remaining,
    progressPercent,
  };
}

export function calculateNumericProgressHistory<
  TEntry extends Pick<NumericProgressEntry, 'value' | 'date' | 'createdAt'>,
>(targetValue: number, entries: TEntry[]): NumericProgressHistoryItem<TEntry>[] {
  const sortedEntries = [...entries].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
  let totalCompleted = 0;

  return sortedEntries.map((entry) => {
    totalCompleted += entry.value;

    return {
      entry,
      totalCompleted,
      progressPercent: calculateNumericProgress(targetValue, [{ value: totalCompleted }])
        .progressPercent,
    };
  });
}

export function calculateDailyProgress(
  durationDays: number,
  entries: Pick<DailyProgressEntry, 'status'>[],
): DailyProgressResult {
  const completedDays = entries.filter((entry) => entry.status === 'completed').length;
  const progressPercent = durationDays > 0 ? clampProgress((completedDays / durationDays) * 100) : 0;

  return {
    completedDays,
    progressPercent,
  };
}

export function calculateProjectProgress(
  nodes: Pick<ProjectNode, 'id' | 'parentId' | 'isCompleted'>[],
): ProjectProgressResult {
  const parentIds = new Set(
    nodes
      .map((node) => node.parentId)
      .filter((parentId): parentId is string => typeof parentId === 'string' && parentId.length > 0),
  );
  const leafItems = nodes.filter((node) => !parentIds.has(node.id));
  const totalLeafItems = leafItems.length;
  const completedLeafItems = leafItems.filter((node) => node.isCompleted).length;
  const progressPercent =
    totalLeafItems > 0 ? clampProgress((completedLeafItems / totalLeafItems) * 100) : 0;

  return {
    completedLeafItems,
    totalLeafItems,
    progressPercent,
  };
}

export function calculateProjectStepProgress(isCompleted: boolean) {
  return isCompleted ? 100 : 0;
}

export function calculateProjectStageProgress(
  stage: Pick<ProjectNode, 'id' | 'isCompleted'>,
  nodes: Pick<ProjectNode, 'parentId' | 'isCompleted'>[],
) {
  const steps = nodes.filter((node) => node.parentId === stage.id);

  if (steps.length === 0) {
    return calculateProjectStepProgress(stage.isCompleted);
  }

  const completedSteps = steps.filter((step) => step.isCompleted).length;
  return clampProgress((completedSteps / steps.length) * 100);
}
