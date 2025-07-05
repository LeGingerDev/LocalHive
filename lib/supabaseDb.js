import { supabase } from './supabase';

// User profiles
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Handle the case where no profile is found
    if (error) {
      // If the error is that no rows were returned, return null instead of throwing
      if (error.code === 'PGRST116' || error.message.includes('contains 0 rows')) {
        console.log('No profile found for user:', userId);
        return null;
      }
      // For other errors, throw normally
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};

// Function to create a new profile after signup
export const createProfile = async (userId, profileData) => {
  try {
    // First check if the profiles table exists
    const { error: tableCheckError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // If table doesn't exist or there's an RLS error, log it but don't throw
    if (tableCheckError) {
      console.warn('Table check error:', tableCheckError.message);
      // Return gracefully instead of throwing - we'll handle profile creation later
      return null;
    }
    
    // Attempt to create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          ...profileData,
          created_at: new Date(),
        },
      ]);
    
    if (error) {
      // If it's an RLS policy error, log it but don't throw
      if (error.code === '42501' || error.message.includes('row-level security')) {
        console.warn('RLS policy error:', error.message);
        return null;
      }
      // For other errors, throw normally
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

// Environment-specific functions
export const getEnvironment = () => {
  // You can determine environment based on your app configuration
  // For example, you might use a configuration variable or check the URL
  // This is a placeholder implementation
  return process.env.NODE_ENV || 'development';
};

// Get the appropriate database URL based on environment
export const getDatabaseUrl = () => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return 'https://xnnobyeytyycngybinqj.supabase.co'; // Production
    case 'test':
      return 'https://xnnobyeytyycngybinqj.supabase.co'; // Test environment
    default:
      return 'https://xnnobyeytyycngybinqj.supabase.co'; // Development
  }
}; 