import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';

import {useAuth} from '../../context/AuthContext';

const ProfileScreen = () => {
  const {
    profile,
    logout,
    refreshProfile,
    updateProfileName,
    deleteAccount,
  } = useAuth();

  const [name, setName] = useState(profile?.user.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const user = profile?.user;
  const subscription = profile?.subscription;
  const aiUsage = profile?.aiUsage;

  const handleUpdateName = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Required', 'Name is required.');
        return;
      }

      setIsSaving(true);
      await updateProfileName(name);
      Alert.alert('Success', 'Profile updated.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will delete your account data from backend.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message ?? 'Unable to delete account.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Profile
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>

        <TextInput
          mode="outlined"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleUpdateName}
          loading={isSaving}
          disabled={isSaving}
          style={styles.button}>
          Update Name
        </Button>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowTitle}>Email</Text>
        <Text style={styles.rowValue}>{user?.email ?? '-'}</Text>

        <Text style={styles.rowTitle}>Subscription Status</Text>
        <Text style={styles.rowValue}>{user?.subscriptionStatus ?? '-'}</Text>

        <Text style={styles.rowTitle}>Plan</Text>
        <Text style={styles.rowValue}>{user?.currentPlanId ?? '-'}</Text>

        <Text style={styles.rowTitle}>Billing Status</Text>
        <Text style={styles.rowValue}>{subscription?.status ?? '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowTitle}>AI Monthly Limit</Text>
        <Text style={styles.rowValue}>{aiUsage?.monthlyLimit ?? 0}</Text>

        <Text style={styles.rowTitle}>AI Used</Text>
        <Text style={styles.rowValue}>{aiUsage?.usedThisMonth ?? 0}</Text>

        <Text style={styles.rowTitle}>AI Remaining</Text>
        <Text style={styles.rowValue}>{aiUsage?.remaining ?? 0}</Text>
      </View>

      <Button mode="outlined" onPress={refreshProfile} style={styles.button}>
        Refresh Profile
      </Button>

      <Button mode="outlined" onPress={logout} style={styles.button}>
        Logout
      </Button>

      <Button
        mode="contained"
        buttonColor="#EF4444"
        onPress={handleDeleteAccount}
        style={styles.button}>
        Delete Account
      </Button>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#F9FAFB',
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#0B1020',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
  },
  label: {
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  rowTitle: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  rowValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  button: {
    borderRadius: 12,
    marginBottom: 12,
  },
});