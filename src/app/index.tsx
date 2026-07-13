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
          description="Personal challenges live here. Start with a small goal and track visible progress."
        />

        <Link href={'/challenges' as Href} asChild>
          <AppButton title="View challenges" />
        </Link>

        <Link href={'/challenges/create' as Href} asChild>
          <AppButton title="Create challenge" variant="secondary" />
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
