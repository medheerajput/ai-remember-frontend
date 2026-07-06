import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { sendConversationMessage } from '../../services/conversationApi';
import { fetchReminders } from '../../services/reminderApi';
import {
    cancelReminderNotification,
    syncReminderNotifications,
} from '../../services/localNotificationService';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    intent?: string | null;
    messageKind?: string | null;
    cardType?: string | null;
}

const EXAMPLE_CHIPS = [
    'Remember Bibhas is my college friend',
    'Remind me tomorrow at 8 AM',
    'Who borrowed money from me?',
];

const getCardLabel = (cardType?: string | null) => {
    switch (cardType) {
        case 'memory_saved':
            return 'Memory saved';

        case 'memory_updated':
            return 'Memory updated';

        case 'reminder_created':
            return 'Reminder created';

        case 'reminder_updated':
            return 'Reminder updated';

        case 'reminder_cancelled':
            return 'Reminder cancelled';

        case 'follow_up':
            return 'Need more info';

        case 'answer':
            return 'Answer';

        case 'technical_error':
            return 'Error';

        case 'small_talk':
            return null;

        default:
            return null;
    }
};
const ChatScreen = () => {
    const { user, getIdToken } = useAuth() as any;

    const listRef = useRef<FlatList<ChatMessage>>(null);

    const [conversationId, setConversationId] = useState<string>(
        `conv_${Date.now()}`,
    );
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const userName = useMemo(() => {
        return user?.displayName || user?.name || 'Dheeraj';
    }, [user]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return `Good morning, ${userName}`;
        }

        if (hour < 17) {
            return `Good afternoon, ${userName}`;
        }

        return `Good evening, ${userName}`;
    }, [userName]);

    const scrollToEnd = () => {
        setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleNewChat = () => {
        setConversationId(`conv_${Date.now()}`);
        setMessages([]);
        setInputText('');
    };

    const handleSend = async (customText?: string) => {
        const text = (customText ?? inputText).trim();

        if (!text || isSending) {
            return;
        }

        const userMessage: ChatMessage = {
            id: `local_user_${Date.now()}`,
            role: 'user',
            content: text,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsSending(true);
        scrollToEnd();

        try {
            const token = await getIdToken();

            const result = await sendConversationMessage(token, {
                conversationId,
                message: text,
                source: 'text',
            });
            if (
                result.cardType === 'reminder_created' ||
                result.cardType === 'reminder_updated'
            ) {
                const pendingReminders = await fetchReminders(token, 'pending');
                await syncReminderNotifications(pendingReminders);
            }

            if (result.cardType === 'reminder_cancelled' && result.reminderId) {
                await cancelReminderNotification(result.reminderId);
            }
            setConversationId(result.conversationId);

            const assistantMessage: ChatMessage = {
                id: `local_ai_${Date.now()}`,
                role: 'assistant',
                content: result.reply,
                intent: result.intent,
                messageKind: result.messageKind,
                cardType: result.cardType,
            };

            setMessages(prev => [...prev, assistantMessage]);
            scrollToEnd();
        } catch (error) {
            const fallbackMessage: ChatMessage = {
                id: `local_error_${Date.now()}`,
                role: 'assistant',
                content:
                    error instanceof Error
                        ? error.message
                        : 'Something went wrong. Please try again.',
                intent: 'error',
                cardType: 'technical_error',
            };

            setMessages(prev => [...prev, fallbackMessage]);
            scrollToEnd();
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        const cardLabel = getCardLabel(item.cardType);

        return (
            <View
                style={[
                    styles.messageRow,
                    isUser ? styles.userMessageRow : styles.aiMessageRow,
                ]}>
                <View
                    style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.aiBubble,
                    ]}>
                    {!isUser && cardLabel ? (
                        <Text style={styles.intentLabel}>{cardLabel}</Text>
                    ) : null}

                    <Text style={styles.messageText}>{item.content}</Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Tell me anything</Text>
                <Text style={styles.emptySubtitle}>
                    I’ll remember it, remind you, or help you find it later.
                </Text>

                <View style={styles.chipsContainer}>
                    {EXAMPLE_CHIPS.map(chip => (
                        <Pressable
                            key={chip}
                            style={styles.exampleChip}
                            onPress={() => handleSend(chip)}>
                            <Text style={styles.exampleChipText}>{chip}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{greeting}</Text>
                        <Text style={styles.subtitle}>What should I remember today?</Text>
                    </View>

                    <Pressable style={styles.newChatButton} onPress={handleNewChat}>
                        <Text style={styles.newChatText}>＋</Text>
                    </Pressable>
                </View>

                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={[
                        styles.chatList,
                        messages.length === 0 && styles.chatListEmpty,
                    ]}
                    ListEmptyComponent={renderEmptyState}
                    keyboardShouldPersistTaps="handled"
                />

                {isSending ? (
                    <View style={styles.typingRow}>
                        <ActivityIndicator size="small" color="#A78BFA" />
                        <Text style={styles.typingText}>Remember AI is thinking...</Text>
                    </View>
                ) : null}

                <View style={styles.inputContainer}>
                    <Pressable style={styles.inputIconButton}>
                        <Text style={styles.inputIcon}>＋</Text>
                    </Pressable>

                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask or tell me anything..."
                        placeholderTextColor="#6B7280"
                        style={styles.textInput}
                        multiline
                    />

                    <Pressable style={styles.inputIconButton}>
                        <Text style={styles.inputIcon}>🎙️</Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.sendButton,
                            !inputText.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isSending}>
                        <Text style={styles.sendButtonText}>➤</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;

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
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        color: '#F9FAFB',
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
    newChatButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    newChatText: {
        color: '#F9FAFB',
        fontSize: 26,
        lineHeight: 28,
    },
    chatList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    chatListEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyTitle: {
        color: '#F9FAFB',
        fontSize: 26,
        fontWeight: '800',
    },
    emptySubtitle: {
        color: '#9CA3AF',
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        marginTop: 8,
        marginBottom: 20,
    },
    chipsContainer: {
        gap: 10,
        width: '100%',
    },
    exampleChip: {
        backgroundColor: '#0B1020',
        borderWidth: 1,
        borderColor: '#1F2937',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
    },
    exampleChipText: {
        color: '#D1D5DB',
        fontSize: 14,
        textAlign: 'center',
    },
    messageRow: {
        marginVertical: 6,
        flexDirection: 'row',
    },
    userMessageRow: {
        justifyContent: 'flex-end',
    },
    aiMessageRow: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '82%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: '#7C3AED',
        borderTopRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#111827',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    intentLabel: {
        color: '#A78BFA',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    messageText: {
        color: '#F9FAFB',
        fontSize: 15,
        lineHeight: 21,
    },
    typingRow: {
        paddingHorizontal: 18,
        paddingBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typingText: {
        color: '#9CA3AF',
        fontSize: 13,
    },
    inputContainer: {
        marginHorizontal: 12,
        marginBottom: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: '#0B1020',
        borderWidth: 1,
        borderColor: '#1F2937',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    inputIconButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputIcon: {
        color: '#F9FAFB',
        fontSize: 16,
    },
    textInput: {
        flex: 1,
        maxHeight: 120,
        color: '#F9FAFB',
        fontSize: 15,
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#374151',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
});