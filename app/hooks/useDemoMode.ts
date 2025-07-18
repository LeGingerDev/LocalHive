import { useState, useEffect } from 'react'
import { DemoService } from '../services/demoService'

export const useDemoMode = () => {
  const [isDemoEnabled, setIsDemoEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const isEnabled = await DemoService.isDemoModeEnabled()
        setIsDemoEnabled(isEnabled)
      } catch (error) {
        console.error('Error checking demo mode:', error)
        setIsDemoEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkDemoMode()
  }, [])

  const signInWithDemo = async () => {
    try {
      const result = await DemoService.signInWithDemo()
      return result
    } catch (error) {
      return { success: false, error: 'Demo sign in failed' }
    }
  }

  return {
    isDemoEnabled,
    isLoading,
    signInWithDemo
  }
} 