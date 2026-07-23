/// <reference types="jest" />

import {
  calculateDailyStreak,
  formatMonthYearRu,
  getChallengeEndDate,
  getMonthCalendarDays,
  isDateInChallengeRange,
} from '@/utils/dates';

describe('date utils', () => {
  it('calculates challenge end date by duration', () => {
    expect(getChallengeEndDate('2026-07-01', 30)).toBe('2026-07-30');
    expect(getChallengeEndDate('2026-12-31', 2)).toBe('2027-01-01');
  });

  it('checks challenge date range including start and end', () => {
    expect(isDateInChallengeRange('2026-07-01', '2026-07-01', 3)).toBe(true);
    expect(isDateInChallengeRange('2026-07-03', '2026-07-01', 3)).toBe(true);
    expect(isDateInChallengeRange('2026-07-04', '2026-07-01', 3)).toBe(false);
  });

  it('calculates daily streak without missed days', () => {
    const streak = calculateDailyStreak(
      '2026-07-01',
      10,
      [
        { date: '2026-07-01', status: 'completed' },
        { date: '2026-07-02', status: 'completed' },
        { date: '2026-07-03', status: 'completed' },
      ],
      '2026-07-03',
    );

    expect(streak).toBe(3);
  });

  it('breaks daily streak after a missed day', () => {
    const streak = calculateDailyStreak(
      '2026-07-01',
      10,
      [
        { date: '2026-07-01', status: 'completed' },
        { date: '2026-07-02', status: 'completed' },
        { date: '2026-07-04', status: 'completed' },
      ],
      '2026-07-04',
    );

    expect(streak).toBe(1);
  });

  it('formats month and year in Russian', () => {
    expect(formatMonthYearRu(new Date(2026, 6, 1))).toBe('Июль 2026');
  });

  it('builds month calendar with weeks starting on Monday', () => {
    const days = getMonthCalendarDays(2026, 6);

    expect(days).toHaveLength(35);
    expect(days[0].dateKey).toBeNull();
    expect(days[1].dateKey).toBeNull();
    expect(days[2].dateKey).toBe('2026-07-01');
    expect(days[2].dayNumber).toBe(1);
  });
});
