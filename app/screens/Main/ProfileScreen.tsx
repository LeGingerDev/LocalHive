import { useEffect, useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"

import { Header } from "@/components/Header"
import { Icon } from "@/components/Icon"
import { PersonalCodeBox } from "@/components/PersonalCodeBox"
import { PrivacySecurityModal } from "@/components/PrivacySecurityModal"
import { ProfileBox } from "@/components/profiles/ProfileBox"
import { SettingsItem } from "@/components/profiles/SettingsItem"
import { SettingsSection } from "@/components/profiles/SettingsSection"
import { Screen } from "@/components/Screen"
import SubContainer from "@/components/Subscription/SubContainer"
import SubscriptionManagementModal from "@/components/Subscription/SubscriptionManagementModal"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/context/AuthContext"
import { useSubscription } from "@/hooks/useSubscription"
import { HapticService } from "@/services/hapticService"
import googleAuthService from "@/services/supabase/googleAuthService"
import { revenueCatService } from "@/services/revenueCatService"
import { useAppTheme } from "@/theme/context"
import { setSystemUIBackgroundColor } from "@/theme/context.utils"
import { spacing } from "@/theme/spacing"

const ProfileScreen = () => {
  const { themeContext, theme } = useAppTheme()
  const navigation = useNavigation<any>()
  const { checkOutlineUser, userProfile } = useAuth()
  const subscription = useSubscription(userProfile?.id || null)
  const [isManageModalVisible, setIsManageModalVisible] = useState(false)
  const [isPrivacySecurityModalVisible, setIsPrivacySecurityModalVisible] = useState(false)
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false)
  // Set the status bar background color to match the header
  useEffect(() => {
    setSystemUIBackgroundColor(theme.colors.headerBackground)
  }, [theme.colors.headerBackground])

  // Remove the unnecessary checkOutlineUser call that was causing loading state interference
  // The user data is already loaded by the AuthContext and doesn't need to be checkOutlineed
  // every time the ProfileScreen mounts

  const handleSignOut = async () => {
    HapticService.medium()
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
    HapticService.selection()
    setIsManageModalVisible(true)
  }

  const handleCloseManageModal = () => {
    HapticService.light()
    setIsManageModalVisible(false)
  }

  const handlePrivacySecurityPress = () => {
    HapticService.selection()
    setIsPrivacySecurityModalVisible(true)
  }

  const handleClosePrivacySecurityModal = () => {
    HapticService.light()
    setIsPrivacySecurityModalVisible(false)
  }

  const handleRestorePurchases = async () => {
    HapticService.selection()
    setIsRestoringPurchases(true)
    
    try {
      const customerInfo = await revenueCatService.restorePurchases()
      
      if (customerInfo) {
        // Check if any purchases were restored
        const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0
        
        if (hasActiveEntitlements) {
          Alert.alert(
            "Purchases Restored",
            "Your purchases have been successfully restored!",
            [{ text: "OK" }]
          )
        } else {
          Alert.alert(
            "No Purchases Found",
            "No previous purchases were found to restore.",
            [{ text: "OK" }]
          )
        }
      }
    } catch (error) {
      console.error("Failed to restore purchases:", error)
      Alert.alert(
        "Restore Failed",
        "Failed to restore purchases. Please try again later.",
        [{ text: "OK" }]
      )
    } finally {
      setIsRestoringPurchases(false)
    }
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
          <SettingsItem
            icon="lock-closed-outline"
            label="Privacy & Security"
            onPress={handlePrivacySecurityPress}
          />
          <SettingsItem icon="help-circle-outline" label="Help & Support" />
          <SettingsItem icon="information-circle-outline" label="About Visu App" />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleRestorePurchases}
              activeOpacity={0.8}
              disabled={isRestoringPurchases}
              style={[
                styles.restorePurchasesItem,
                {
                  backgroundColor: theme.colors.cardColor,
                  shadowColor: theme.colors.text,
                },
              ]}
            >
              <View
                style={[
                  styles.restoreIconContainer,
                  { backgroundColor: theme.colors.palette.neutral100 },
                ]}
              >
                <Icon 
                  icon={isRestoringPurchases ? "check" : "checkOutline"} 
                  size={22} 
                  color={theme.colors.gradientOrange[0]} 
                />
              </View>
              <Text style={[styles.restoreLabel, { color: theme.colors.text }]}>
                {isRestoringPurchases ? "Restoring..." : "Restore Purchases"}
              </Text>
              {!isRestoringPurchases && (
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={theme.colors.textDim}
                  style={{ marginLeft: "auto" }}
                />
              )}
            </TouchableOpacity>
          )}
          {subscription.isPro && (
            <TouchableOpacity
              onPress={handleManageSubscription}
              activeOpacity={0.8}
              style={[
                styles.manageSubscriptionItem,
                {
                  backgroundColor: theme.colors.cardColor,
                  shadowColor: theme.colors.text,
                },
              ]}
            >
              <View
                style={[
                  styles.manageIconContainer,
                  { backgroundColor: theme.colors.palette.neutral100 },
                ]}
              >
                <Icon icon="lightning" size={22} color={theme.colors.gradientOrange[0]} />
              </View>
              <Text style={[styles.manageLabel, { color: theme.colors.text }]}>
                Manage Subscription
              </Text>
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
  manageIconContainer: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: 8,
    width: 36,
  },
  manageLabel: {
    color: "#333333",
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "500",
  },
  manageSubscriptionItem: {
    alignItems: "center",
    elevation: 2,
    flexDirection: "row",
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  restoreIconContainer: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginRight: 8,
    width: 36,
  },
  restoreLabel: {
    color: "#333333",
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "500",
  },
  restorePurchasesItem: {
    alignItems: "center",
    elevation: 2,
    flexDirection: "row",
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
