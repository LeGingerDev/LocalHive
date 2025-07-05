import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const ProfileBio = ({ 
  bio, 
  onBioChange, 
  onSave,
  isSaving = false
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editableBio, setEditableBio] = useState(bio);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, reset to original bio
      setEditableBio(bio);
    }
    setIsEditing(!isEditing);
  };
  
  const handleSave = () => {
    onBioChange(editableBio);
    if (onSave) {
      onSave();
    }
    setIsEditing(false);
  };
  
  return (
    <View style={[styles.section, { backgroundColor: theme.cardColor, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person-outline" size={20} color={theme.text} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bio</Text>
        
        {/* Edit button for bio */}
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEditToggle}
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
        <View style={styles.editContainer}>
          <TextInput
            style={[
              styles.bioInput,
              { 
                color: theme.text,
                backgroundColor: theme.inputBackground,
                borderColor: theme.border
              }
            ]}
            value={editableBio}
            onChangeText={setEditableBio}
            multiline
            numberOfLines={4}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.textTertiary}
          />
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: Colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[styles.bioText, { color: theme.textSecondary }]}>{bio}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  editContainer: {
    width: '100%',
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});

export default ProfileBio; 