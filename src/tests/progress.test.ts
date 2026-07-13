/// <reference types="jest" />

import {
  calculateDailyProgress,
  calculateNumericProgress,
  calculateProjectProgress,
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
});
