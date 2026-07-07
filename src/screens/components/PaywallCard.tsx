import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface PaywallCardProps {
  priceInr: number;
  trialDays?: number;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onUpgrade: () => void;
  onRestore?: () => void;
}

const PaywallCard = ({
  priceInr,
  trialDays = 14,
  title = 'Continue using Remember AI',
  subtitle = 'Remember anything, get reminded, and ask later.',
  buttonText = `Start ₹${priceInr}/month`,
  onUpgrade,
  onRestore,
}: PaywallCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{trialDays}-day free trial</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{priceInr}</Text>
        <Text style={styles.period}>/ month</Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.feature}>✓ Remember anything</Text>
        <Text style={styles.feature}>✓ Reminder alarms</Text>
        <Text style={styles.feature}>✓ Ask AI from saved memories</Text>
        <Text style={styles.feature}>✓ Cloud sync across devices</Text>
      </View>

      <Pressable style={styles.upgradeButton} onPress={onUpgrade}>
        <Text style={styles.upgradeText}>{buttonText}</Text>
      </Pressable>

      {onRestore ? (
        <Pressable style={styles.restoreButton} onPress={onRestore}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </Pressable>
      ) : null}

      <Text style={styles.footerText}>
        Cancel anytime from Google Play. No yearly plan.
      </Text>
    </View>
  );
};

export default PaywallCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B1020',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#312E81',
    padding: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F1637',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  period: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  features: {
    marginTop: 18,
    gap: 9,
  },
  feature: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '800',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});