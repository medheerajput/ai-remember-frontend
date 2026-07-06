import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useAuth} from '../../context/AuthContext';
import {getProfile, type ProfileResponse} from '../../services/profileApi';

const ProfileScreen = () => {
  const {logout, getIdToken} = useAuth() as any;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      const token = await getIdToken();
      const data = await getProfile(token);

      setProfile(data);
    } catch (error) {
      Alert.alert(
        'Profile error',
        error instanceof Error ? error.message : 'Could not load profile',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const aiUsed = profile?.aiUsage?.usedThisMonth ?? 0;
  const aiLimit = profile?.aiUsage?.monthlyLimit ?? 300;
  const aiRemaining = profile?.aiUsage?.remaining ?? 300;

  const handleLogout = async () => {
    await logout();
  };

  const actionItems = [
    'Manage Subscription',
    'Edit Name',
    'Logout',
    'Delete Account',
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#A78BFA" size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>

          <Text style={styles.name}>{profile?.user?.name || 'User'}</Text>
          <Text style={styles.email}>{profile?.user?.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardLabel}>Current Plan</Text>
          <Text style={styles.cardValue}>
            {profile?.subscription?.planId || profile?.user?.currentPlanId}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>Status</Text>
          <Text style={styles.statusText}>
            {profile?.user?.subscriptionStatus || 'trialing'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardLabel}>Monthly AI Usage</Text>
          <Text style={styles.cardValue}>
            {aiUsed} / {aiLimit} used
          </Text>
          <Text style={styles.remainingText}>{aiRemaining} remaining</Text>
        </View>

        <View style={styles.actionList}>
          {actionItems.map(item => {
            const isDanger = item === 'Delete Account';
            const isLogout = item === 'Logout';

            return (
              <Pressable
                key={item}
                style={styles.actionItem}
                onPress={isLogout ? handleLogout : undefined}>
                <Text
                  style={[
                    styles.actionItemText,
                    isDanger && styles.dangerText,
                  ]}>
                  {item}
                </Text>
                <Text style={styles.actionArrow}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
    padding: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  profileTop: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#A78BFA',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 14,
  },
  email: {
    color: '#9CA3AF',
    marginTop: 5,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardValue: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: 14,
  },
  statusText: {
    color: '#A78BFA',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  remainingText: {
    color: '#9CA3AF',
    marginTop: 5,
    fontSize: 14,
  },
  actionList: {
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 4,
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionItemText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerText: {
    color: '#FCA5A5',
  },
  actionArrow: {
    color: '#6B7280',
    fontSize: 24,
  },
});