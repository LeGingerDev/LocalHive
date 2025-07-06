import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/supabaseStorage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Get user profile data
export const fetchUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // Handle specific error cases
      if (error.code === 'PGRST116' || error.message.includes('contains 0 rows')) {
        return { exists: false, data: null, error: null };
      }
      return { exists: false, data: null, error };
    }
    
    return { exists: true, data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { exists: false, data: null, error };
  }
};

// Upload avatar image
export const uploadAvatar = async (userId, imageUri) => {
  try {
    if (!imageUri || !userId) {
      throw new Error('Missing required parameters');
    }
    
    // Get file info
    const fileExt = imageUri.split('.').pop();
    const filePath = `profiles/${userId}/avatar.${fileExt}`;
    
    // Check file size
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.size > 2000000) {
      return { 
        success: false, 
        error: new Error('Image too large (max 2MB)') 
      };
    }
    
    // Prepare file data
    let fileData = {
      uri: imageUri,
      name: `avatar.${fileExt}`,
      type: `image/${fileExt}`
    };
    
    // Upload file
    const uploadResult = await uploadFile(
      'profile-avatars',
      filePath,
      fileData
    );
    
    if (!uploadResult.success) {
      return uploadResult;
    }
    
    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: uploadResult.data.publicUrl })
      .eq('id', userId);
      
    if (updateError) {
      return { success: false, error: updateError };
    }
    
    return { 
      success: true, 
      data: { publicUrl: uploadResult.data.publicUrl } 
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false, error };
  }
};

// Update profile data
export const updateProfile = async (userId, profileData) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      });
      
    return { success: !error, error };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

// Create profile if it doesn't exist
export const createProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
      
    return { success: !error, data, error };
  } catch (error) {
    console.error('Error creating profile:', error);
    return { success: false, error };
  }
};

// Update theme preferences
export const updateThemePreferences = async (userId, isDarkMode, useSystemTheme) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        theme_preference: isDarkMode ? 'dark' : 'light',
        use_system_theme: useSystemTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
      
    return { success: !error, error };
  } catch (error) {
    console.error('Error updating theme preferences:', error);
    return { success: false, error };
  }
}; 