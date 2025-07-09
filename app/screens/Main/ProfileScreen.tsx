import React, { useEffect } from "react"
import { StatusBar, View, StyleSheet } from "react-native"
import { useAppTheme } from "@/theme/context"
import { useNavigation } from "@react-navigation/native"
import { ProfileBox } from "@/components/profiles/ProfileBox"
import { SettingsSection } from "@/components/profiles/SettingsSection"
import { SettingsItem } from "@/components/profiles/SettingsItem"
import { Screen } from "@/components/Screen"
import { useAuth } from "@/context/AuthContext"
import googleAuthService from "@/services/supabase/googleAuthService"
import { PersonalCodeBox } from "@/components/PersonalCodeBox"
import { ThemeToggle } from "@/components/ThemeToggle"
import SubContainer from "@/components/Subscription/SubContainer"

const ProfileScreen = () => {
  const { theme, themeContext } = useAppTheme()
  const navigation = useNavigation<any>()
  const { refreshUser, userProfile, user, googleUser } = useAuth()

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
        <PersonalCodeBox style={styles.personalCodeBox} />
        <SubContainer style={styles.subContainer} />
      </View>
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
    paddingHorizontal: 8,
    paddingTop: 16, // Account for status bar
    paddingBottom: 110, // Account for bottom navigation bar
  },
  profileBoxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16, // Add margin between ProfileBox container and SettingsSection
  },
  profileBox: {
    width: '100%',
    minHeight: 160,
    justifyContent: 'center',
    marginBottom: 16, // Add margin between ProfileBox and PersonalCodeBox
  },
  personalCodeBox: {
    width: '100%',
  },
  subContainer: {
    width: '100%',
    marginBottom: 16,
  },
  settingsSection: {
    
  },
})

export default ProfileScreen