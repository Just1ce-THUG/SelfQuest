import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionMenuButton } from '@/components/ActionMenuButton';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import type { NumericProgressEntry } from '@/features/challenges/types';
import { parsePositiveNumber } from '@/features/challenges/validation';
import { useChallengeStore } from '@/stores/challengeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatHistoryDateRu } from '@/utils/dates';
import {
  calculateNumericProgressHistory,
  formatProgressPercent,
  type NumericProgressHistoryItem,
} from '@/utils/progress';

const EMPTY_NUMERIC_ENTRIES: NumericProgressEntry[] = [];

export default function ChallengeHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = useChallengeStore((state) =>
    typeof id === 'string' ? state.challenges.find((item) => item.id === id) : undefined,
  );
  const numericData = useChallengeStore((state) =>
    typeof id === 'string' ? state.numericDataByChallengeId[id] : undefined,
  );
  const numericEntriesFromStore = useChallengeStore((state) =>
    typeof id === 'string' ? state.numericEntriesByChallengeId[id] : undefined,
  );
  const updateNumericProgressEntry = useChallengeStore(
    (state) => state.updateNumericProgressEntry,
  );
  const deleteNumericProgressEntry = useChallengeStore(
    (state) => state.deleteNumericProgressEntry,
  );
  const numericEntries = numericEntriesFromStore ?? EMPTY_NUMERIC_ENTRIES;
  const [isEditMode, setIsEditMode] = useState(false);
  const [actionEntryId, setActionEntryId] = useState('');
  const [editingEntryId, setEditingEntryId] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [editingError, setEditingError] = useState('');

  if (!challenge || challenge.type !== 'numeric' || !numericData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <EmptyState
            title="История недоступна"
            description="Числовой челлендж не найден или был удалён."
          />
        </View>
      </SafeAreaView>
    );
  }

  const historyItems = calculateNumericProgressHistory(
    numericData.targetValue,
    numericEntries,
  ).reverse();
  const actionItem = historyItems.find((item) => item.entry.id === actionEntryId);
  const editingItem = historyItems.find((item) => item.entry.id === editingEntryId);

  const closeActionMenu = () => {
    setActionEntryId('');
  };

  const openEditEntry = (item: NumericProgressHistoryItem<NumericProgressEntry>) => {
    setActionEntryId('');
    setEditingEntryId(item.entry.id);
    setEditingValue(String(item.entry.value));
    setEditingError('');
  };

  const closeEditEntry = () => {
    setEditingEntryId('');
    setEditingValue('');
    setEditingError('');
  };

  const saveEditedEntry = () => {
    const value = parsePositiveNumber(editingValue);

    if (value === null) {
      setEditingError('Значение должно быть положительным числом.');
      return;
    }

    updateNumericProgressEntry(challenge.id, editingEntryId, value);
    closeEditEntry();
  };

  const confirmDeleteEntry = (entry: NumericProgressEntry) => {
    setActionEntryId('');
    Alert.alert(
      'Удалить запись истории?',
      'Прогресс челленджа будет пересчитан.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteNumericProgressEntry(challenge.id, entry.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>История выполнений</Text>
            {historyItems.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.editModeButton, pressed && styles.pressed]}
                onPress={() => {
                  setIsEditMode((current) => !current);
                  setActionEntryId('');
                }}>
                <Text style={styles.editModeButtonText}>
                  {isEditMode ? 'Готово' : 'Редактировать'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
        </View>

        {historyItems.length === 0 ? (
          <EmptyState
            title="История пока пустая"
            description="Добавь первый прогресс в челлендже."
          />
        ) : (
          <View style={styles.historyList}>
            {historyItems.map((item) => (
              <View key={item.entry.id} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <Text style={styles.historyValue}>
                    {item.entry.value} {numericData.unit}
                  </Text>
                  {isEditMode ? <ActionMenuButton onPress={() => setActionEntryId(item.entry.id)} /> : null}
                </View>
                <Text style={styles.historyDate}>{formatHistoryDateRu(item.entry.date)}</Text>
                <Text style={styles.historyMeta}>
                  Прогресс на момент выполнения: {formatProgressPercent(item.progressPercent)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <HistoryEntryActionModal
        visible={Boolean(actionItem)}
        onClose={closeActionMenu}
        onEdit={() => actionItem && openEditEntry(actionItem)}
        onDelete={() => actionItem && confirmDeleteEntry(actionItem.entry)}
      />

      <HistoryEntryEditModal
        visible={Boolean(editingItem)}
        value={editingValue}
        unit={numericData.unit}
        error={editingError}
        onChangeValue={(value) => {
          setEditingValue(value);
          setEditingError('');
        }}
        onSave={saveEditedEntry}
        onCancel={closeEditEntry}
      />
    </SafeAreaView>
  );
}

type HistoryEntryActionModalProps = {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function HistoryEntryActionModal({
  visible,
  onClose,
  onEdit,
  onDelete,
}: HistoryEntryActionModalProps) {
  return (
    <Modal transparent statusBarTranslucent navigationBarTranslucent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Запись истории</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.modalActions}>
            <AppButton title="Изменить" onPress={onEdit} />
            <AppButton title="Удалить" variant="secondary" onPress={onDelete} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type HistoryEntryEditModalProps = {
  visible: boolean;
  value: string;
  unit: string;
  error: string;
  onChangeValue: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function HistoryEntryEditModal({
  visible,
  value,
  unit,
  error,
  onChangeValue,
  onSave,
  onCancel,
}: HistoryEntryEditModalProps) {
  return (
    <Modal transparent statusBarTranslucent navigationBarTranslucent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Изменить запись</Text>
          <AppInput
            label={`Количество, ${unit}`}
            placeholder="Например: 50"
            keyboardType="numeric"
            value={value}
            error={error}
            onChangeText={onChangeValue}
          />
          <View style={styles.inlineActions}>
            <AppButton title="Сохранить" onPress={onSave} />
            <AppButton title="Отмена" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  editModeButton: {
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editModeButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  challengeTitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    gap: spacing.xs,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  historyValue: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  historyDate: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  historyMeta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 19, 24, 0.45)',
    padding: spacing.lg,
  },
  modalCard: {
    gap: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  closeText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineActions: {
    gap: spacing.sm,
  },
});
