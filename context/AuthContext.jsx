import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { createProfile, getUserProfile } from '../lib/supabaseDb';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

// Key for storing session persistence preference
const REMEMBER_ME_KEY = 'auth_remember_me';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  // Initialize remember me preference
  useEffect(() => {
    const initializeRememberMe = async () => {
      try {
        // Check if the remember me preference is already set
        const value = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        
        if (value === null) {
          // If not set, initialize it to true (default)
          await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
          console.log('Remember me preference initialized to true');
        } else {
          // Use the existing preference
          setRememberMe(value !== 'false');
          console.log('Remember me preference loaded:', value !== 'false');
        }
      } catch (e) {
        console.error('Failed to initialize remember me preference:', e);
      }
    };

    initializeRememberMe();
  }, []);

  // Check if profile exists and create if it doesn't
  const ensureProfile = async (user) => {
    if (!user) return;
    
    try {
      // Try to get the user's profile
      const profile = await getUserProfile(user.id);
      
      // If profile doesn't exist, create one
      if (!profile) {
        console.log('Creating profile for user:', user.id);
        try {
          await createProfile(user.id, {
            full_name: user.user_metadata?.full_name || '',
            email: user.email,
          });
          console.log('Profile created successfully');
        } catch (createError) {
          console.error('Error creating profile:', createError);
          // Continue execution even if profile creation fails
          // We'll try again next time the user signs in
        }
      } else {
        console.log('Profile already exists for user:', user.id);
      }
      return profile;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  };

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      // First load the remember me preference
      let shouldRemember = true; // Default to true
      try {
        const value = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        // Only if explicitly set to false, don't remember
        shouldRemember = value !== 'false';
        console.log('Remember me preference loaded:', shouldRemember);
      } catch (e) {
        console.error('Failed to load remember me preference:', e);
      }
      
      // Make sure the rememberMe state is in sync with storage
      setRememberMe(shouldRemember);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check:', session ? 'Session found' : 'No session');
      
      // If we have a session and remember me is not explicitly disabled, use it
      if (session && shouldRemember) {
        console.log('Using stored session');
        setSession(session);
        setUser(session?.user || null);
        
        // If user is signed in, ensure they have a profile
        if (session?.user) {
          await ensureProfile(session.user);
        }
      } else if (session && !shouldRemember) {
        // If remember me is disabled and we have a session, sign out to clear it
        console.log('Remember me disabled - clearing session');
        setSession(null);
        setUser(null);
        // Sign out without triggering the full sign out flow
        await supabase.auth.signOut();
      } else {
        // No session
        console.log('No session found or session expired');
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          } else if (session) {
            setSession(session);
            setUser(session?.user || null);
            
            // If this is a sign-in event, ensure the user has a profile
            if (event === 'SIGNED_IN' && session?.user) {
              await ensureProfile(session.user);
            }
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    };

    checkSession();
  }, []);

  // Custom sign-in function that ensures profile exists
  const handleSignIn = async (credentials, remember = true) => {
    try {
      console.log('Sign in with remember me:', remember);
      
      // Save the remember me preference
      await AsyncStorage.setItem(REMEMBER_ME_KEY, remember.toString());
      setRememberMe(remember);
      
      // If remember me is disabled, first clear any existing sessions
      if (!remember) {
        console.log('Remember me disabled - clearing existing sessions');
        // Clear any existing auth data
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => key.startsWith('supabase.auth'));
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
          console.log('Cleared existing auth data:', authKeys.length, 'items');
        }
      }
      
      // Set session persistence based on remember me preference
      const sessionOptions = {
        persistSession: remember
      };
      
      console.log('Signing in with options:', sessionOptions);
      const response = await supabase.auth.signInWithPassword({
        ...credentials,
        options: sessionOptions
      });
      
      if (response.error) {
        console.error('Sign in error:', response.error);
      } else {
        console.log('Sign in successful');
        if (response.data?.user) {
          await ensureProfile(response.data.user);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  // Custom sign-out function that clears session if remember me is disabled
  const handleSignOut = async () => {
    try {
      // Get current remember me preference before signing out
      const shouldRemember = rememberMe;
      
      // Always sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // If remember me is disabled, make sure to clear any stored data
      if (!shouldRemember) {
        try {
          // Clear any Supabase auth-related data from AsyncStorage
          const keys = await AsyncStorage.getAllKeys();
          const authKeys = keys.filter(key => key.startsWith('supabase.auth'));
          if (authKeys.length > 0) {
            await AsyncStorage.multiRemove(authKeys);
          }
          console.log('Remember me disabled - cleared all session data');
        } catch (clearError) {
          console.error('Error clearing session data:', clearError);
        }
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    rememberMe,
    signUp: (data) => {
      // By default, use the current rememberMe value for new signups
      const persistSession = rememberMe;
      console.log('Sign up with remember me:', persistSession);
      
      // Ensure the options object exists
      const options = {
        ...(data.options || {}),
        persistSession
      };
      
      return supabase.auth.signUp({
        ...data,
        options
      });
    },
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
    ensureProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 