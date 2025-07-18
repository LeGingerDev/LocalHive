import { supabase } from './supabase/supabase'

export interface DemoConfig {
  is_demo: boolean
  demo_credentials?: {
    email: string
    password: string
  }
}

export class DemoService {
  /**
   * Check if demo mode is enabled
   */
  static async isDemoModeEnabled(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('demo')
        .select('is_demo')
        .single()

      if (error) {
        console.error('Error checking demo mode:', error)
        return false
      }

      return data?.is_demo || false
    } catch (error) {
      console.error('Error checking demo mode:', error)
      return false
    }
  }

  /**
   * Get demo configuration including credentials
   */
  static async getDemoConfig(): Promise<DemoConfig | null> {
    try {
      const { data, error } = await supabase
        .from('demo')
        .select('*')
        .single()

      if (error) {
        console.error('Error getting demo config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting demo config:', error)
      return null
    }
  }

  /**
   * Sign in with demo credentials
   */
  static async signInWithDemo(): Promise<{ success: boolean; error?: string }> {
    try {
      const demoConfig = await this.getDemoConfig()
      
      if (!demoConfig?.is_demo) {
        return { success: false, error: 'Demo mode is not enabled' }
      }

      // Use hardcoded demo credentials since they're not in the table
      const demoEmail = 'demo@visu.app'
      const demoPassword = 'demo123456'

      // Try to sign in with the demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      })

      if (error) {
        console.error('Demo sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Demo sign in exception:', error)
      return { success: false, error: 'Demo sign in failed' }
    }
  }

  /**
   * Enable demo mode (admin function)
   */
  static async enableDemoMode(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('demo')
        .update({ is_demo: true, updated_at: new Date().toISOString() })

      return !error
    } catch (error) {
      console.error('Error enabling demo mode:', error)
      return false
    }
  }

  /**
   * Disable demo mode (admin function)
   */
  static async disableDemoMode(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('demo')
        .update({ is_demo: false, updated_at: new Date().toISOString() })

      return !error
    } catch (error) {
      console.error('Error disabling demo mode:', error)
      return false
    }
  }
} 