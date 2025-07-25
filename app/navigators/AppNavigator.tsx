/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { ComponentProps } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"

import { SwipeableTabNavigator } from "@/components/SwipeableTabNavigator"
import Config from "@/config"
import { LandingScreen } from "@/screens/Auth/LandingScreen"
import { SplashScreen } from "@/screens/Auth/SplashScreen"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { InvitationsScreen } from "@/screens/InvitationsScreen"
import { CreateGroupScreen } from "@/screens/Main/CreateGroupScreen"
import { GroupDetailScreen } from "@/screens/Main/GroupDetailScreen"
import {
  OnboardingEntryScreen,
  OnboardingSlideshowScreen,
  OnboardingQuestionnaireScreen,
  OnboardingThankYouScreen,
} from "@/screens/Onboarding"
import { useAppTheme } from "@/theme/context"

import { BottomTabNavigator } from "./BottomTabNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type AppStackParamList = {
  Splash: undefined
  Landing: undefined
  OnboardingEntry: undefined
  OnboardingSlideshow: undefined
  OnboardingQuestionnaire: undefined
  OnboardingThankYou: undefined
  Main: undefined // Main app with bottom tabs
  CreateGroup: undefined
  GroupDetail: { groupId: string }
  // 🔥 Your screens go here
  Invitations: undefined
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: "fade",
        animationDuration: 300,
        // gestureEnabled: false, // Remove this line to re-enable gestures
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="OnboardingEntry" component={OnboardingEntryScreen} />
      <Stack.Screen name="OnboardingSlideshow" component={OnboardingSlideshowScreen} />
      <Stack.Screen name="OnboardingQuestionnaire" component={OnboardingQuestionnaireScreen} />
      <Stack.Screen name="OnboardingThankYou" component={OnboardingThankYouScreen} />
      <Stack.Screen name="Main" component={SwipeableTabNavigator} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="Invitations" component={InvitationsScreen} />
      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
}

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
