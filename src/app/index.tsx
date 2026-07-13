import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <EmptyState
          title="SelfQuest"
          description="Здесь будут твои личные челленджи. Начни с небольшой цели и отслеживай понятный прогресс."
        />

        <Link href={'/challenges' as Href} asChild>
          <AppButton title="Открыть челленджи" />
        </Link>

        <Link href={'/challenges/create' as Href} asChild>
          <AppButton title="Создать челлендж" variant="secondary" />
        </Link>
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
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
});
