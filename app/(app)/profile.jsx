import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, ActivityIndicator, Alert, Switch, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import Button from '../../components/Button';
import ProfileStats from '../../components/ProfileStats';
import PersonalCode from '../../components/PersonalCode';
import ProfileBanner from '../../components/ProfileBanner';
import ProfileBio from '../../components/ProfileBio';
import ProSubscriptionCard from '../../components/ProSubscriptionCard';
import SettingsSection from '../../components/SettingsSection';
import { supabase } from '../../lib/supabase';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, isDarkMode, toggleTheme, useSystemTheme, toggleUseSystemTheme, updateThemeFromProfile } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isThemeSaving, setIsThemeSaving] = useState(false);
  
  // Profile data state
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || 'User',
    email: user?.email || 'user@example.com',
    joinDate: 'January 2023',
    location: 'San Francisco, CA',
    bio: 'Passionate about community building and local knowledge sharing.',
    stats: {
      itemsAdded: 23,
      searches: 47
    },
    personalCode: 'HIVE-SJ47',
    avatar_url: null
  });
  
  // Editable bio state
  const [editableBio, setEditableBio] = useState(profile.bio);
  
  // Fetch profile data from Supabase on component mount
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        
        // If the error is that the table doesn't exist or no rows were found
        if (error.code === 'PGRST116' || error.message.includes('contains 0 rows') || 
            error.code === '42P01' || error.message.includes('does not exist')) {
          
          // Create a new profile
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: user?.user_metadata?.full_name || 'User',
              email: user?.email,
              bio: profile.bio,
              location: profile.location,
              theme_preference: isDarkMode ? 'dark' : 'light',
              use_system_theme: useSystemTheme,
              created_at: new Date().toISOString(),
            })
            .select();
          
          if (createError) {
            console.error('Error creating profile:', createError);
          } else if (newProfile) {
            console.log('New profile created:', newProfile);
          }
        }
        
        return;
      }
      
      if (data) {
        // Update profile with data from Supabase
        setProfile(prevProfile => ({
          ...prevProfile,
          name: user?.user_metadata?.full_name || data.full_name || 'User',
          bio: data.bio || prevProfile.bio,
          joinDate: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          }),
          location: data.location || prevProfile.location,
          avatar_url: data.avatar_url
        }));
        
        // Update editable bio
        setEditableBio(data.bio || profile.bio);
        
        // Update theme from profile data
        updateThemeFromProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
              router.replace('/(auth)/landing');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          bio: editableBio,
          theme_preference: isDarkMode ? 'dark' : 'light',
          use_system_theme: useSystemTheme,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        throw error;
      }
      
      showAlert(
        'Success',
        'Profile saved successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert(
        'Error',
        'Failed to save profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle dark mode toggle with direct save to profile
  const handleToggleTheme = async () => {
    try {
      setIsThemeSaving(true);
      
      // Toggle theme in context (this already saves to AsyncStorage)
      toggleTheme();
      
      // Save directly to profile if user is logged in
      if (user) {
        const newTheme = !isDarkMode ? 'dark' : 'light';
        
        const { error } = await supabase
          .from('profiles')
          .update({
            theme_preference: newTheme,
            use_system_theme: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating theme preference in profile:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
    } finally {
      setIsThemeSaving(false);
    }
  };
  
  // Handle system theme toggle with direct save to profile
  const handleToggleSystemTheme = async () => {
    try {
      setIsThemeSaving(true);
      
      // Toggle system theme in context (this already saves to AsyncStorage)
      toggleUseSystemTheme();
      
      // Save directly to profile if user is logged in
      if (user) {
        const newUseSystemTheme = !useSystemTheme;
        const currentTheme = isDarkMode ? 'dark' : 'light';
        
        const { error } = await supabase
          .from('profiles')
          .update({
            theme_preference: currentTheme,
            use_system_theme: newUseSystemTheme,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating system theme preference in profile:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling system theme:', error);
    } finally {
      setIsThemeSaving(false);
    }
  };
  
  const handleUpgradeToPro = () => {
    showAlert(
      'Upgrade to Pro',
      'This feature will be available soon. Stay tuned!',
      [{ text: 'OK' }]
    );
  };
  
  const handleAvatarChange = (url) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      avatar_url: url
    }));
  };
  
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Profile Banner */}
        <ProfileBanner 
          user={{
            name: profile.name,
            email: profile.email
          }}
          avatarUrl={profile.avatar_url}
          onAvatarChange={handleAvatarChange}
        />
        
        {/* User Activity Stats */}
        <ProfileStats 
          stats={{
            groups: 0,
            itemsAdded: profile.stats.itemsAdded,
            searches: profile.stats.searches,
          }}
        />
        
        {/* Personal Code */}
        <PersonalCode code={profile.personalCode} />
        
        {/* Pro Subscription Card */}
        <ProSubscriptionCard 
          daysLeft={5}
          onUpgrade={handleUpgradeToPro}
        />
        
        {/* Bio section */}
        <ProfileBio 
          bio={profile.bio}
          onBioChange={(newBio) => {
            setEditableBio(newBio);
            setProfile(prev => ({ ...prev, bio: newBio }));
          }}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />
        
        {/* Settings section */}
        <SettingsSection 
          onToggleTheme={handleToggleTheme}
          onToggleSystemTheme={handleToggleSystemTheme}
          isSaving={isThemeSaving}
        />
        
        {/* Save Profile Button */}
        <View style={styles.buttonContainer}>
          <Button 
            onPress={handleSaveProfile} 
            loading={isSaving}
            disabled={isSaving}
            fullWidth
          >
            Save Profile
          </Button>
        </View>
        
        {/* Sign Out Button */}
        <View style={styles.buttonContainer}>
          <Button 
            variant="danger"
            onPress={handleSignOut}
            fullWidth
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
      
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bioInput: {
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 100,
  },

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
});

export default ProfileScreen; 