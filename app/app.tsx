/* eslint-disable import/first */
/**
 * Welcome to the main entry point of the app. In this file, we'll
 * be kicking off our app.
 *
 * Most of this file is boilerplate and you shouldn't need to modify
 * it very often. But take some time to look through and understand
 * what is going on here.
 *
 * The app navigation resides in ./app/navigators, so head over there
 * if you're interested in adding screens and navigators.
 */

// Suppress Firebase deprecation warnings
;(globalThis as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true

if (__DEV__) {
  // Load Reactotron in development only.
  // Note that you must be using metro's `inlineRequires` for this to work.
  // If you turn it off in metro.config.js, you'll have to manually import it.
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { useEffect, useState } from "react"
import { AppState, AppStateStatus, Platform } from "react-native"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { AlertProvider } from "./components/Alert"
import { StatusBarManager } from "./components/StatusBarManager"
import { AuthProvider } from "./context/AuthContext"
import { initI18n } from "./i18n"
import { AppNavigator } from "./navigators/AppNavigator"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { setupAppStateListener } from "./services/supabase/supabase"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import { hideNavigationBar, setupNavigationBarHidingInterval } from "./utils/navigationBarUtils"
import * as storage from "./utils/storage"
import { AnalyticsService, AnalyticsEvents } from "./services/analyticsService"
import { getApp } from '@react-native-firebase/app'
import { getAnalytics, setAnalyticsCollectionEnabled, setSessionTimeoutDuration } from '@react-native-firebase/analytics'

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Web linking configuration
const prefix = Linking.createURL("/")
const config = {
  screens: {
    Splash: {
      path: "splash",
    },
    Landing: {
      path: "landing",
    },
    Main: {
      screens: {
        Home: {
          path: "home",
        },
        Search: {
          path: "search",
        },
        Profile: {
          path: "profile",
        },
      },
    },
  },
}

/**
 * This is the root component of our app.
 * @param {AppProps} props - The props for the `App` component.
 * @returns {JSX.Element} The rendered `App` component.
 */
export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  // Hide navigation bar on startup and keep it hidden with an interval
  useEffect(() => {
    const cleanupInterval = setupNavigationBarHidingInterval()
    return cleanupInterval
  }, [])

  // Re-hide navigation bar when app regains focus and track app opens
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        // App has come to the foreground - hide navigation bar again
        hideNavigationBar()
        
        // Track app opened event
        AnalyticsService.trackEvent({
          name: AnalyticsEvents.APP_OPENED,
        })
      } else if (nextAppState === "background") {
        // Track app backgrounded event
        AnalyticsService.trackEvent({
          name: AnalyticsEvents.APP_BACKGROUNDED,
        })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // Set up Supabase app state listener for session refresh
  useEffect(() => {
    setupAppStateListener()
  }, [])

  // Initialize Firebase Analytics
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        // Check if Firebase is available
        if (typeof getApp === 'undefined') {
          console.warn('[App] Firebase not available, skipping analytics initialization')
          return
        }

        const app = getApp()
        const analytics = getAnalytics(app)
        
        // Force enable analytics in development
        if (__DEV__) {
          await setAnalyticsCollectionEnabled(analytics, true)
          console.log('[App] Analytics enabled for development')
          
          // Set debug mode
          await setAnalyticsCollectionEnabled(analytics, true)
          
          // Force immediate event sending
          await setSessionTimeoutDuration(analytics, 1800000)
        }
        
        // Track app initialization
        await AnalyticsService.trackEvent({
          name: AnalyticsEvents.APP_OPENED,
          properties: {
            platform: Platform.OS,
            version: '1.0.0',
            build: '1',
            debug_mode: __DEV__ ? 'true' : 'false',
          },
        })
        
        // Get debug info
        if (__DEV__) {
          await AnalyticsService.getDebugInfo()
        }
        
        // Force flush events
        if (__DEV__) {
          setTimeout(async () => {
            try {
              await setAnalyticsCollectionEnabled(analytics, true)
              console.log('[App] Forced analytics flush')
            } catch (flushError) {
              console.error('[App] Failed to flush analytics:', flushError)
            }
          }, 1000)
        }
      } catch (error) {
        console.error('[App] Failed to initialize analytics:', error)
      }
    }
    
    // Delay analytics initialization to ensure Firebase is ready
    const timer = setTimeout(initAnalytics, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color.
  // In iOS: application:didFinishLaunchingWithOptions:
  // In Android: https://stackoverflow.com/a/45838109/204044
  // You can replace with your own loading component if you wish.
  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  const linking = {
    prefixes: [prefix],
    config,
  }

  // otherwise, we're ready to render the app
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <ThemeProvider>
            <StatusBarManager />
            <AuthProvider>
              <AlertProvider>
                <AppNavigator
                  linking={linking}
                  initialState={initialNavigationState}
                  onStateChange={onNavigationStateChange}
                />
              </AlertProvider>
            </AuthProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
