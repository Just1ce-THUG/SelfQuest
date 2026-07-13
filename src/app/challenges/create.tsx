import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function CreateChallengeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Создание челленджа</Text>
          <Text style={styles.description}>
            Это заглушка формы. Логика создания челленджа появится на следующих шагах MVP.
          </Text>
        </View>

        <AppInput label="Название" placeholder="Например: 1000 отжиманий" />
        <AppInput label="Описание" placeholder="Короткая мотивация или заметки" multiline />

        <AppButton title="Сохранить черновик" disabled />
      </View>
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
});
