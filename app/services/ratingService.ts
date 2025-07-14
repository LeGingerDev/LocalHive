import * as StoreReview from 'expo-store-review'

/**
 * Service for handling app store ratings and reviews
 */
export class RatingService {
  /**
   * Check if the device supports store review
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await StoreReview.isAvailableAsync()
    } catch (error) {
      console.error('Error checking store review availability:', error)
      return false
    }
  }

  /**
   * Check if the user has already rated the app
   */
  static async hasAction(): Promise<boolean> {
    try {
      return await StoreReview.hasAction()
    } catch (error) {
      console.error('Error checking store review action:', error)
      return false
    }
  }

  /**
   * Request a store review from the user
   * This will show the native rating dialog
   */
  static async requestReview(): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable()
      if (!isAvailable) {
        console.log('Store review not available on this device')
        return false
      }

      const hasAction = await this.hasAction()
      if (!hasAction) {
        console.log('Store review action not available')
        return false
      }

      await StoreReview.requestReview()
      return true
    } catch (error) {
      console.error('Error requesting store review:', error)
      return false
    }
  }

  /**
   * Open the app store page for rating
   * Use this as a fallback when native review is not available
   */
  static async openStorePage(): Promise<boolean> {
    try {
      const isAvailable = await StoreReview.isAvailableAsync()
      if (!isAvailable) {
        console.log('Store review not available, cannot open store page')
        return false
      }

      await StoreReview.requestReview()
      return true
    } catch (error) {
      console.error('Error opening store page:', error)
      return false
    }
  }
} 