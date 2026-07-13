import { Link, type Href } from 'expo-router';
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
          <Text style={styles.title}>Create challenge</Text>
          <Text style={styles.description}>
            This is a form placeholder. Challenge creation logic will be added in the MVP steps.
          </Text>
        </View>

        <AppInput label="Title" placeholder="Example: 1000 push-ups" />
        <AppInput label="Description" placeholder="Short motivation or notes" multiline />

        <AppButton title="Save draft" disabled />

        <Link href={'/challenges' as Href} asChild>
          <AppButton title="Back to list" variant="secondary" />
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
