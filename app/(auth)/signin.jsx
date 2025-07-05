import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';

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
        throw error;
      }
      
      // Show a message about the Remember Me setting
      if (!rememberMe) {
        showAlert(
          'Session Notice',
          'You\'ve chosen not to be remembered. You\'ll need to sign in again when you restart the app.',
          [{ text: 'OK', onPress: () => {
            console.log('Navigating to home after remember me notice');
            router.replace('/(app)');
          }}]
        );
      } else {
        // Navigate directly to home screen on successful sign in
        console.log('Sign in successful, navigating to home');
        // Use a small delay to ensure auth state is updated
        setTimeout(() => {
          router.replace('/(app)');
        }, 100);
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
      console.error('Sign in error:', error);
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          Welcome back to Local Hive
        </Text>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.formContainer}>
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
          </View>

          <Button 
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
            style={styles.signInButton}
            fullWidth
          >
            Sign In
          </Button>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              Don't have an account? 
            </Text>
            <TouchableOpacity onPress={() => router.push("email-signup")}>
              <Text style={styles.signUpLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  formContainer: {
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 13,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  infoButton: {
    marginLeft: 6,
    padding: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    color: 'white',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  signInButton: {
    marginTop: 10,
    marginHorizontal: 0,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    color: 'white',
    fontSize: 14,
  },
  signUpLink: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignIn; 