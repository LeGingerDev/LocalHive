import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import ThemedView from '../../components/ThemedView';

const SearchScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <Text style={styles.text}>Search Screen</Text>
    </ThemedView>
  );
};

export default SearchScreen;

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