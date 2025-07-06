import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import ProfileAvatar from './ProfileAvatar';

const ProfileBanner = ({ user, avatarUrl, onAvatarChange }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.banner, 
      { 
        backgroundColor: theme.cardColor,
        borderColor: theme.border,
      }
    ]}>
      <View style={styles.avatarContainer}>
        <ProfileAvatar 
          size={80} 
          avatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
        />
      </View>
      <View style={styles.userInfo}>
        <Text 
          style={[
            styles.name, 
            { color: theme.text }
          ]}
        >
          {user.name}
        </Text>
        <Text 
          style={[
            styles.email,
            { color: theme.textSecondary }
          ]}
        >
          {user.email}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 15,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
});

export default ProfileBanner; 