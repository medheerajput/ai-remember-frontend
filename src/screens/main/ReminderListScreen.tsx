import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';

const ReminderListScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Reminders
      </Text>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No reminders yet.</Text>
      </View>
    </View>
  );
};

export default ReminderListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    padding: 20,
  },
  title: {
    color: '#F9FAFB',
    fontWeight: '700',
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#0B1020',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  emptyText: {
    color: '#9CA3AF',
  },
});