export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
