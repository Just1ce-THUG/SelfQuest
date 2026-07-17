import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import {
  hasValidationErrors,
  parsePositiveInteger,
  parsePositiveNumber,
  validateBaseChallengeForm,
  validateDailyChallengeForm,
  validateNumericChallengeForm,
  type ChallengeFormValidationErrors,
} from '@/features/challenges/validation';
import { useChallengeStore } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { toDateKey } from '@/utils/dates';

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export default function EditChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = useChallengeStore((state) =>
    typeof id === 'string' ? state.challenges.find((item) => item.id === id) : undefined,
  );
  const numericData = useChallengeStore((state) =>
    typeof id === 'string' ? state.numericDataByChallengeId[id] : undefined,
  );
  const dailyData = useChallengeStore((state) =>
    typeof id === 'string' ? state.dailyDataByChallengeId[id] : undefined,
  );
  const updateChallenge = useChallengeStore((state) => state.updateChallenge);
  const updateNumericChallengeData = useChallengeStore((state) => state.updateNumericChallengeData);
  const updateDailyChallengeData = useChallengeStore((state) => state.updateDailyChallengeData);

  const [title, setTitle] = useState(challenge?.title ?? '');
  const [description, setDescription] = useState(challenge?.description ?? '');
  const [durationDays, setDurationDays] = useState(challenge?.durationDays.toString() ?? '30');
  const [targetValue, setTargetValue] = useState(numericData?.targetValue.toString() ?? '');
  const [unit, setUnit] = useState(numericData?.unit ?? '');
  const [dailyActionText, setDailyActionText] = useState(dailyData?.dailyActionText ?? '');
  const [errors, setErrors] = useState<ChallengeFormValidationErrors>({});

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

  const handleSave = () => {
    const nextErrors =
      challenge.type === 'numeric'
        ? validateNumericChallengeForm({ title, durationDays, targetValue, unit })
        : challenge.type === 'daily'
          ? validateDailyChallengeForm({ title, durationDays, dailyActionText })
          : validateBaseChallengeForm({ title, durationDays });

    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    const parsedDurationDays = parsePositiveInteger(durationDays) ?? challenge.durationDays;

    updateChallenge(challenge.id, {
      title: title.trim(),
      description: description.trim(),
      durationDays: parsedDurationDays,
      endDate: addDays(challenge.startDate, Math.max(parsedDurationDays - 1, 0)),
    });

    if (challenge.type === 'numeric') {
      updateNumericChallengeData(challenge.id, {
        targetValue: parsePositiveNumber(targetValue) ?? numericData?.targetValue ?? 1,
        unit: unit.trim(),
      });
    }

    if (challenge.type === 'daily') {
      updateDailyChallengeData(challenge.id, {
        dailyActionText: dailyActionText.trim(),
      });
    }

    router.replace(`/challenges/${challenge.id}` as Href);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Редактирование челленджа</Text>
          <Text style={styles.description}>Измени базовые параметры челленджа.</Text>
        </View>

        <AppInput
          label="Название"
          placeholder="Например: 1000 отжиманий"
          value={title}
          error={errors.title}
          onChangeText={setTitle}
        />
        <AppInput
          label="Описание"
          placeholder="Короткая мотивация или заметки"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <AppInput
          label="Количество дней"
          placeholder="Например: 30"
          keyboardType="numeric"
          value={durationDays}
          error={errors.durationDays}
          onChangeText={setDurationDays}
        />

        {challenge.type === 'numeric' ? (
          <>
            <AppInput
              label="Целевое число"
              placeholder="Например: 1000"
              keyboardType="numeric"
              value={targetValue}
              error={errors.targetValue}
              onChangeText={setTargetValue}
            />
            <AppInput
              label="Единица измерения"
              placeholder="Например: отжиманий"
              value={unit}
              error={errors.unit}
              onChangeText={setUnit}
            />
          </>
        ) : null}

        {challenge.type === 'daily' ? (
          <AppInput
            label="Ежедневное действие"
            placeholder="Например: прочитать 5 страниц"
            value={dailyActionText}
            error={errors.dailyActionText}
            onChangeText={setDailyActionText}
          />
        ) : null}

        {challenge.type === 'project' ? (
          <Text style={styles.helperText}>Этапы и шаги редактируются на экране деталей.</Text>
        ) : null}

        <AppButton title="Сохранить изменения" onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
