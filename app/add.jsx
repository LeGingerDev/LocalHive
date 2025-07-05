import React from 'react';
import { StyleSheet, Text } from 'react-native';
import ThemedView from '../components/ThemedView';
import ProtectedRoute from '../components/ProtectedRoute';

const Add = () => {
  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        <Text style={styles.title}>Add Content</Text>
        <Text style={styles.subtitle}>Share knowledge with your community</Text>
      </ThemedView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default Add; 