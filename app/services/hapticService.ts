import ReactNativeHapticFeedback from "react-native-haptic-feedback"

/**
 * Haptic feedback service for providing tactile feedback to users
 *
 * Available haptic types:
 * - 'selection': Light feedback for selection changes
 * - 'impactLight': Light impact feedback
 * - 'impactMedium': Medium impact feedback
 * - 'impactHeavy': Heavy impact feedback
 * - 'notificationSuccess': Success notification feedback
 * - 'notificationWarning': Warning notification feedback
 * - 'notificationError': Error notification feedback
 */
class HapticService {
  /**
   * Trigger a haptic feedback
   * @param type - The type of haptic feedback to trigger
   */
  static trigger(
    type:
      | "selection"
      | "impactLight"
      | "impactMedium"
      | "impactHeavy"
      | "notificationSuccess"
      | "notificationWarning"
      | "notificationError" = "selection",
  ): void {
    try {
      ReactNativeHapticFeedback.trigger(type, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      })
    } catch (error) {
      console.warn("[HapticService] Failed to trigger haptic feedback:", error)
    }
  }

  /**
   * Light feedback for selection changes (buttons, toggles, etc.)
   */
  static selection(): void {
    this.trigger("selection")
  }

  /**
   * Light impact feedback for minor interactions
   */
  static light(): void {
    this.trigger("impactLight")
  }

  /**
   * Medium impact feedback for moderate interactions
   */
  static medium(): void {
    this.trigger("impactMedium")
  }

  /**
   * Heavy impact feedback for significant interactions
   */
  static heavy(): void {
    this.trigger("impactHeavy")
  }

  /**
   * Success notification feedback
   */
  static success(): void {
    this.trigger("notificationSuccess")
  }

  /**
   * Warning notification feedback
   */
  static warning(): void {
    this.trigger("notificationWarning")
  }

  /**
   * Error notification feedback
   */
  static error(): void {
    this.trigger("notificationError")
  }
}

export { HapticService }
