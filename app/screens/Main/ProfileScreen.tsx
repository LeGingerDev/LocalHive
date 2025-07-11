import React, { useEffect, useState } from "react"
import { StatusBar, View, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { Button } from "@/components/Button"
import { PersonalCodeBox } from "@/components/PersonalCodeBox"
import { ProfileBox } from "@/components/profiles/ProfileBox"
import { SettingsItem } from "@/components/profiles/SettingsItem"
import { SettingsSection } from "@/components/profiles/SettingsSection"
import { Screen } from "@/components/Screen"
import SubContainer from "@/components/Subscription/SubContainer"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/context/AuthContext"
import googleAuthService from "@/services/supabase/googleAuthService"
import { PersonalCodeService } from "@/services/supabase/personalCodeService"
import { supabase } from "@/services/supabase/supabase"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"

const ProfileScreen = () => {
  const { theme, themeContext } = useAppTheme()
  const navigation = useNavigation<any>()
  const { refreshUser, userProfile, user, googleUser } = useAuth()
  const [isLoadingCode, setIsLoadingCode] = useState(false)

  const handleRefreshPersonalCode = async () => {
    setIsLoadingCode(true)
    try {
      await refreshUser()
    } finally {
      setIsLoadingCode(false)
    }
  }

  // Refresh user data when the screen loads
  useEffect(() => {
    console.log("🔍 [MainProfileScreen] Component mounted")

    const loadUserData = async () => {
      console.log("🔍 [MainProfileScreen] Loading user data...")
      try {
        await refreshUser()
        console.log("🔍 [MainProfileScreen] User data refreshed successfully")
      } catch (error) {
        console.error("🔍 [MainProfileScreen] Error refreshing user data:", error)
      }
    }

    loadUserData()

    // Log the current user data for debugging
    console.log("🔍 [MainProfileScreen] Current user profile data:", userProfile)
    console.log("🔍 [MainProfileScreen] Current user auth data:", user)
    console.log("🔍 [MainProfileScreen] Current Google user data:", googleUser?.user)

    return () => {
      console.log("🔍 [MainProfileScreen] Component unmounting")
    }
  }, [])

  const handleSignOut = async () => {
    try {
      console.log("🔍 [MainProfileScreen] Signing out...")
      await googleAuthService.signOut()
      console.log("🔍 [MainProfileScreen] Sign out successful, navigating to Landing")

      navigation.reset({
        index: 0,
        routes: [{ name: "Landing" }],
      })
    } catch (error) {
      console.error("🔍 [MainProfileScreen] Error during sign out:", error)
    }
  }

  console.log("🔍 [MainProfileScreen] Rendering with userProfile:", userProfile)

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      systemBarStyle={themeContext === "dark" ? "light" : "dark"}
      contentContainerStyle={styles.container}
    >
      <StatusBar
        barStyle={themeContext === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.profileBoxContainer}>
        <ProfileBox style={styles.profileBox} />
        <PersonalCodeBox
          style={styles.personalCodeBox}
          code={userProfile?.personal_code}
          isLoading={isLoadingCode}
          onRefresh={handleRefreshPersonalCode}
        />
        <SubContainer style={styles.subContainer} />
      </View>
      <Button
        text="Print Access Token"
        onPress={async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          console.log("[DEBUG] Supabase access token:", session?.access_token)
        }}
        style={{ marginBottom: 16 }}
      />
      <SettingsSection style={styles.settingsSection}>
        <ThemeToggle />
        <SettingsItem icon="notifications-outline" label="Notifications" />
        <SettingsItem icon="lock-closed-outline" label="Privacy & Security" />
        <SettingsItem icon="help-circle-outline" label="Help & Support" />
        <SettingsItem icon="information-circle-outline" label="About Local Hive" />
        <SettingsItem icon="log-out-outline" label="Sign Out" signOut onPress={handleSignOut} />
      </SettingsSection>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md, // Account for status bar
    paddingBottom: spacing.xl * 3 + spacing.md, // Account for bottom navigation bar (approximate 110)
  },
  personalCodeBox: {
    width: "100%",
  },
  profileBox: {
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 160,
    width: "100%", // Add margin between ProfileBox and PersonalCodeBox
  },
  profileBoxContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    width: "100%", // Add margin between ProfileBox container and SettingsSection
  },
  settingsSection: {},
  subContainer: {
    marginBottom: spacing.md,
    width: "100%",
  },
})

export default ProfileScreen
