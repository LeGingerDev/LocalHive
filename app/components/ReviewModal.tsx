import React, { useState, useEffect } from "react"
import { View, Modal, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { Button } from "@/components/Button"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import { RatingService } from "@/services/ratingService"
import { reviewTrackingService } from "@/services/reviewTrackingService"
import { HapticService } from "@/services/hapticService"

interface ReviewModalProps {
  visible: boolean
  onClose: () => void
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ visible, onClose }) => {
  const { theme } = useAppTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  const handleRateApp = async () => {
    try {
      setIsLoading(true)
      HapticService.medium()

      // Check if user has already rated before showing the dialog
      const hasRatedBefore = await RatingService.hasAction()
      
      // Try to show native review dialog
      const success = await RatingService.requestReview()
      
      if (success) {
        // Wait a moment for the dialog to potentially complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if the user has rated after showing the dialog
        const hasRatedAfter = await RatingService.hasAction()
        
        // If the hasAction changed from false to true, user likely rated
        if (!hasRatedBefore && hasRatedAfter) {
          await reviewTrackingService.markAsRated()
        } else {
          // User dismissed the dialog, mark as requested but not rated
          await reviewTrackingService.markReviewRequested()
        }
        onClose()
      } else {
        // Fallback to store page
        const storeSuccess = await RatingService.openStorePage()
        if (storeSuccess) {
          // For store page, we can't know if they rated, so we assume they might have
          await reviewTrackingService.markAsRated()
        }
        onClose()
      }
    } catch (error) {
      console.error("Error requesting review:", error)
      Alert.alert("Error", "Unable to open review dialog. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async () => {
    try {
      HapticService.light()
      await reviewTrackingService.markReviewRequested()
      onClose()
    } catch (error) {
      console.error("Error dismissing review:", error)
      onClose()
    }
  }

  const handleMaybeLater = async () => {
    try {
      HapticService.light()
      await reviewTrackingService.markReviewRequested()
      onClose()
    } catch (error) {
      console.error("Error handling maybe later:", error)
      onClose()
    }
  }



  if (!visible) {
    return null
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent={true}
    >
             <View style={[styles.overlay, { backgroundColor: theme.colors.palette.overlay50 }]}>
                   <View style={[styles.container, { 
            backgroundColor: theme.colors.cardColor,
            borderWidth: 1,
            borderColor: theme.colors.gradientOrange[0]
          }]}>
                     {/* Title */}
           <Text style={[styles.title, { color: theme.colors.text }]}>
             Enjoying Local Hive?
           </Text>
           
           {/* Subtitle */}
           <Text style={[styles.subtitle, { color: theme.colors.text }]}>
             Your feedback helps us improve and helps others discover the app
           </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
                         <TouchableOpacity
               onPress={handleRateApp}
               disabled={isLoading}
               style={[styles.primaryButton, { backgroundColor: theme.colors.gradientOrange[0] }]}
             >
               <Text style={[styles.primaryButtonText, { color: theme.colors.palette.neutral100 }]}>
                 Rate Now
               </Text>
             </TouchableOpacity>
            
                         <TouchableOpacity
               onPress={handleMaybeLater}
               style={styles.secondaryButton}
             >
               <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                 Maybe Later
               </Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    borderRadius: 20,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 9999,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
}) 