import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Divider,
  IconButton,
  ProgressBar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';

import {useAuth} from '../../context/AuthContext';
import type {ChatMessage, ChatThread} from '../../types/chat.types';

const createId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const createWelcomeMessage = (): ChatMessage => {
  return {
    id: createId('msg'),
    role: 'assistant',
    text:
      'Hi, I am Remember AI. Tell me anything to remember, ask me something, or say things like “remind me tomorrow morning to call mom”.',
    createdAt: new Date().toISOString(),
  };
};

const createNewThread = (): ChatThread => {
  const now = new Date().toISOString();

  return {
    id: createId('chat'),
    title: 'New chat',
    messages: [createWelcomeMessage()],
    createdAt: now,
    updatedAt: now,
  };
};

const getThreadTitle = (text: string) => {
  const cleanText = text.trim();

  if (!cleanText) {
    return 'New chat';
  }

  if (cleanText.length <= 32) {
    return cleanText;
  }

  return `${cleanText.slice(0, 32)}...`;
};

const isReminderText = (text: string) => {
  const lower = text.toLowerCase();

  return (
    lower.includes('remind') ||
    lower.includes('reminder') ||
    lower.includes('tomorrow') ||
    lower.includes('today morning') ||
    lower.includes('daily') ||
    lower.includes('weekly')
  );
};

const getLocalAssistantReply = (text: string) => {
  if (isReminderText(text)) {
    return 'Got it. I understood this as a reminder request. Reminder backend will be connected next, then I will save and schedule it properly.';
  }

  return 'I understood. Ask AI backend will be connected next, then I will search your saved memories and answer naturally.';
};

