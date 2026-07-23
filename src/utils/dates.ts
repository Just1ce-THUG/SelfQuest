export type CalendarDay = {
  dateKey: string | null;
  dayNumber: number | null;
  isCurrentMonth: boolean;
};

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function dateKeyToLocalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateKey: string, days: number) {
  const date = dateKeyToLocalDate(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function getChallengeEndDate(startDate: string, durationDays: number) {
  return addDays(startDate, Math.max(durationDays - 1, 0));
}

export function isSameDate(leftDateKey: string, rightDateKey: string) {
  return leftDateKey === rightDateKey;
}

export function isDateInChallengeRange(dateKey: string, startDate: string, durationDays: number) {
  const endDate = getChallengeEndDate(startDate, durationDays);
  return dateKey >= startDate && dateKey <= endDate;
}

export function formatMonthYearRu(date: Date) {
  return `${MONTHS_RU[date.getMonth()]} ${date.getFullYear()}`;
}

export function getMonthCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mondayBasedStartOffset = (firstDay.getDay() + 6) % 7;
  const days: CalendarDay[] = [];

  for (let index = 0; index < mondayBasedStartOffset; index += 1) {
    days.push({
      dateKey: null,
      dayNumber: null,
      isCurrentMonth: false,
    });
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    days.push({
      dateKey: toDateKey(new Date(year, monthIndex, dayNumber)),
      dayNumber,
      isCurrentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      dateKey: null,
      dayNumber: null,
      isCurrentMonth: false,
    });
  }

  return days;
}

export function calculateDailyStreak(
  startDate: string,
  durationDays: number,
  entries: Pick<{ date: string; status: string }, 'date' | 'status'>[],
  todayKey = toDateKey(new Date()),
) {
  if (durationDays <= 0 || todayKey < startDate) {
    return 0;
  }

  const endDate = getChallengeEndDate(startDate, durationDays);
  const completedDates = new Set(
    entries.filter((entry) => entry.status === 'completed').map((entry) => entry.date),
  );
  let cursor = todayKey > endDate ? endDate : todayKey;

  if (cursor >= startDate && !completedDates.has(cursor)) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;

  while (cursor >= startDate && completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
