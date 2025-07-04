import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';

const SignIn = () => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Welcome back to Local Hive
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput 
            style={[
              styles.input, 
              { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Enter your email"
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <TextInput 
            style={[
              styles.input, 
              { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Enter your password"
            placeholderTextColor={theme.textTertiary}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.forgotPassword]}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.textSecondary }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.signInButton, { backgroundColor: Colors.primary }]}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: theme.textSecondary }]}>
            Don't have an account? 
          </Text>
          <TouchableOpacity onPress={() => router.push("/landing")}>
            <Text style={[styles.signUpLink, { color: Colors.primary }]}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  signInButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignIn; 