import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import {useAuth} from '../../context/AuthContext';
import {
  ApiReminder,
  completeReminder,
  deleteReminder,
  fetchReminders,
  updateReminder,
} from '../../services/reminderApi';

type ReminderFilter = 'upcoming' | 'completed' | 'missed';

const FILTERS: ReminderFilter[] = ['upcoming', 'completed', 'missed'];

const mapFilterToApiStatus = (
  filter: ReminderFilter,
): 'pending' | 'completed' | 'missed' => {
  if (filter === 'upcoming') {
    return 'pending';
  }

  return filter;
};

const formatReminderDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const RemindersScreen = () => {
  const {getIdToken} = useAuth() as any;

  const [activeFilter, setActiveFilter] =
    useState<ReminderFilter>('upcoming');

  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editReminder, setEditReminder] = useState<ApiReminder | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDateTime, setEditDateTime] = useState('');

  const loadReminders = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        const token = await getIdToken();

        const data = await fetchReminders(
          token,
          mapFilterToApiStatus(activeFilter),
        );

        setReminders(data);
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof Error
            ? error.message
            : 'Unable to fetch reminders.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter, getIdToken],
  );

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders]),
  );

  const upcomingCount = useMemo(() => {
    return reminders.filter(item => item.status === 'pending').length;
  }, [reminders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReminders(false);
  };

  const handleComplete = async (reminderId: string) => {
    try {
      const token = await getIdToken();

      await completeReminder(token, reminderId);

      setReminders(prev => prev.filter(item => item.id !== reminderId));
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to complete reminder.',
      );
    }
  };

  const handleDelete = async (reminderId: string) => {
    Alert.alert('Delete reminder?', 'This reminder will be removed.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getIdToken();

            await deleteReminder(token, reminderId);

            setReminders(prev => prev.filter(item => item.id !== reminderId));
          } catch (error) {
            Alert.alert(
              'Error',
              error instanceof Error
                ? error.message
                : 'Unable to delete reminder.',
            );
          }
        },
      },
    ]);
  };

  const openEditModal = (reminder: ApiReminder) => {
    setEditReminder(reminder);
    setEditTitle(reminder.title);
    setEditDescription(reminder.description ?? '');
    setEditDateTime(reminder.remindAt);
  };

  const closeEditModal = () => {
    setEditReminder(null);
    setEditTitle('');
    setEditDescription('');
    setEditDateTime('');
  };

  const handleSaveEdit = async () => {
    if (!editReminder) {
      return;
    }

    const cleanTitle = editTitle.trim();
    const cleanDateTime = editDateTime.trim();

    if (!cleanTitle) {
      Alert.alert('Missing title', 'Please enter reminder title.');
      return;
    }

    const date = new Date(cleanDateTime);

    if (Number.isNaN(date.getTime())) {
      Alert.alert(
        'Invalid date',
        'Please enter date in ISO format, for example 2026-07-07T08:30:00.000Z',
      );
      return;
    }

    try {
      const token = await getIdToken();

      const updatedReminder = await updateReminder(token, editReminder.id, {
        title: cleanTitle,
        description: editDescription.trim() || null,
        remindAt: date.toISOString(),
        timezone: editReminder.timezone || 'Asia/Kolkata',
        repeat: editReminder.repeat || {
          type: 'none',
          interval: 1,
        },
      });

      setReminders(prev =>
        prev.map(item =>
          item.id === updatedReminder.id ? updatedReminder : item,
        ),
      );

      closeEditModal();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to update reminder.',
      );
    }
  };

  const renderReminder = ({item}: {item: ApiReminder}) => {
    const isPending = item.status === 'pending' || item.status === 'missed';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleWrapper}>
            <Text style={styles.cardTitle}>{item.title}</Text>

            <Text style={styles.cardDate}>
              {formatReminderDate(item.remindAt)}
            </Text>

            {item.description ? (
              <Text style={styles.cardDescription}>{item.description}</Text>
            ) : null}

            {item.memoryId ? (
              <Text style={styles.fromMemory}>From memory</Text>
            ) : null}
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.status === 'pending' ? 'upcoming' : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {isPending ? (
            <Pressable
              style={styles.actionButton}
              onPress={() => handleComplete(item.id)}>
              <Text style={styles.actionText}>Done</Text>
            </Pressable>
          ) : null}

          {isPending ? (
            <Pressable
              style={styles.actionButton}
              onPress={() => openEditModal(item)}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>{upcomingCount} upcoming</Text>
        </View>

        <View style={styles.filters}>
          {FILTERS.map(filter => {
            const isActive = filter === activeFilter;

            return (
              <Pressable
                key={filter}
                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                onPress={() => setActiveFilter(filter)}>
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.activeFilterText,
                  ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#A78BFA" />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={item => item.id}
            renderItem={renderReminder}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#A78BFA"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No reminders here</Text>
                <Text style={styles.emptySubtitle}>
                  Reminders you create in chat will appear here.
                </Text>
              </View>
            }
          />
        )}

        <Modal visible={!!editReminder} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit reminder</Text>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Reminder title"
                placeholderTextColor="#6B7280"
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
              />

              <Text style={styles.inputLabel}>Date/time ISO</Text>
              <TextInput
                value={editDateTime}
                onChangeText={setEditDateTime}
                placeholder="2026-07-07T08:30:00.000Z"
                placeholderTextColor="#6B7280"
                style={styles.modalInput}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={closeEditModal}>
                  <Text style={styles.actionText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.modalSaveButton}
                  onPress={handleSaveEdit}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default RemindersScreen;

const styles = StyleSheet.create({
    cardDescription: {
  color: '#D1D5DB',
  marginTop: 7,
  fontSize: 13,
  lineHeight: 18,
},
loadingContainer: {
  paddingTop: 80,
  alignItems: 'center',
  gap: 10,
},
loadingText: {
  color: '#9CA3AF',
  fontSize: 14,
},
modalBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.65)',
  justifyContent: 'flex-end',
},
modalCard: {
  backgroundColor: '#0B1020',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderWidth: 1,
  borderColor: '#1F2937',
  padding: 20,
},
modalTitle: {
  color: '#F9FAFB',
  fontSize: 20,
  fontWeight: '800',
  marginBottom: 16,
},
inputLabel: {
  color: '#9CA3AF',
  fontSize: 13,
  fontWeight: '700',
  marginBottom: 6,
  marginTop: 10,
},
modalInput: {
  backgroundColor: '#111827',
  borderWidth: 1,
  borderColor: '#1F2937',
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 11,
  color: '#F9FAFB',
  fontSize: 14,
},
modalTextArea: {
  minHeight: 80,
  textAlignVertical: 'top',
},
modalActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 18,
},
modalCancelButton: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 14,
  backgroundColor: '#111827',
},
modalSaveButton: {
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderRadius: 14,
  backgroundColor: '#7C3AED',
},
modalSaveText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '800',
},
  safeArea: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  activeFilterChip: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleWrapper: {
    flex: 1,
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDate: {
    color: '#9CA3AF',
    marginTop: 5,
    fontSize: 13,
  },
  fromMemory: {
    color: '#A78BFA',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  actionText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#2A1114',
  },
  deleteText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
});