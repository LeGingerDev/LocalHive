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
import { supabase } from '../../lib/supabase';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, isDarkMode, toggleTheme, useSystemTheme, toggleUseSystemTheme, updateThemeFromProfile } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isThemeSaving, setIsThemeSaving] = useState(false);
  
  // Profile data state
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || 'User',
    email: user?.email || 'user@example.com',
    joinDate: 'January 2023',
    location: 'San Francisco, CA',
    bio: 'Passionate about community building and local knowledge sharing.',
    interests: ['Technology', 'Community', 'Local Events', 'Sustainability'],
    groups: [
      { id: 1, name: 'Tech Enthusiasts', members: 128 },
      { id: 2, name: 'Neighborhood Watch', members: 56 },
      { id: 3, name: 'Local Foodies', members: 94 },
    ],
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
      
      // Update local profile state
      setProfile(prevProfile => ({
        ...prevProfile,
        bio: editableBio,
      }));
      
      // Exit edit mode
      setIsEditing(false);
      
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
  
  const handleEditGroup = (groupId) => {
    // Placeholder for future implementation
    showAlert(
      'Edit Group',
      `This will allow you to edit group ${groupId} in a future update.`,
      [{ text: 'OK' }]
    );
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
  
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const subTextColor = isDarkMode ? '#aaa' : '#666';
  const cardBg = isDarkMode ? '#2a2a2a' : '#fff';
  const borderColor = isDarkMode ? '#444' : '#e0e0e0';
  const inputBgColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  
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
        {/* Header with profile info */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textColor }]}>{profile.name}</Text>
            <Text style={[styles.profileEmail, { color: subTextColor }]}>{profile.email}</Text>
            <Text style={[styles.profileJoinDate, { color: subTextColor }]}>Joined {profile.joinDate}</Text>
          </View>
        </View>
        
        {/* Bio section */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={textColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Bio</Text>
            
            {/* Edit button for bio */}
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons 
                name={isEditing ? "close-outline" : "create-outline"} 
                size={20} 
                color={Colors.primary} 
              />
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isEditing ? (
            <TextInput
              style={[
                styles.bioInput,
                { 
                  color: textColor,
                  backgroundColor: inputBgColor,
                  borderColor: borderColor
                }
              ]}
              value={editableBio}
              onChangeText={setEditableBio}
              multiline
              numberOfLines={4}
              placeholder="Tell us about yourself..."
              placeholderTextColor={subTextColor}
            />
          ) : (
            <Text style={[styles.bioText, { color: subTextColor }]}>{profile.bio}</Text>
          )}
        </View>
        
        {/* Interests section */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={20} color={textColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Interests</Text>
          </View>
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Groups section */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={textColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>My Groups</Text>
          </View>
          {profile.groups.map((group) => (
            <View key={group.id} style={[styles.groupItem, { borderBottomColor: borderColor }]}>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: textColor }]}>{group.name}</Text>
                <Text style={[styles.groupMembers, { color: subTextColor }]}>{group.members} members</Text>
              </View>
              <Button 
                variant="text" 
                size="small" 
                onPress={() => handleEditGroup(group.id)}
              >
                Edit
              </Button>
            </View>
          ))}
        </View>
        
        {/* Settings section */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color={textColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Settings</Text>
          </View>
          
          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={textColor} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
            </View>
            {isThemeSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleTheme}
                trackColor={{ false: '#767577', true: Colors.primary }}
                thumbColor="#f4f3f4"
                disabled={isThemeSaving}
              />
            )}
          </View>
          
          {/* System Theme Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="phone-android" size={20} color={textColor} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Use System Theme</Text>
            </View>
            {isThemeSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Switch
                value={useSystemTheme}
                onValueChange={handleToggleSystemTheme}
                trackColor={{ false: '#767577', true: Colors.primary }}
                thumbColor="#f4f3f4"
                disabled={isThemeSaving}
              />
            )}
          </View>
        </View>
        
        {/* Save Profile Button */}
        <View style={styles.buttonContainer}>
          <Button 
            onPress={handleSaveProfile} 
            loading={isSaving}
            disabled={!isEditing && !isSaving}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profileJoinDate: {
    fontSize: 12,
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
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
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