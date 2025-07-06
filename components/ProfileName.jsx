import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const ProfileName = ({ 
  name, 
  onNameChange,
  onEditingChange,
  isSaving = false
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(name);
  
  // Update editableName when name prop changes
  useEffect(() => {
    setEditableName(name);
  }, [name]);
  
  // Notify parent component when editing state changes
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(isEditing);
    }
  }, [isEditing, onEditingChange]);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, reset to original name
      setEditableName(name);
    }
    setIsEditing(!isEditing);
  };
  
  const handleNameChange = (text) => {
    setEditableName(text);
    // Pass the updated name to parent component
    onNameChange(text);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.nameContainer}>
        <View style={styles.nameWrapper}>
          {isEditing ? (
            <TextInput
              style={[
                styles.nameInput,
                { 
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border
                }
              ]}
              value={editableName}
              onChangeText={handleNameChange}
              placeholder="Enter your name"
              placeholderTextColor={theme.textTertiary}
              autoFocus
              maxLength={50}
            />
          ) : (
            <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
          )}
        </View>
        
        {/* Edit button for name */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameWrapper: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
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
});

export default ProfileName; 