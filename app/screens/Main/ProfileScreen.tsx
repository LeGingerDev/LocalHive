import { useEffect, useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from "react-native"
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

import { useSubscription } from "@/hooks/useSubscription"
import SubscriptionManagementModal from "@/components/Subscription/SubscriptionManagementModal"
import { PrivacySecurityModal } from "@/components/PrivacySecurityModal"
import { Icon } from "@/components/Icon"
import Ionicons from "react-native-vector-icons/Ionicons"

const ProfileScreen = () => {
  const { themeContext, theme } = useAppTheme()
  const navigation = useNavigation<any>()
  const { refreshUser, userProfile } = useAuth()
  const subscription = useSubscription(userProfile?.id || null)
  const [isManageModalVisible, setIsManageModalVisible] = useState(false)
  const [isPrivacySecurityModalVisible, setIsPrivacySecurityModalVisible] = useState(false)
  // Set the status bar background color to match the header
  useEffect(() => {
    setSystemUIBackgroundColor(theme.colors.headerBackground)
  }, [theme.colors.headerBackground])

  // Remove the unnecessary refreshUser call that was causing loading state interference
  // The user data is already loaded by the AuthContext and doesn't need to be refreshed
  // every time the ProfileScreen mounts

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



  const handleManageSubscription = () => {
    setIsManageModalVisible(true)
  }

  const handleCloseManageModal = () => {
    setIsManageModalVisible(false)
  }

  const handlePrivacySecurityPress = () => {
    setIsPrivacySecurityModalVisible(true)
  }

  const handleClosePrivacySecurityModal = () => {
    setIsPrivacySecurityModalVisible(false)
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <Header title="Profile" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileBoxContainer}>
          <ProfileBox style={styles.profileBox} />
          <PersonalCodeBox style={styles.personalCodeBox} code={userProfile?.personal_code} />
          {!subscription.isPro && <SubContainer style={styles.subContainer} />}
        </View>

        <SettingsSection style={styles.settingsSection}>
          <ThemeToggle />
          <SettingsItem icon="notifications-outline" label="Notifications" />
          <SettingsItem icon="lock-closed-outline" label="Privacy & Security" onPress={handlePrivacySecurityPress} />
          <SettingsItem icon="help-circle-outline" label="Help & Support" />
          <SettingsItem icon="information-circle-outline" label="About Local Hive" />
          {subscription.isPro && (
            <TouchableOpacity 
              onPress={handleManageSubscription} 
              activeOpacity={0.8} 
              style={[
                styles.manageSubscriptionItem,
                { 
                  backgroundColor: theme.colors.cardColor,
                  shadowColor: theme.colors.text,
                }
              ]}
            >
              <View style={[
                styles.manageIconContainer,
                { backgroundColor: theme.colors.palette.neutral100 }
              ]}>
                <Icon icon="lightning" size={22} color={theme.colors.gradientOrange[0]} />
              </View>
              <Text style={[styles.manageLabel, { color: theme.colors.text }]}>Manage Subscription</Text>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={theme.colors.textDim}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          )}
          <SettingsItem icon="log-out-outline" label="Sign Out" signOut onPress={handleSignOut} />
        </SettingsSection>


      </ScrollView>

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        visible={isManageModalVisible}
        onClose={handleCloseManageModal}
        userId={userProfile?.id || null}
      />

      {/* Privacy & Security Modal */}
      <PrivacySecurityModal
        visible={isPrivacySecurityModalVisible}
        onClose={handleClosePrivacySecurityModal}
      />
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
  manageSubscriptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  manageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  manageLabel: {
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },

})

export default ProfileScreen
