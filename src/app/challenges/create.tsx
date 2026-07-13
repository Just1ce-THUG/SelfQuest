import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import type { ChallengeType } from '@/features/challenges/types';
import { useChallengeStore, type AddChallengeInput } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const typeOptions: { value: ChallengeType; label: string }[] = [
  { value: 'numeric', label: 'Числовой' },
  { value: 'daily', label: 'Ежедневный' },
  { value: 'project', label: 'Проектный' },
];

export default function CreateChallengeScreen() {
  const addChallenge = useChallengeStore((state) => state.addChallenge);
  const [type, setType] = useState<ChallengeType>('numeric');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [dailyActionText, setDailyActionText] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const parsedDurationDays = Number.parseInt(durationDays, 10);
    const parsedTargetValue = Number.parseFloat(targetValue.replace(',', '.'));

    if (!cleanTitle) {
      setError('Введи название челленджа.');
      return;
    }

    if (!Number.isFinite(parsedDurationDays) || parsedDurationDays <= 0) {
      setError('Количество дней должно быть больше 0.');
      return;
    }

    let input: AddChallengeInput;

    if (type === 'numeric') {
      if (!Number.isFinite(parsedTargetValue) || parsedTargetValue <= 0) {
        setError('Целевое число должно быть больше 0.');
        return;
      }

      if (!unit.trim()) {
        setError('Введи единицу измерения.');
        return;
      }

      input = {
        type,
        title: cleanTitle,
        description: cleanDescription,
        durationDays: parsedDurationDays,
        targetValue: parsedTargetValue,
        unit: unit.trim(),
      };
    } else if (type === 'daily') {
      if (!dailyActionText.trim()) {
        setError('Введи ежедневное действие.');
        return;
      }

      input = {
        type,
        title: cleanTitle,
        description: cleanDescription,
        durationDays: parsedDurationDays,
        dailyActionText: dailyActionText.trim(),
      };
    } else {
      input = {
        type,
        title: cleanTitle,
        description: cleanDescription,
        durationDays: parsedDurationDays,
      };
    }

    const challenge = addChallenge(input);
    router.replace(`/challenges/${challenge.id}` as Href);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Создание челленджа</Text>
          <Text style={styles.description}>
            Заполни минимальные поля. Данные пока сохраняются только в памяти приложения.
          </Text>
        </View>

        <View style={styles.typeRow}>
          {typeOptions.map((option) => (
            <AppButton
              key={option.value}
              title={option.label}
              variant={type === option.value ? 'primary' : 'secondary'}
              onPress={() => {
                setType(option.value);
                setError('');
              }}
            />
          ))}
        </View>

        <AppInput label="Название" placeholder="Например: 1000 отжиманий" value={title} onChangeText={setTitle} />
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
          onChangeText={setDurationDays}
        />

        {type === 'numeric' ? (
          <>
            <AppInput
              label="Целевое число"
              placeholder="Например: 1000"
              keyboardType="numeric"
              value={targetValue}
              onChangeText={setTargetValue}
            />
            <AppInput
              label="Единица измерения"
              placeholder="Например: отжиманий"
              value={unit}
              onChangeText={setUnit}
            />
          </>
        ) : null}

        {type === 'daily' ? (
          <AppInput
            label="Ежедневное действие"
            placeholder="Например: прочитать 5 страниц"
            value={dailyActionText}
            onChangeText={setDailyActionText}
          />
        ) : null}

        {type === 'project' ? (
          <Text style={styles.helperText}>Этапы и шаги можно будет добавить на экране деталей.</Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title="Сохранить челлендж" onPress={handleSave} />
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
  typeRow: {
    gap: spacing.sm,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
