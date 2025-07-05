import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, isDarkMode, toggleTheme, useSystemTheme, toggleUseSystemTheme } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  
  // Mock data
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
  
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const subTextColor = isDarkMode ? '#aaa' : '#666';
  const cardBg = isDarkMode ? '#2a2a2a' : '#fff';
  const borderColor = isDarkMode ? '#444' : '#e0e0e0';
  
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
          </View>
          <Text style={[styles.bioText, { color: subTextColor }]}>{profile.bio}</Text>
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
              <Text style={[styles.groupName, { color: textColor }]}>{group.name}</Text>
              <Text style={[styles.groupMembers, { color: subTextColor }]}>{group.members} members</Text>
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
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: Colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          {/* System Theme Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialIcons name="phone-android" size={20} color={textColor} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Use System Theme</Text>
            </View>
            <Switch
              value={useSystemTheme}
              onValueChange={toggleUseSystemTheme}
              trackColor={{ false: '#767577', true: Colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>
        
        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#ff6b6b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 