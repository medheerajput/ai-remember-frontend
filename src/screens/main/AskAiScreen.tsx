import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';

const AskAiScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Ask anything you saved
      </Text>

      <TextInput
        mode="outlined"
        placeholder="Example: Where is my passport?"
        style={styles.input}
      />

      <Button mode="contained" style={styles.button}>
        Ask AI
      </Button>
    </View>
  );
};

export default AskAiScreen;

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
  input: {
    marginBottom: 14,
  },
  button: {
    borderRadius: 12,
  },
});