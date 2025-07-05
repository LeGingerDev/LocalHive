import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemedView from '../components/ThemedView';
import ProtectedRoute from '../components/ProtectedRoute';
import CustomAlert from '../components/CustomAlert';
import ThemeToggle from '../components/ThemeToggle';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { Colors } from '../constants/Colors';
import { getUserProfile, updateUserProfile, createProfile } from '../lib/supabaseDb';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const router = useRouter();
  const { theme, isDarkMode, useSystemTheme } = useTheme();
  const { user, ensureProfile, signOut } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('Profile rendering with theme:', { isDarkMode, useSystemTheme });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get the profile
      let profileData = await getUserProfile(user.id).catch(err => {
        console.warn('Error fetching profile:', err);
        return null;
      });
      
      // If no profile exists, try to create one
      if (!profileData) {
        console.log('No profile found, attempting to create one');
        try {
          await ensureProfile(user);
          // Try to fetch again after creation
          profileData = await getUserProfile(user.id).catch(() => null);
        } catch (err) {
          console.warn('Failed to create profile:', err);
          // Continue anyway - we'll create it when they update
        }
      }
      
      console.log('Fetched profile data:', profileData);
      setProfile(profileData || null);
      setFullName(profileData?.full_name || user?.user_metadata?.full_name || '');
      setBio(profileData?.bio || '');
    } catch (error) {
      console.error('Error in profile flow:', error);
      setError('Failed to load profile. You can still update your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      setError(null);
      
      // Check if profile exists first
      let profileData = profile;
      
      if (!profileData) {
        // Create profile if it doesn't exist
        await createProfile(user.id, {
          full_name: fullName,
          email: user.email,
          bio: bio,
        });
      } else {
        // Update existing profile
        await updateUserProfile(user.id, {
          full_name: fullName,
          bio: bio,
          updated_at: new Date(),
        });
      }
      
      showAlert('Success', 'Profile updated successfully');
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Test function to directly update theme preference
  const testThemeUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);
      
      console.log('Testing direct theme update to Supabase...');
      
      // Direct update using Supabase client
      const { data, error } = await supabase
        .from('profiles')
        .update({
          theme_preference: isDarkMode ? 'dark' : 'light',
          use_system_theme: useSystemTheme
        })
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error('Direct Supabase update error:', error);
        setError('Failed to update theme preference: ' + error.message);
      } else {
        console.log('Direct update successful:', data);
        showAlert('Success', 'Theme preference updated directly');
      }
    } catch (error) {
      console.error('Error in direct theme update:', error);
      setError('Failed to update theme preference');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/landing');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  return (
    <ProtectedRoute>
      <ThemedView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>Your Profile</Text>
            
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
                value={user?.email || ''}
                editable={false}
              />
            </View>
            
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
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Bio</Text>
              <TextInput
                style={[
                  styles.bioInput,
                  { 
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={theme.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
              
              <View style={[styles.settingItem, { borderColor: theme.border }]}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  Appearance {isDarkMode ? '(Dark)' : '(Light)'} 
                  {useSystemTheme ? ' - System' : ' - Manual'}
                </Text>
                <ThemeToggle 
                  showLabel={false} 
                  showSystemOption={true} 
                  style={styles.themeToggle} 
                />
                
                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: Colors.secondary }]}
                  onPress={testThemeUpdate}
                  disabled={updating}
                >
                  <Text style={styles.testButtonText}>Test Theme Update</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: Colors.primary }]}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.updateButtonText}>Update Profile</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: Colors.secondary }]}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      </ThemedView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 90, // Add extra padding for the tab bar
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  settingsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  themeToggle: {
    alignSelf: 'flex-start',
  },
  updateButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default Profile; 