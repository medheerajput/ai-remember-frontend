import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Text, TextInput} from 'react-native-paper';

const RememberScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        What should I remember?
      </Text>

      <TextInput
        mode="outlined"
        multiline
        placeholder="Example: My passport is in the blue bag."
        style={styles.input}
      />

      <Button mode="contained" style={styles.button}>
        Save Memory
      </Button>

      <Button mode="outlined" style={styles.button}>
        Add Reminder
      </Button>
    </View>
  );
};

export default RememberScreen;

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
    minHeight: 160,
  },
  button: {
    marginTop: 14,
    borderRadius: 12,
  },
});