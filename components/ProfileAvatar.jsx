import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import * as FileSystem from 'expo-file-system';
import { uploadAvatar } from '../services/profileService';

const ProfileAvatar = ({ size = 100, editable = true, avatarUrl, onAvatarChange }) => {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  useEffect(() => {
    if (avatarUrl) {
      // Add cache busting parameter to the URL
      const url = avatarUrl.includes('?') 
        ? `${avatarUrl}&cache=${cacheBuster}` 
        : `${avatarUrl}?cache=${cacheBuster}`;
      setImageUrl(url);
    }
  }, [avatarUrl, cacheBuster]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
        return;
      }

      // Launch image picker with reduced quality
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // Very low quality to reduce file size
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      console.log('Starting image upload process...');

      // Use the service to upload the avatar
      const result = await uploadAvatar(user.id, uri);
      
      if (!result.success) {
        console.error('Upload failed:', result.error);
        throw new Error('Failed to upload image');
      }
      
      const publicUrl = result.data.publicUrl;
      console.log('Public URL:', publicUrl);
      
      // Update cache buster to force image refresh
      setCacheBuster(Date.now());
      
      // Add cache busting parameter to the URL
      const cachedUrl = publicUrl.includes('?') 
        ? `${publicUrl}&cache=${Date.now()}` 
        : `${publicUrl}?cache=${Date.now()}`;
      
      setImageUrl(cachedUrl);
      
      if (onAvatarChange) onAvatarChange(publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 }
          ]}
          resizeMode="cover"
          // Disable caching
          cachePolicy="reload"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              backgroundColor: isDarkMode ? Colors.dark.cardColor : Colors.light.cardColor
            }
          ]}
        >
          <Ionicons 
            name="person" 
            size={size * 0.5} 
            color={isDarkMode ? Colors.dark.textSecondary : Colors.light.textSecondary} 
          />
        </View>
      )}

      {editable && (
        <TouchableOpacity
          style={[
            styles.editButton,
            { 
              bottom: 0, 
              right: 0,
              backgroundColor: Colors.primary
            }
          ]}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="camera" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

export default ProfileAvatar; 