const formatDate = (date?: string | null) => {
  if (!date) {
    return '-';
  }

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getTrialDaysLeft = (endsAt?: string) => {
  if (!endsAt) {
    return 0;
  }

  const diff = new Date(endsAt).getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const HomeScreen = () => {
  const {
    profile,
    logout,
    refreshProfile,
    updateProfileName,
    deleteAccount,
  } = useAuth();

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [threads, setThreads] = useState<ChatThread[]>([createNewThread()]);
  const [activeThreadId, setActiveThreadId] = useState<string>(
    threads[0].id,
  );

  const [message, setMessage] = useState('');

  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);

  const [profileName, setProfileName] = useState(profile?.user.name ?? '');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeThread = useMemo(() => {
    return threads.find(thread => thread.id === activeThreadId) ?? threads[0];
  }, [threads, activeThreadId]);

  const user = profile?.user;
  const subscription = profile?.subscription;
  const aiUsage = profile?.aiUsage;

  const aiProgress = useMemo(() => {
    if (!aiUsage?.monthlyLimit) {
      return 0;
    }

    return aiUsage.usedThisMonth / aiUsage.monthlyLimit;
  }, [aiUsage]);

  useEffect(() => {
    setProfileName(profile?.user.name ?? '');
  }, [profile?.user.name]);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({animated: true});
    }, 100);
  }, [activeThread?.messages.length]);

  const handleNewChat = () => {
    const newThread = createNewThread();

    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setIsSidebarVisible(false);
  };

  const handleSend = () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId('msg'),
      role: 'user',
      text: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      id: createId('msg'),
      role: 'assistant',
      text: getLocalAssistantReply(cleanMessage),
      createdAt: new Date().toISOString(),
    };

    setThreads(prev =>
      prev.map(thread => {
        if (thread.id !== activeThreadId) {
          return thread;
        }

        const isFirstUserMessage =
          thread.title === 'New chat' &&
          thread.messages.filter(item => item.role === 'user').length === 0;

        return {
          ...thread,
          title: isFirstUserMessage
            ? getThreadTitle(cleanMessage)
            : thread.title,
          messages: [...thread.messages, userMessage, assistantMessage],
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    setMessage('');
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsSidebarVisible(false);
  };

  const handleRefreshProfile = async () => {
    try {
      setIsRefreshing(true);
      await refreshProfile();
      Alert.alert('Success', 'Profile refreshed.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Unable to refresh profile.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateName = async () => {
    try {
      if (!profileName.trim()) {
        Alert.alert('Required', 'Name is required.');
        return;
      }

      setIsProfileSaving(true);
      await updateProfileName(profileName.trim());
      Alert.alert('Success', 'Name updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Unable to update name.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout?', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsProfileVisible(false);
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will delete your backend account data. This action cannot be undone.',
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
              setIsProfileVisible(false);
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

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.assistantMessageRow,
        ]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>AI</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderSidebar = () => {
    return (
      <Modal
        visible={isSidebarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSidebarVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsSidebarVisible(false)}
          />

          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text variant="titleLarge" style={styles.sidebarTitle}>
                Chats
              </Text>

              <IconButton
                icon="close"
                iconColor="#F9FAFB"
                onPress={() => setIsSidebarVisible(false)}
              />
            </View>

            <Button
              mode="contained"
              icon="plus"
              onPress={handleNewChat}
              style={styles.newChatButton}>
              New Chat
            </Button>

            <Divider style={styles.divider} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {threads.map(thread => {
                const isActive = thread.id === activeThreadId;

                return (
                  <Pressable
                    key={thread.id}
                    onPress={() => handleSelectThread(thread.id)}
                    style={[
                      styles.threadItem,
                      isActive && styles.activeThreadItem,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.threadTitle,
                        isActive && styles.activeThreadTitle,
                      ]}>
                      {thread.title}
                    </Text>

                    <Text style={styles.threadDate}>
                      {formatDate(thread.updatedAt)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderProfileModal = () => {
    const trialDaysLeft = getTrialDaysLeft(user?.trial.endsAt);

    return (
      <Modal
        visible={isProfileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsProfileVisible(false)}>
        <View style={styles.profileModalRoot}>
          <Pressable
            style={styles.profileBackdrop}
            onPress={() => setIsProfileVisible(false)}
          />

          <View style={styles.profilePanel}>
            <View style={styles.profileHeader}>
              <View style={styles.profileTitleRow}>
                <Avatar.Text
                  size={44}
                  label={(user?.name || user?.email || 'U')
                    .slice(0, 1)
                    .toUpperCase()}
                  style={styles.avatar}
                />

                <View style={styles.profileTitleBox}>
                  <Text variant="titleLarge" style={styles.profileTitle}>
                    Profile
                  </Text>

                  <Text numberOfLines={1} style={styles.profileSubtitle}>
                    {user?.email ?? '-'}
                  </Text>
                </View>
              </View>

              <IconButton
                icon="close"
                iconColor="#F9FAFB"
                onPress={() => setIsProfileVisible(false)}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Surface style={styles.profileCard}>
                <Text style={styles.sectionLabel}>Name</Text>

                <TextInput
                  mode="outlined"
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Enter your name"
                  style={styles.profileInput}
                />

                <Button
                  mode="contained"
                  onPress={handleUpdateName}
                  loading={isProfileSaving}
                  disabled={isProfileSaving}
                  style={styles.profileButton}>
                  Update Name
                </Button>
              </Surface>

              <Surface style={styles.profileCard}>
                <Text style={styles.sectionTitle}>Subscription</Text>

                <InfoRow
                  label="User status"
                  value={user?.subscriptionStatus ?? '-'}
                />

                <InfoRow
                  label="Billing status"
                  value={subscription?.status ?? '-'}
                />

                <InfoRow
                  label="Plan"
                  value={user?.currentPlanId ?? '-'}
                />

                <InfoRow
                  label="Trial ends"
                  value={formatDate(user?.trial.endsAt)}
                />

                <InfoRow
                  label="Trial days left"
                  value={`${trialDaysLeft} days`}
                />
              </Surface>

              <Surface style={styles.profileCard}>
                <Text style={styles.sectionTitle}>AI Usage</Text>

                <View style={styles.usageHeader}>
                  <Text style={styles.usageText}>
                    {aiUsage?.usedThisMonth ?? 0} used
                  </Text>

                  <Text style={styles.usageText}>
                    {aiUsage?.remaining ?? 0} remaining
                  </Text>
                </View>

                <ProgressBar
                  progress={aiProgress}
                  color="#8B5CF6"
                  style={styles.progressBar}
                />

                <InfoRow
                  label="Monthly limit"
                  value={`${aiUsage?.monthlyLimit ?? 0}`}
                />

                <InfoRow
                  label="Reset date"
                  value={formatDate(aiUsage?.resetAt)}
                />
              </Surface>

              <Surface style={styles.profileCard}>
                <Text style={styles.sectionTitle}>Account</Text>

                <Button
                  mode="outlined"
                  onPress={handleRefreshProfile}
                  loading={isRefreshing}
                  disabled={isRefreshing}
                  style={styles.profileButton}>
                  Refresh Account
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  style={styles.profileButton}>
                  Logout
                </Button>

                <Button
                  mode="contained"
                  buttonColor="#EF4444"
                  onPress={handleDeleteAccount}
                  style={styles.profileButton}>
                  Delete Account
                </Button>
              </Surface>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({
          ios: 'padding',
          android: undefined,
        })}>
        <View style={styles.header}>
          <IconButton
            icon="menu"
            iconColor="#F9FAFB"
            size={26}
            onPress={() => setIsSidebarVisible(true)}
          />

          <View style={styles.headerCenter}>
            <Text variant="titleMedium" style={styles.appTitle}>
              Remember AI
            </Text>

            <Text style={styles.appSubtitle}>Ask. Remember. Remind.</Text>
          </View>

          <View style={styles.headerActions}>
            <IconButton
              icon="plus"
              iconColor="#F9FAFB"
              size={24}
              onPress={handleNewChat}
            />

            <IconButton
              icon="account-circle"
              iconColor="#F9FAFB"
              size={27}
              onPress={() => setIsProfileVisible(true)}
            />
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={activeThread.messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputWrapper}>
          <View style={styles.inputCard}>
            <TextInput
              mode="flat"
              value={message}
              onChangeText={setMessage}
              placeholder="Ask anything or say remind me..."
              multiline
              dense
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={styles.chatInput}
            />

            <IconButton
              icon="send"
              iconColor="#FFFFFF"
              containerColor="#8B5CF6"
              disabled={!message.trim()}
              onPress={handleSend}
            />
          </View>

          <Text style={styles.hintText}>
            AI and reminder backend will connect in the next backend step.
          </Text>
        </View>

        {renderSidebar()}
        {renderProfileModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow = ({label, value}: InfoRowProps) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    backgroundColor: '#070A12',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  appTitle: {
    color: '#F9FAFB',
    fontWeight: '800',
  },
  appSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  aiAvatarText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '900',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#E5E7EB',
  },

  inputWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: '#070A12',
  },
  inputCard: {
    minHeight: 56,
    maxHeight: 130,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#0B1020',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#F9FAFB',
    fontSize: 15,
  },
  hintText: {
    color: '#4B5563',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 8,
  },

  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sidebar: {
    width: '78%',
    maxWidth: 340,
    backgroundColor: '#080D18',
    paddingTop: 22,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#1F2937',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sidebarTitle: {
    flex: 1,
    color: '#F9FAFB',
    fontWeight: '800',
  },
  newChatButton: {
    borderRadius: 14,
    marginBottom: 16,
  },
  divider: {
    backgroundColor: '#1F2937',
    marginBottom: 12,
  },
  threadItem: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#111827',
  },
  activeThreadItem: {
    borderColor: '#8B5CF6',
    backgroundColor: '#111827',
  },
  threadTitle: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  activeThreadTitle: {
    color: '#FFFFFF',
  },
  threadDate: {
    color: '#6B7280',
    marginTop: 6,
    fontSize: 12,
  },

  profileModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  profilePanel: {
    maxHeight: '90%',
    backgroundColor: '#080D18',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#8B5CF6',
  },
  profileTitleBox: {
    marginLeft: 12,
    flex: 1,
  },
  profileTitle: {
    color: '#F9FAFB',
    fontWeight: '800',
  },
  profileSubtitle: {
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: '#0B1020',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sectionLabel: {
    color: '#9CA3AF',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 10,
  },
  profileInput: {
    marginBottom: 12,
  },
  profileButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  infoRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 3,
  },
  infoValue: {
    color: '#F9FAFB',
    fontWeight: '700',
    fontSize: 15,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  usageText: {
    color: '#D1D5DB',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    marginBottom: 12,
  },
});