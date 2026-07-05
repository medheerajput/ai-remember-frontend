import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {Button, Text} from 'react-native-paper';

import {useAuth} from '../../context/AuthContext';

const LoginScreen = () => {
  const {continueWithGoogle} = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await continueWithGoogle();
    } catch (error: any) {
      Alert.alert(
        'Google login failed',
        error?.message ?? 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>AI</Text>
        </View>

        <Text variant="headlineLarge" style={styles.title}>
          Remember AI
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Remember anything. Get reminded. Ask later.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>✓ 14-day free trial</Text>
          <Text style={styles.infoText}>✓ 300 AI requests/month</Text>
          <Text style={styles.infoText}>✓ Cloud sync across devices</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleGoogleLogin}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.googleButton}
          labelStyle={styles.googleButtonLabel}>
          Continue with Google
        </Button>

        <Text style={styles.termsText}>
          By continuing, your secure profile will be created automatically.
        </Text>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    justifyContent: 'center',
    padding: 20,
  },
  heroCard: {
    backgroundColor: '#0B1020',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    color: '#F9FAFB',
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  infoText: {
    color: '#D1D5DB',
    marginBottom: 8,
    fontSize: 15,
  },
  googleButton: {
    borderRadius: 14,
    paddingVertical: 4,
  },
  googleButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
  },
});