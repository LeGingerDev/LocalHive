import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import ThemedView from '../../components/ThemedView';

const GroupsScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <Text style={styles.text}>Groups Screen</Text>
    </ThemedView>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 