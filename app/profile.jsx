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

const Profile = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, ensureProfile } = useAuth();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

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
                <ThemeToggle />
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
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>Back</Text>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
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
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  bioInput: {
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  settingsSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  updateButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 16,
  },
});

export default Profile; 