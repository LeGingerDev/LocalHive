import { useEffect, useState } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { Header } from "@/components/Header"
import { PersonalCodeBox } from "@/components/PersonalCodeBox"
import { ProfileBox } from "@/components/profiles/ProfileBox"
import { SettingsItem } from "@/components/profiles/SettingsItem"
import { SettingsSection } from "@/components/profiles/SettingsSection"
import { Screen } from "@/components/Screen"
import SubContainer from "@/components/Subscription/SubContainer"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/context/AuthContext"
import googleAuthService from "@/services/supabase/googleAuthService"
import { useAppTheme } from "@/theme/context"
import { setSystemUIBackgroundColor } from "@/theme/context.utils"
import { spacing } from "@/theme/spacing"

const ProfileScreen = () => {
  const { themeContext, theme } = useAppTheme()
  const navigation = useNavigation<any>()
  const { refreshUser, userProfile } = useAuth()
  const [isLoadingCode, setIsLoadingCode] = useState(false)

  // Set the status bar background color to match the header
  useEffect(() => {
    setSystemUIBackgroundColor(theme.colors.headerBackground)
  }, [theme.colors.headerBackground])

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
    const loadUserData = async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error("Error refreshing user data:", error)
      }
    }

    loadUserData()
  }, [refreshUser])

  const handleSignOut = async () => {
    try {
      await googleAuthService.signOut()
      navigation.reset({
        index: 0,
        routes: [{ name: "Landing" }],
      })
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >

      
      <Header title="Profile" />
      
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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

        <SettingsSection style={styles.settingsSection}>
          <ThemeToggle />
          <SettingsItem icon="notifications-outline" label="Notifications" />
          <SettingsItem icon="lock-closed-outline" label="Privacy & Security" />
          <SettingsItem icon="help-circle-outline" label="Help & Support" />
          <SettingsItem icon="information-circle-outline" label="About Local Hive" />
          <SettingsItem icon="log-out-outline" label="Sign Out" signOut onPress={handleSignOut} />
        </SettingsSection>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl * 3 + spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  personalCodeBox: {
    width: "100%",
  },
  profileBox: {
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 160,
    width: "100%",
  },
  profileBoxContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    width: "100%",
  },
  settingsSection: {},
  subContainer: {
    marginBottom: spacing.md,
    width: "100%",
  },
})

export default ProfileScreen
