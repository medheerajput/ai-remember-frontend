import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import {
  deleteProfile,
  fetchProfile,
  ProfileResponse,
  updateProfileName,
} from '../../services/profileApi';
import PaywallCard from '../components/PaywallCard';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'trialing':
      return 'Free trial';
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Unknown';
  }
};

const ProfileScreen = () => {
  const { user, getIdToken, logout, signOut } = useAuth() as any;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [name, setName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const loadProfile = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        const token = await getIdToken();
        const data = await fetchProfile(token);

        setProfile(data);
        setName(data.user?.name ?? user?.displayName ?? '');
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Unable to load profile.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getIdToken, user?.displayName],
  );

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProfile(false);
  };

  const handleSaveName = async () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }

    try {
      setIsSavingName(true);

      const token = await getIdToken();
      const data = await updateProfileName(token, cleanName);

      setProfile(data);
      setName(data.user?.name ?? cleanName);

      Alert.alert('Updated', 'Your profile name has been updated.');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to update profile.',
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Coming next',
      'Google Play Billing will be connected in the next step.',
    );
  };

  const handleRestorePurchase = () => {
    Alert.alert(
      'Coming next',
      'Restore purchase will be connected with Google Play Billing.',
    );
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Coming next',
      'Manage subscription will open Google Play subscription settings later.',
    );
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
        return;
      }

      if (signOut) {
        await signOut();
      }
    } catch {
      Alert.alert('Error', 'Unable to logout.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will delete your memories, reminders, and profile data.',
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
              const token = await getIdToken();

              await deleteProfile(token);

              if (logout) {
                await logout();
                return;
              }

              if (signOut) {
                await signOut();
              }
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete account.',
              );
            }
          },
        },
      ],
    );
  };

  const entitlement = profile?.entitlement;
  const aiUsage = entitlement?.aiUsage;

  const usagePercent =
    aiUsage && aiUsage.monthlyLimit > 0
      ? Math.min(aiUsage.usedThisMonth / aiUsage.monthlyLimit, 1)
      : 0;

  const showPaywall = entitlement?.shouldShowPaywall;

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#A78BFA" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#A78BFA"
            />
          }>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account and plan.</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.user?.name || user?.displayName || 'D')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.user?.name || user?.displayName || 'Dheeraj'}
              </Text>
              <Text style={styles.profileEmail}>
                {profile?.user?.email || user?.email || ''}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your name</Text>

            <View style={styles.nameRow}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#6B7280"
                style={styles.nameInput}
              />

              <Pressable
                style={[
                  styles.saveButton,
                  isSavingName && styles.disabledButton,
                ]}
                onPress={handleSaveName}
                disabled={isSavingName}>
                <Text style={styles.saveButtonText}>
                  {isSavingName ? 'Saving' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showPaywall && entitlement ? (
            <PaywallCard
              priceInr={entitlement.plan.priceInr}
              trialDays={entitlement.plan.trialDays}
              title="Your free trial has ended"
              subtitle="Continue using memories, reminders, AI answers, and cloud sync."
              buttonText={`Start ₹${entitlement.plan.priceInr}/month`}
              onUpgrade={handleUpgrade}
              onRestore={handleRestorePurchase}
            />
          ) : null}

          {entitlement ? (
            <View style={styles.section}>
              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planTitle}>
                      Remember AI Monthly
                    </Text>
                    <Text style={styles.planSubtitle}>
                      ₹{entitlement.plan.priceInr}/month
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {getStatusLabel(entitlement.status)}
                    </Text>
                  </View>
                </View>

                {entitlement.status === 'trialing' ? (
                  <View style={styles.trialBox}>
                    <Text style={styles.trialTitle}>
                      {entitlement.trial.daysLeft} days left in free trial
                    </Text>
                    <Text style={styles.trialSubtitle}>
                      Trial ends on {formatDate(entitlement.trial.endsAt)}.
                      After trial, continue for ₹
                      {entitlement.plan.priceInr}/month.
                    </Text>
                  </View>
                ) : null}

                {entitlement.status === 'active' ? (
                  <View style={styles.trialBox}>
                    <Text style={styles.trialTitle}>
                      Subscription active
                    </Text>
                    <Text style={styles.trialSubtitle}>
                      Renews on{' '}
                      {formatDate(
                        entitlement.subscription.currentPeriodEnd,
                      )}
                      .
                    </Text>
                  </View>
                ) : null}

                {entitlement.status !== 'active' &&
                  entitlement.status !== 'trialing' ? (
                  <View style={styles.trialBox}>
                    <Text style={styles.trialTitle}>
                      Subscription not active
                    </Text>
                    <Text style={styles.trialSubtitle}>
                      Upgrade to continue using Remember AI.
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={styles.manageButton}
                  onPress={
                    entitlement.status === 'active'
                      ? handleManageSubscription
                      : handleUpgrade
                  }>
                  <Text style={styles.manageButtonText}>
                    {entitlement.status === 'active'
                      ? 'Manage subscription'
                      : `Start ₹${entitlement.plan.priceInr}/month`}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {aiUsage ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI usage this month</Text>

              <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageTitle}>
                    {aiUsage.usedThisMonth} / {aiUsage.monthlyLimit} used
                  </Text>
                  <Text style={styles.usageRemaining}>
                    {aiUsage.remaining} left
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${usagePercent * 100}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.resetText}>
                  Resets on {formatDate(aiUsage.resetAt)}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <Pressable style={styles.accountButton} onPress={handleLogout}>
              <Text style={styles.accountButtonText}>Logout</Text>
            </Pressable>

            <Pressable
              style={[styles.accountButton, styles.deleteAccountButton]}
              onPress={handleDeleteAccount}>
              <Text style={styles.deleteAccountText}>Delete account</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070A12',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 16,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '900',
  },
  profileEmail: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F9FAFB',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  planCard: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 22,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    color: '#F9FAFB',
    fontSize: 17,
    fontWeight: '900',
  },
  planSubtitle: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  trialBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  trialTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '900',
  },
  trialSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },
  manageButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  usageCard: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 22,
    padding: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '900',
  },
  usageRemaining: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#111827',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 999,
  },
  resetText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
  },
  accountButton: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  accountButtonText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteAccountButton: {
    backgroundColor: '#2A1114',
    borderColor: '#7F1D1D',
  },
  deleteAccountText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '900',
  },
});