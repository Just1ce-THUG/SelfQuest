/// <reference types="jest" />

import {
  calculateDailyProgress,
  calculateNumericProgress,
  calculateProjectProgress,
  calculateProjectStageProgress,
  calculateProjectStepProgress,
  formatProgressPercent,
} from '@/utils/progress';

describe('progress utils', () => {
  it('calculates numeric progress correctly', () => {
    const result = calculateNumericProgress(100, [{ value: 20 }, { value: 30 }]);

    expect(result.totalCompleted).toBe(50);
    expect(result.remaining).toBe(50);
    expect(result.progressPercent).toBe(50);
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
