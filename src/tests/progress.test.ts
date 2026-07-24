/// <reference types="jest" />

import {
  calculateDailyProgress,
  calculateNumericAveragePace,
  calculateNumericProgress,
  calculateNumericProgressHistory,
  calculateNumericRequiredPerDay,
  calculateNumericStats,
  calculateProjectProgress,
  calculateProjectStageProgress,
  calculateProjectStepProgress,
  formatProgressPercent,
  isProgressCompleted,
} from '@/utils/progress';

describe('progress utils', () => {
  it('calculates numeric progress correctly', () => {
    const result = calculateNumericProgress(100, [{ value: 20 }, { value: 30 }]);

    expect(result.totalCompleted).toBe(50);
    expect(result.remaining).toBe(50);
    expect(result.progressPercent).toBe(50);
  });

  it('calculates numeric history progress cumulatively', () => {
    const history = calculateNumericProgressHistory(1000, [
      { value: 100, date: '2026-07-20', createdAt: '2026-07-20T10:00:00.000Z' },
      { value: 150, date: '2026-07-21', createdAt: '2026-07-21T10:00:00.000Z' },
      { value: 250, date: '2026-07-22', createdAt: '2026-07-22T10:00:00.000Z' },
    ]);

    expect(history.map((item) => item.progressPercent)).toEqual([10, 25, 50]);
    expect(history.map((item) => item.totalCompleted)).toEqual([100, 250, 500]);
  });

  it('does not let numeric history progress exceed 100%', () => {
    const history = calculateNumericProgressHistory(100, [
      { value: 70, date: '2026-07-20', createdAt: '2026-07-20T10:00:00.000Z' },
      { value: 50, date: '2026-07-21', createdAt: '2026-07-21T10:00:00.000Z' },
    ]);

    expect(history[1].progressPercent).toBe(100);
    expect(formatProgressPercent(history[1].progressPercent)).toBe('100.0%');
  });

  it('recalculates numeric history progress after an entry changes', () => {
    const history = calculateNumericProgressHistory(1000, [
      { value: 100, date: '2026-07-20', createdAt: '2026-07-20T10:00:00.000Z' },
      { value: 100, date: '2026-07-21', createdAt: '2026-07-21T10:00:00.000Z' },
      { value: 300, date: '2026-07-22', createdAt: '2026-07-22T10:00:00.000Z' },
    ]);

    expect(history.map((item) => item.progressPercent)).toEqual([10, 20, 50]);
  });

  it('recalculates numeric history progress after an entry is deleted', () => {
    const history = calculateNumericProgressHistory(1000, [
      { value: 100, date: '2026-07-21', createdAt: '2026-07-21T10:00:00.000Z' },
      { value: 300, date: '2026-07-22', createdAt: '2026-07-22T10:00:00.000Z' },
    ]);

    expect(history.map((item) => item.progressPercent)).toEqual([10, 40]);
  });

  it('calculates numeric average pace', () => {
    expect(calculateNumericAveragePace(450, '2026-07-01', 30, '2026-07-10')).toBe(45);
  });

  it('calculates numeric required progress per day', () => {
    expect(calculateNumericRequiredPerDay(150, '2026-07-01', 30, '2026-07-21')).toBe(15);
    expect(calculateNumericRequiredPerDay(0, '2026-07-01', 30, '2026-07-21')).toBe(0);
  });

  it('calculates numeric stats together', () => {
    const stats = calculateNumericStats(
      1000,
      [{ value: 100 }, { value: 350 }],
      '2026-07-01',
      30,
      '2026-07-10',
    );

    expect(stats.averagePace).toBe(45);
    expect(stats.requiredPerDay).toBe(26.19047619047619);
  });

  it('does not let numeric progress exceed 100%', () => {
    const result = calculateNumericProgress(100, [{ value: 120 }]);

    expect(result.progressPercent).toBe(100);
  });

  it('does not let remaining go below 0', () => {
    const result = calculateNumericProgress(100, [{ value: 120 }]);

    expect(result.remaining).toBe(0);
  });

  it('calculates daily progress by completed days', () => {
    const result = calculateDailyProgress(4, [
      { status: 'completed' },
      { status: 'missed' },
      { status: 'completed' },
      { status: 'empty' },
    ]);

    expect(result.completedDays).toBe(2);
    expect(result.progressPercent).toBe(50);
  });

  it('calculates project progress by leaf items', () => {
    const result = calculateProjectProgress([
      { id: 'stage-1', parentId: null, isCompleted: false },
      { id: 'step-1', parentId: 'stage-1', isCompleted: true },
      { id: 'step-2', parentId: 'stage-1', isCompleted: false },
      { id: 'stage-2', parentId: null, isCompleted: true },
    ]);

    expect(result.completedLeafItems).toBe(2);
    expect(result.totalLeafItems).toBe(3);
    expect(result.progressPercent).toBeCloseTo(66.67, 2);
  });

  it('returns 0 project progress when there are no items', () => {
    const result = calculateProjectProgress([]);

    expect(result.completedLeafItems).toBe(0);
    expect(result.totalLeafItems).toBe(0);
    expect(result.progressPercent).toBe(0);
  });

  it('formats progress percent with one decimal place', () => {
    expect(formatProgressPercent(42)).toBe('42.0%');
    expect(formatProgressPercent(52.36)).toBe('52.4%');
    expect(formatProgressPercent(100)).toBe('100.0%');
  });

  it('detects completed progress at 100%', () => {
    expect(isProgressCompleted(99.9)).toBe(false);
    expect(isProgressCompleted(100)).toBe(true);
    expect(isProgressCompleted(120)).toBe(true);
  });

  it('calculates project stage progress by its steps', () => {
    const progress = calculateProjectStageProgress(
      { id: 'stage-1', isCompleted: false },
      [
        { parentId: 'stage-1', isCompleted: true },
        { parentId: 'stage-1', isCompleted: false },
        { parentId: 'stage-2', isCompleted: true },
      ],
    );

    expect(progress).toBe(50);
  });

  it('calculates empty project stage progress by stage completion', () => {
    expect(calculateProjectStageProgress({ id: 'stage-1', isCompleted: true }, [])).toBe(100);
    expect(calculateProjectStageProgress({ id: 'stage-1', isCompleted: false }, [])).toBe(0);
  });

  it('calculates project step progress as 0 or 100', () => {
    expect(calculateProjectStepProgress(true)).toBe(100);
    expect(calculateProjectStepProgress(false)).toBe(0);
  });
});
