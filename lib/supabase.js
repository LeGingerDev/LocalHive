import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabaseUrl } from './supabaseDb';

// Create a custom storage implementation that respects the remember me setting
const createCustomStorage = () => {
  // Get the base AsyncStorage implementation
  const asyncStorage = AsyncStorage;
  
  return {
    async getItem(key) {
      try {
        const value = await asyncStorage.getItem(key);
        return value;
      } catch (error) {
        console.error('Error getting item from storage:', error);
        return null;
      }
    },
    async setItem(key, value) {
      try {
        await asyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting item in storage:', error);
      }
    },
    async removeItem(key) {
      try {
        await asyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from storage:', error);
      }
    }
  };
};

// Supabase configuration
// In a production app, you would use environment variables
// For this example, we're using the values directly
const supabaseUrl = 'https://xnnobyeytyycngybinqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhubm9ieWV5dHl5Y25neWJpbnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjEyMDQsImV4cCI6MjA2NzIzNzIwNH0.bBO9iuzsMU1xUq_EJAi6esjWb0Jm1Arj2mQfXXqIEKw';

// Create the Supabase client with custom storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 