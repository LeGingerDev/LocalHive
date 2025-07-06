import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import ProfileAvatar from './ProfileAvatar';
import ProfileName from './ProfileName';

const ProfileBanner = ({ user, avatarUrl, onAvatarChange, onNameChange, isSavingName }) => {
  const { theme, isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(user.name);

  const handleNameChange = (newName) => {
    setEditableName(newName);
  };

  const handleEditingChange = (editing) => {
    setIsEditing(editing);
  };

  const handleSave = () => {
    onNameChange(editableName);
  };

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
        <ProfileName
          name={user.name}
          onNameChange={handleNameChange}
          onEditingChange={handleEditingChange}
        />
        <Text 
          style={[
            styles.email,
            { color: theme.textSecondary }
          ]}
        >
          {user.email}
        </Text>
        
        {isEditing && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: Colors.primary }]}
              onPress={handleSave}
              disabled={isSavingName}
            >
              <Text style={styles.saveButtonText}>
                {isSavingName ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    marginBottom: 24,
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
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default ProfileBanner; 