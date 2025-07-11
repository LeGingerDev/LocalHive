import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "@supabase/supabase-js"

import { CacheService } from "@/services/cache/cacheService"
import { AuthService } from "@/services/supabase/authService"
import googleAuthService from "@/services/supabase/googleAuthService"
import { PersonalCodeService } from "@/services/supabase/personalCodeService"
import { createSupabaseClient } from "@/services/supabase/supabase"

interface UserProfile {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  created_at?: string
  updated_at?: string
  theme_preference?: string
  use_system_theme?: boolean
  personal_code?: string
}

interface AuthContextType {
  user: User | null
  googleUser: any | null
  userProfile: UserProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [googleUser, setGoogleUser] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const generatePersonalCodeForUser = async (userId: string): Promise<string | null> => {
    try {
      const result = await PersonalCodeService.generatePersonalCode()

      if ("error" in result) {
        console.error("Failed to generate personal code:", result.error, result.message)
        return null
      }

      return result.personal_code
    } catch (error) {
      console.error("Error generating personal code:", error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      // Get Supabase user
      const { user: supabaseUser } = await AuthService.getCurrentUser()
      setUser(supabaseUser)

      // Get Google user if available
      const googleUserData = await googleAuthService.getCurrentUser()
      setGoogleUser(googleUserData)

      // Fetch user profile from database if we have a user
      if (supabaseUser) {
        const { data: profileData, error } = await AuthService.getProfileByUserId(supabaseUser.id)

        if (profileData) {
          setUserProfile(profileData as UserProfile)
        } else {
          // If profile doesn't exist but we have user data, create it
          try {
            const { data: newProfile, error: createError } =
              await AuthService.createOrUpdateProfile(supabaseUser.id, {
                email: supabaseUser.email,
                full_name: supabaseUser.user_metadata?.full_name,
                avatar_url: supabaseUser.user_metadata?.avatar_url,
              })

            if (newProfile) {
              // Generate personal code for new profile
              const personalCode = await generatePersonalCodeForUser(supabaseUser.id)
              if (personalCode) {
                // Update profile with personal code
                const { data: updatedProfile } = await AuthService.createOrUpdateProfile(
                  supabaseUser.id,
                  {
                    personal_code: personalCode,
                  },
                )
                if (updatedProfile) {
                  setUserProfile(updatedProfile as UserProfile)
                } else {
                  setUserProfile(newProfile as UserProfile)
                }
              } else {
                setUserProfile(newProfile as UserProfile)
              }
            } else {
              console.error("Failed to create profile:", createError)
            }
          } catch (profileError) {
            console.error("Error creating user profile during refresh:", profileError)
          }
        }
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)

      // Clear all caches before signing out
      CacheService.clearAllCaches()

      // Sign out from Google service (this handles both Google and Supabase)
      await googleAuthService.signOut()

      // Clear local state
      setUser(null)
      setGoogleUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error("Error during sign out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      if (mounted) {
        await refreshUser()
      }
    }

    initAuth()

    // Set up Supabase auth listener
    const supabase = createSupabaseClient(true)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === "SIGNED_IN" && session?.user) {
          // Clear all caches when a new user signs in to prevent showing stale data
          CacheService.clearAllCaches()

          setUser(session.user)
          // Also check for Google user
          const googleUserData = await googleAuthService.getCurrentUser()
          setGoogleUser(googleUserData)

          // Fetch or create user profile
          const { data: profileData, error } = await AuthService.getProfileByUserId(session.user.id)

          if (profileData) {
            setUserProfile(profileData as UserProfile)
          } else {
            try {
              const { data: newProfile, error: createError } =
                await AuthService.createOrUpdateProfile(session.user.id, {
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                })

              if (newProfile) {
                // Generate personal code for new profile
                const personalCode = await generatePersonalCodeForUser(session.user.id)
                if (personalCode) {
                  // Update profile with personal code
                  const { data: updatedProfile } = await AuthService.createOrUpdateProfile(
                    session.user.id,
                    {
                      personal_code: personalCode,
                    },
                  )
                  if (updatedProfile) {
                    setUserProfile(updatedProfile as UserProfile)
                  } else {
                    setUserProfile(newProfile as UserProfile)
                  }
                } else {
                  setUserProfile(newProfile as UserProfile)
                }
              } else {
                console.error("Failed to create profile after sign-in:", createError)
              }
            } catch (profileError) {
              console.error("Error creating user profile during auth change:", profileError)
            }
          }
        } else if (event === "SIGNED_OUT") {
          // Clear all caches when user signs out
          CacheService.clearAllCaches()

          setUser(null)
          setGoogleUser(null)
          setUserProfile(null)
        }
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    googleUser,
    userProfile,
    isLoading,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
