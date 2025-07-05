import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemedView from '../components/ThemedView';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const SignIn = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Pass the rememberMe option to the signIn function
      const { error, data } = await signIn({ 
        email, 
        password,
      }, rememberMe);
      
      if (error) {
        // Check if the error is about email not being confirmed
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('Email link is invalid or has expired')) {
          showAlert(
            'Email Not Verified',
            'Would you like to resend the verification email?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Resend', onPress: () => handleResendVerification() }
            ]
          );
          throw new Error('Email not verified. Please check your inbox or resend verification.');
        }
        throw error;
      }
      
      // Show a message about the Remember Me setting
      if (!rememberMe) {
        showAlert(
          'Session Notice',
          'You\'ve chosen not to be remembered. You\'ll need to sign in again when you restart the app.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      } else {
        // Navigate to home screen on successful sign in
        router.replace('/');
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      showAlert('Verification Email Sent', 'Please check your inbox for the verification link');
    } catch (error) {
      setError(error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      showAlert('Password Reset', 'Check your email for password reset instructions');
    } catch (error) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Show info about Remember Me
  const handleShowRememberMeInfo = () => {
    showAlert(
      'Remember Me',
      'When enabled, you will stay signed in when you close and reopen the app. When disabled, you will need to sign in each time you open the app.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Welcome back to Local Hive
        </Text>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

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
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

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
              placeholder="Enter your password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry={!showPassword}
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
                color={theme.textTertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rememberMeContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: theme.border, true: Colors.primary }}
            thumbColor={rememberMe ? Colors.primaryLight : '#f4f3f4'}
          />
          <Text 
            style={[styles.rememberMeText, { color: theme.textSecondary }]}
            onPress={() => setRememberMe(!rememberMe)}
          >
            Remember me
          </Text>
          <TouchableOpacity
            onPress={handleShowRememberMeInfo}
            style={styles.infoButton}
          >
            <Ionicons name="information-circle-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.forgotPassword]}
            onPress={handleForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.textSecondary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.resendVerification]}
            onPress={handleResendVerification}
          >
            <Text style={[styles.resendVerificationText, { color: Colors.primary }]}>
              Resend Verification
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.signInButton, { backgroundColor: Colors.primary }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
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
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
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
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  forgotPassword: {
    // alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  resendVerification: {
    // alignSelf: 'flex-end',
  },
  resendVerificationText: {
    fontSize: 14,
    fontWeight: '500',
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
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
  infoButton: {
    marginLeft: 8,
  },
});

export default SignIn; 