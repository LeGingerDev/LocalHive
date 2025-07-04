import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const EmailSignup = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Join Local Hive and start sharing knowledge
        </Text>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
          <TextInput 
            style={[
              styles.input, 
              { 
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Enter your full name"
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {/* Email Input */}
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
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={[
                styles.passwordInput, 
                { 
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              placeholder="Create a password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={22} 
                color={theme.textTertiary} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.passwordHint, { color: theme.textTertiary }]}>
            Password must be at least 8 characters
          </Text>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            By signing up, you agree to our{' '}
            <Text style={[styles.termsLink, { color: Colors.primary }]}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={[styles.termsLink, { color: Colors.primary }]}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signUpButton, { backgroundColor: Colors.primary }]}
        >
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInText, { color: theme.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/signin")}>
            <Text style={[styles.signInLink, { color: Colors.primary }]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 6,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '500',
  },
  signUpButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmailSignup; 