export type ChallengeFormValidationInput = {
  title: string;
  durationDays: string;
  targetValue?: string;
  unit?: string;
  dailyActionText?: string;
};

export type ChallengeFormValidationErrors = Partial<
  Record<'title' | 'durationDays' | 'targetValue' | 'unit' | 'dailyActionText', string>
>;

export function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed.toString() !== value.trim()) {
    return null;
  }

  return parsed;
}

export function parsePositiveNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function validateBaseChallengeForm(input: ChallengeFormValidationInput) {
  const errors: ChallengeFormValidationErrors = {};

  if (!input.title.trim()) {
    errors.title = 'Введи название челленджа.';
  }

  if (!input.durationDays.trim()) {
    errors.durationDays = 'Введи количество дней.';
  } else if (parsePositiveInteger(input.durationDays) === null) {
    errors.durationDays = 'Количество дней должно быть положительным целым числом.';
  }

  return errors;
}

export function validateNumericChallengeForm(input: ChallengeFormValidationInput) {
  const errors = validateBaseChallengeForm(input);

  if (!input.targetValue?.trim()) {
    errors.targetValue = 'Введи целевое число.';
  } else if (parsePositiveNumber(input.targetValue) === null) {
    errors.targetValue = 'Целевое число должно быть положительным числом.';
  }

  if (!input.unit?.trim()) {
    errors.unit = 'Введи единицу измерения.';
  }

  return errors;
}

export function validateDailyChallengeForm(input: ChallengeFormValidationInput) {
  const errors = validateBaseChallengeForm(input);

  if (!input.dailyActionText?.trim()) {
    errors.dailyActionText = 'Введи ежедневное действие.';
  }

  return errors;
}

export function hasValidationErrors(errors: ChallengeFormValidationErrors) {
  return Object.keys(errors).length > 0;
}

export function validateRequiredText(value: string, message: string) {
  return value.trim() ? '' : message;
}
