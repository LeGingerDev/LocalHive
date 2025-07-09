import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import googleAuthService from "@/services/supabase/googleAuthService"
import { AuthService } from "@/services/supabase/authService"
import { createSupabaseClient } from "@/services/supabase/supabase"

interface AuthContextType {
  user: User | null
  googleUser: any | null
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
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      // Get Supabase user
      const { user: supabaseUser } = await AuthService.getCurrentUser()
      setUser(supabaseUser)

      // Get Google user if available
      const googleUserData = await googleAuthService.getCurrentUser()
      setGoogleUser(googleUserData)
    } catch (error) {
      console.error("Error refreshing user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      
      // Sign out from Google service (this handles both Google and Supabase)
      await googleAuthService.signOut()
      
      // Clear local state
      setUser(null)
      setGoogleUser(null)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            // Also check for Google user
            const googleUserData = await googleAuthService.getCurrentUser()
            setGoogleUser(googleUserData)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setGoogleUser(null)
          }
          setIsLoading(false)
        }
      }
    )
    
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    googleUser,
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