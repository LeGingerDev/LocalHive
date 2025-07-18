import React, { useState, useRef, useEffect } from "react"
import { View, ViewStyle, TouchableOpacity, ScrollView, Modal, Animated, TextStyle, Clipboard } from "react-native"

import { Text } from "@/components/Text"
import { CustomAlert } from "@/components/Alert/CustomAlert"
import { useAppTheme } from "@/theme/context"
import { AuthService } from "@/services/supabase/authService"
import { AnalyticsService } from "@/services/analyticsService"
import { PRIVACY_POLICY_TEXT } from "@/constants/privacyPolicy"
import { TERMS_OF_SERVICE_TEXT } from "@/constants/termsOfService"
import { navigate } from "@/navigators/navigationUtilities"

interface PrivacySecurityModalProps {
  visible: boolean
  onClose: () => void
}

export const PrivacySecurityModal = ({ visible, onClose }: PrivacySecurityModalProps) => {
  const { themed } = useAppTheme()
  
  // Modal states
  const [termsVisible, setTermsVisible] = useState(false)
  const [privacyVisible, setPrivacyVisible] = useState(false)
  const [exportVisible, setExportVisible] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [exportData, setExportData] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, fadeAnim, scaleAnim])

  const handleTermsPress = () => {
    setTermsVisible(true)
    AnalyticsService.trackEvent({
      name: "privacy_terms_viewed",
    })
  }

  const handlePrivacyPress = () => {
    setPrivacyVisible(true)
    AnalyticsService.trackEvent({
      name: "privacy_policy_viewed",
    })
  }

  const handleExportPress = async () => {
    setIsExporting(true)
    try {
      // Call the export function from your Edge Function
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/export-user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await AuthService.getSession()).session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const formattedData = JSON.stringify(data, null, 2)
        setExportData(formattedData)
        setExportVisible(true)
        
        AnalyticsService.trackEvent({
          name: "user_data_exported",
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      // Show error alert
      setExportVisible(true)
      setExportData("Error: Failed to export data. Please try again later.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeletePress = () => {
    setDeleteVisible(true)
    AnalyticsService.trackEvent({
      name: "delete_account_confirmation_shown",
    })
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      // Call the delete function from your Edge Function
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await AuthService.getSession()).session?.access_token}`,
        },
      })
      
      if (response.ok) {
        // Sign out the user
        await AuthService.signOut()
        
        AnalyticsService.trackEvent({
          name: "user_account_deleted",
        })
        
        // Close the delete confirmation modal
        setDeleteVisible(false)
        
        // Close the main privacy & security modal
        onClose()
        
        // Navigate to the Landing screen
        navigate("Landing")
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      // Show error alert
      setDeleteVisible(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setString(exportData)
      // You could show a success message here
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  return (
    <>
      {/* Main Privacy & Security Modal */}
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View style={[themed($overlay), { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              themed($modalContainer),
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={themed($contentContainer)}>
              <Text style={themed($title)}>Privacy & Security</Text>
              <Text style={themed($message)}>Manage your privacy settings and account data</Text>

              <View style={themed($buttonContainer)}>
                <TouchableOpacity
                  style={themed($optionButton)}
                  onPress={handleTermsPress}
                  activeOpacity={0.8}
                >
                  <Text style={themed($optionButtonText)}>Terms of Service</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={themed($optionButton)}
                  onPress={handlePrivacyPress}
                  activeOpacity={0.8}
                >
                  <Text style={themed($optionButtonText)}>Privacy Policy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={themed($optionButton)}
                  onPress={handleExportPress}
                  activeOpacity={0.8}
                  disabled={isExporting}
                >
                  <Text 
                    style={themed($optionButtonText)} 
                  >
                    {isExporting ? "Exporting..." : "Export User Data"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={themed($deleteButton)}
                  onPress={handleDeletePress}
                  activeOpacity={0.8}
                >
                  <Text style={themed($deleteButtonText)}>Delete User Data</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={themed($closeButton)}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={themed($closeButtonText)}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal visible={termsVisible} transparent animationType="none" onRequestClose={() => setTermsVisible(false)}>
        <Animated.View style={[themed($overlay), { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              themed($modalContainer),
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={themed($contentContainer)}>
              <Text style={themed($title)}>Terms of Service</Text>
              
              <ScrollView 
                style={themed($scrollContainer)} 
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                contentContainerStyle={themed($scrollContent)}
              >
                <Text style={themed($policyText)}>
                  {TERMS_OF_SERVICE_TEXT}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={themed($closeButton)}
                onPress={() => setTermsVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={themed($closeButtonText)}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyVisible} transparent animationType="none" onRequestClose={() => setPrivacyVisible(false)}>
        <Animated.View style={[themed($overlay), { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              themed($modalContainer),
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={themed($contentContainer)}>
              <Text style={themed($title)}>Privacy Policy</Text>
              
              <ScrollView 
                style={themed($scrollContainer)} 
                showsVerticalScrollIndicator={true}
                indicatorStyle="white"
                contentContainerStyle={themed($scrollContent)}
              >
                <Text style={themed($policyText)}>
                  {PRIVACY_POLICY_TEXT}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={themed($closeButton)}
                onPress={() => setPrivacyVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={themed($closeButtonText)}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Export Data Modal */}
      <CustomAlert
        visible={exportVisible}
        title="User Data Export"
        message="Your data has been exported. You can copy it to your clipboard."
        confirmText="Copy to Clipboard"
        cancelText="Close"
        onConfirm={handleCopyToClipboard}
        onCancel={() => setExportVisible(false)}
        confirmStyle="success"
      />

      {/* Delete Account Confirmation Modal */}
      <CustomAlert
        visible={deleteVisible}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
        confirmText={isDeleting ? "Deleting..." : "Delete Account"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
        confirmStyle="destructive"
      />
    </>
  )
}

// Styles
const $overlay = (): ViewStyle => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalContainer = ({ colors }: any): ViewStyle => ({
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: 0,
  width: "100%",
  maxWidth: 320,
  shadowColor: colors.palette?.neutral900 || "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
})

const $contentContainer = ({ spacing }: any): ViewStyle => ({
  padding: 24,
})

const $title = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 18,
  color: colors.text,
  textAlign: "center",
  marginBottom: 12,
})

const $message = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: 24,
  lineHeight: 22,
})

const $buttonContainer = ({ spacing }: any): ViewStyle => ({
  marginTop: spacing.md,
  gap: spacing.sm,
})

const $optionButton = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.primary100,
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 20,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: colors.primary200,
})

const $optionButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.tint,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
})

const $deleteButton = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.error,
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 20,
  alignItems: "center",
  justifyContent: "center",
  marginTop: spacing.sm,
})

const $deleteButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.medium,
  fontSize: 16,
  textAlign: "center",
})

const $closeButton = ({ colors, spacing }: any): ViewStyle => ({
  backgroundColor: colors.tint,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 20,
  alignItems: "center",
  justifyContent: "center",
  marginTop: spacing.md,
})

const $closeButtonText = ({ colors, typography }: any): TextStyle => ({
  color: colors.background,
  fontFamily: typography.primary.bold,
  fontSize: 16,
  textAlign: "center",
})

const $exportDataContainer = ({ spacing }: any): ViewStyle => ({
  maxHeight: 200,
  backgroundColor: "rgba(0, 0, 0, 0.05)",
  borderRadius: 8,
  padding: spacing.sm,
  marginTop: spacing.sm,
})

const $exportDataText = ({ typography }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 12,
  lineHeight: 16,
})

const $scrollContainer = ({ spacing }: any): ViewStyle => ({
  maxHeight: 300,
  marginBottom: spacing.md,
})

const $scrollContent = ({ spacing }: any): ViewStyle => ({
  paddingBottom: spacing.sm,
})

const $policyText = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.normal,
  fontSize: 14,
  lineHeight: 20,
  color: colors.text,
})

const $policyHeading = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  marginTop: 8,
})

const $policySubheading = ({ typography, colors }: any): TextStyle => ({
  fontFamily: typography.primary.medium,
  fontSize: 14,
  color: colors.text,
}) 