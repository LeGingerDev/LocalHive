import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { createProfile } from '../lib/supabaseDb';
import { supabase } from '../lib/supabase';

const EmailSignup = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { signUp, signIn } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateInputs = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      setError(null);
      
      // Sign up with Supabase - with autoconfirm enabled
      const { data, error: signUpError } = await signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: 'exp://localhost:19000'
        }
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        try {
          // Create profile immediately
          await createProfile(data.user.id, {
            full_name: fullName,
            email: email,
          });
          
          // Sign in immediately after signup
          const { error: signInError } = await signIn({ 
            email, 
            password 
          }, true); // Always remember the user
          
          if (signInError) throw signInError;
          
          // Success! Show welcome message and redirect to main page
          showAlert(
            'Welcome to Local Hive!',
            'Your account has been created successfully.',
            [{ text: 'Get Started', onPress: () => router.replace('/') }]
          );
        } catch (error) {
          console.error('Error during auto-signin:', error);
          // If auto-signin fails, redirect to signin page
          showAlert(
            'Account Created',
            'Your account has been created, but we couldn\'t sign you in automatically. Please sign in manually.',
            [{ text: 'OK', onPress: () => router.push('/signin') }]
          );
        }
      }
    } catch (error) {
      setError(error.message || 'Failed to create account');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join Local Hive and start sharing knowledge
        </Text>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={[
              styles.input, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }
            ]}
            placeholder="Enter your full name"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={[
              styles.input, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }
            ]}
            placeholder="Enter your email"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={[
                styles.passwordInput, 
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }
              ]}
              placeholder="Create a password"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={22} 
                color="rgba(255, 255, 255, 0.6)" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.passwordHint}>
            Password must be at least 8 characters
          </Text>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signUpButton, { backgroundColor: Colors.primary }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.signUpButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/signin")}>
            <Text style={styles.signInLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </View>
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
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 6,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  termsLink: {
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  signUpButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInText: {
    fontSize: 14,
    color: 'white',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
});

export default EmailSignup; 