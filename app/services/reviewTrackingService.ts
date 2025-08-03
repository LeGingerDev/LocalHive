import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform, DeviceEventEmitter } from "react-native"

import { RatingService } from "./ratingService"

interface ReviewTrackingData {
  totalAppTime: number // in minutes
  itemsCreated: number
  groupsCreated: number
  listsCreated: number
  subscriptionEvents: number
  lastReviewRequest: number // timestamp
  reviewRequestCount: number
  hasRated: boolean
}

const REVIEW_STORAGE_KEY = "review_tracking_data"
const MAX_REVIEW_REQUESTS_PER_YEAR = 4
const MIN_TIME_BETWEEN_REQUESTS = 6 * 30 * 24 * 60 * 60 * 1000 // 6 months in milliseconds

export class ReviewTrackingService {
  private static instance: ReviewTrackingService
  private trackingData: ReviewTrackingData | null = null
  private appStartTime: number = Date.now()
  private isTracking = false

  static getInstance(): ReviewTrackingService {
    if (!ReviewTrackingService.instance) {
      ReviewTrackingService.instance = new ReviewTrackingService()
    }
    return ReviewTrackingService.instance
  }

  /**
   * Initialize the review tracking service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadTrackingData()
      this.startTimeTracking()
      console.log("✅ Review tracking service initialized")
    } catch (error) {
      console.error("❌ Failed to initialize review tracking service:", error)
    }
  }

  /**
   * Start tracking app usage time
   */
  private startTimeTracking(): void {
    if (this.isTracking) return
    
    this.isTracking = true
    this.appStartTime = Date.now()
    
    // Track time when app goes to background/foreground
    // This is a simplified approach - in a real app you'd use AppState
    setInterval(() => {
      this.updateAppTime()
    }, 60000) // Update every minute
  }

  /**
   * Update app usage time
   */
  private async updateAppTime(): Promise<void> {
    if (!this.trackingData) return

    const currentTime = Date.now()
    const sessionTime = (currentTime - this.appStartTime) / (1000 * 60) // Convert to minutes
    this.trackingData.totalAppTime += sessionTime
    this.appStartTime = currentTime

    await this.saveTrackingData()
    await this.checkReviewTriggers()
  }

  /**
   * Track item creation
   */
  async trackItemCreated(): Promise<void> {
    if (!this.trackingData) return

    this.trackingData.itemsCreated += 1
    await this.saveTrackingData()
    await this.checkReviewTriggers()
  }

  /**
   * Track group creation
   */
  async trackGroupCreated(): Promise<void> {
    if (!this.trackingData) return

    this.trackingData.groupsCreated += 1
    await this.saveTrackingData()
    await this.checkReviewTriggers()
  }

  /**
   * Track list creation
   */
  async trackListCreated(): Promise<void> {
    if (!this.trackingData) return

    this.trackingData.listsCreated += 1
    await this.saveTrackingData()
    await this.checkReviewTriggers()
  }

  /**
   * Track subscription events (purchase, renewal, trial)
   */
  async trackSubscriptionEvent(): Promise<void> {
    if (!this.trackingData) return

    this.trackingData.subscriptionEvents += 1
    await this.saveTrackingData()
    await this.checkReviewTriggers()
  }

  /**
   * Check if any review triggers are met
   */
  private async checkReviewTriggers(): Promise<boolean> {
    if (!this.trackingData) return false

    // Check if we should show review prompt
    if (await this.shouldShowReviewPrompt()) {
      // Emit event for the review modal to show
      this.emitReviewTrigger()
      return true
    }

    return false
  }

  /**
   * Determine if we should show the review prompt
   */
  private async shouldShowReviewPrompt(): Promise<boolean> {
    if (!this.trackingData) return false

    // Check if user has already rated
    if (this.trackingData.hasRated) return false

    // Check if we've exceeded max requests per year
    if (this.trackingData.reviewRequestCount >= MAX_REVIEW_REQUESTS_PER_YEAR) return false

    // Check if enough time has passed since last request
    const timeSinceLastRequest = Date.now() - this.trackingData.lastReviewRequest
    if (timeSinceLastRequest < MIN_TIME_BETWEEN_REQUESTS) return false

    // Check trigger conditions
    const triggers = [
      this.trackingData.totalAppTime >= 15, // 15+ minutes of app usage
      this.trackingData.itemsCreated >= 3, // 3+ items created
      this.trackingData.groupsCreated >= 2, // 2+ groups created
      this.trackingData.listsCreated >= 1, // 1+ list created
      this.trackingData.subscriptionEvents >= 1, // Any subscription event
    ]

    // Show review if any trigger is met
    return triggers.some(trigger => trigger)
  }

  /**
   * Mark that user has rated the app
   */
  async markAsRated(): Promise<void> {
    if (!this.trackingData) return

    this.trackingData.hasRated = true
    this.trackingData.reviewRequestCount += 1
    this.trackingData.lastReviewRequest = Date.now()
    await this.saveTrackingData()
  }

  /**
   * Mark that review was requested (but user didn't rate)
   */
  async markReviewRequested(): Promise<void> {
    if (!this.trackingData) return

    this.trackingData.reviewRequestCount += 1
    this.trackingData.lastReviewRequest = Date.now()
    await this.saveTrackingData()
  }

  /**
   * Get current tracking data
   */
  getTrackingData(): ReviewTrackingData | null {
    return this.trackingData
  }

  /**
   * Check if the user has already rated the app
   */
  hasUserRated(): boolean {
    return this.trackingData?.hasRated || false
  }

  /**
   * Load tracking data from storage
   */
  private async loadTrackingData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY)
      if (data) {
        this.trackingData = JSON.parse(data)
      } else {
        this.trackingData = {
          totalAppTime: 0,
          itemsCreated: 0,
          groupsCreated: 0,
          listsCreated: 0,
          subscriptionEvents: 0,
          lastReviewRequest: 0,
          reviewRequestCount: 0,
          hasRated: false,
        }
      }
    } catch (error) {
      console.error("Error loading review tracking data:", error)
      this.trackingData = {
        totalAppTime: 0,
        itemsCreated: 0,
        groupsCreated: 0,
        listsCreated: 0,
        subscriptionEvents: 0,
        lastReviewRequest: 0,
        reviewRequestCount: 0,
        hasRated: false,
      }
    }
  }

  /**
   * Save tracking data to storage
   */
  private async saveTrackingData(): Promise<void> {
    if (!this.trackingData) return

    try {
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(this.trackingData))
    } catch (error) {
      console.error("Error saving review tracking data:", error)
    }
  }

  /**
   * Emit review trigger event
   */
  private emitReviewTrigger(): void {
    // Emit for React Native compatibility
    DeviceEventEmitter.emit('reviewTrigger')
  }

  /**
   * Reset tracking data (for testing)
   */
  async resetTrackingData(): Promise<void> {
    this.trackingData = {
      totalAppTime: 0,
      itemsCreated: 0,
      groupsCreated: 0,
      listsCreated: 0,
      subscriptionEvents: 0,
      lastReviewRequest: 0,
      reviewRequestCount: 0,
      hasRated: false,
    }
    await this.saveTrackingData()
  }
}

export const reviewTrackingService = ReviewTrackingService.getInstance() 