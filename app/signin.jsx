import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          Welcome back to Local Hive
        </Text>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

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
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

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
              placeholder="Enter your password"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
                color="rgba(255, 255, 255, 0.6)" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rememberMeContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: Colors.primary }}
            thumbColor={rememberMe ? Colors.primaryLight : '#f4f3f4'}
          />
          <Text 
            style={styles.rememberMeText}
            onPress={() => setRememberMe(!rememberMe)}
          >
            Remember me
          </Text>
          <TouchableOpacity
            onPress={handleShowRememberMeInfo}
            style={styles.infoButton}
          >
            <Ionicons name="information-circle-outline" size={18} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resendVerification}
            onPress={handleResendVerification}
          >
            <Text style={styles.resendVerificationText}>
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
          <Text style={styles.signUpText}>
            Don't have an account? 
          </Text>
          <TouchableOpacity onPress={() => router.push("/landing")}>
            <Text style={styles.signUpLink}> Sign Up</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'white',
  },
  infoButton: {
    marginLeft: 6,
    padding: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resendVerification: {
    padding: 4,
  },
  resendVerificationText: {
    fontSize: 14,
    color: Colors.primaryLight,
  },
  signInButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: 'white',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
});

export default SignIn; 