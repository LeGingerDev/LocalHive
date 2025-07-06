import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Upload a file to storage
export const uploadFile = async (bucketName, filePath, fileData, options = {}) => {
  try {
    let uploadData = fileData;
    
    // Handle React Native file object
    if (Platform.OS !== 'web' && fileData && fileData.uri) {
      try {
        console.log('Handling React Native file upload...');
        
        // Get the Supabase URL and key for direct API access
        const supabaseUrl = supabase.supabaseUrl;
        const supabaseKey = supabase.supabaseKey;
        
        // Create FormData for direct upload
        const formData = new FormData();
        formData.append('file', fileData);
        
        // Make a direct request to the Supabase REST API
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'x-upsert': 'true',
            },
            body: formData
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Direct upload error:', errorData);
          return { success: false, error: errorData };
        }
        
        console.log('Direct upload successful');
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
          
        return { 
          success: true, 
          data: { 
            publicUrl: publicUrlData.publicUrl 
          } 
        };
      } catch (directUploadError) {
        console.error('Error in direct upload:', directUploadError);
        return { success: false, error: directUploadError };
      }
    } else {
      // For web or blob data, use the standard Supabase client
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, uploadData, {
          cacheControl: '3600',
          upsert: true,
          ...options
        });
        
      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error };
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      return { 
        success: true, 
        data: { 
          ...data,
          publicUrl: publicUrlData.publicUrl 
        } 
      };
    }
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return { success: false, error };
  }
}; 