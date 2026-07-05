import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remember AI</Text>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default SplashScreen;