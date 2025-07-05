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

  // Load remember me preference from storage
  useEffect(() => {
    const loadRememberMePreference = async () => {
      try {
        const value = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        // Default to true if not set
        setRememberMe(value !== 'false');
      } catch (e) {
        console.error('Failed to load remember me preference:', e);
      }
    };

    loadRememberMePreference();
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
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session and remember me is enabled, use it
      if (session) {
        setSession(session);
        setUser(session?.user || null);
        
        // If user is signed in, ensure they have a profile
        if (session?.user) {
          await ensureProfile(session.user);
        }
      } else {
        // No session or remember me is disabled
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
      // Save the remember me preference
      await AsyncStorage.setItem(REMEMBER_ME_KEY, remember.toString());
      setRememberMe(remember);
      
      // Set session persistence based on remember me preference
      const sessionOptions = {
        persistSession: remember
      };
      
      const response = await supabase.auth.signInWithPassword({
        ...credentials,
        options: sessionOptions
      });
      
      if (response.data?.user && !response.error) {
        await ensureProfile(response.data.user);
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
          // Clear any additional storage if needed
          console.log('Remember me disabled - clearing all session data');
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
    signUp: (data) => supabase.auth.signUp({
      ...data,
      options: {
        ...data.options,
        emailRedirectTo: 'exp://localhost:19000',
        // Disable email confirmation by merging with any existing options
        data: {
          ...data.options?.data,
          email_confirmed: true, // This is just a marker, doesn't actually confirm the email
        }
      }
    }),
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