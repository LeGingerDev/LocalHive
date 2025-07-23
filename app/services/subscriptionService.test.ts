import { SubscriptionService } from "./subscriptionService"

/**
 * Test file for SubscriptionService
 *
 * Note: These tests require a running Supabase instance with the subscription
 * migrations applied. They are integration tests rather than unit tests.
 */

describe("SubscriptionService", () => {
  // Test user ID - replace with a real user ID from your database
  const testUserId = "test-user-id"

  beforeAll(async () => {
    // Initialize usage for test user if needed
    await SubscriptionService.updateUserUsage(testUserId)
  })

  describe("getSubscriptionStatus", () => {
    it("should return subscription status for a user", async () => {
      const { status, error } = await SubscriptionService.getSubscriptionStatus(testUserId)

      expect(error).toBeNull()
      expect(status).toBeDefined()
      expect(["free", "trial", "pro", "expired"]).toContain(status)
    })
  })

  describe("getUserUsage", () => {
    it("should return usage counts for a user", async () => {
      const { usage, error } = await SubscriptionService.getUserUsage(testUserId)

      expect(error).toBeNull()
      expect(usage).toBeDefined()
      expect(usage?.groups_count).toBeGreaterThanOrEqual(0)
      expect(usage?.items_count).toBeGreaterThanOrEqual(0)
    })
  })

  describe("getUserLimits", () => {
    it("should return subscription limits for a user", async () => {
      const { limits, error } = await SubscriptionService.getUserLimits(testUserId)

      expect(error).toBeNull()
      expect(limits).toBeDefined()
      expect(limits?.max_groups).toBeGreaterThan(0)
      expect(limits?.max_items).toBeGreaterThan(0)
      expect(typeof limits?.ai_search_enabled).toBe("boolean")
    })
  })

  describe("getSubscriptionInfo", () => {
    it("should return comprehensive subscription info", async () => {
      const { info, error } = await SubscriptionService.getSubscriptionInfo(testUserId)

      expect(error).toBeNull()
      expect(info).toBeDefined()
      expect(info?.subscription_status).toBeDefined()
      expect(info?.groups_count).toBeGreaterThanOrEqual(0)
      expect(info?.items_count).toBeGreaterThanOrEqual(0)
      expect(info?.max_groups).toBeGreaterThan(0)
      expect(info?.max_items).toBeGreaterThan(0)
      expect(typeof info?.ai_search_enabled).toBe("boolean")
      expect(typeof info?.can_create_group).toBe("boolean")
      expect(typeof info?.can_create_item).toBe("boolean")
      expect(typeof info?.can_use_ai).toBe("boolean")
    })
  })

  describe("canCreateGroup", () => {
    it("should return boolean for group creation permission", async () => {
      const { canCreate, error } = await SubscriptionService.canCreateGroup(testUserId)

      expect(error).toBeNull()
      expect(typeof canCreate).toBe("boolean")
    })
  })

  describe("canCreateItem", () => {
    it("should return boolean for item creation permission", async () => {
      const { canCreate, error } = await SubscriptionService.canCreateItem(testUserId)

      expect(error).toBeNull()
      expect(typeof canCreate).toBe("boolean")
    })
  })

  describe("canUseAISearch", () => {
    it("should return boolean for AI search permission", async () => {
      const { canUse, error } = await SubscriptionService.canUseAISearch(testUserId)

      expect(error).toBeNull()
      expect(typeof canUse).toBe("boolean")
    })
  })

  describe("getSubscriptionPlans", () => {
    it.skip("should return all subscription plans", async () => {
      const { plans, error } = await SubscriptionService.getSubscriptionPlans()

      expect(error).toBeNull()
      expect(plans).toBeDefined()
      expect(Array.isArray(plans)).toBe(true)
      expect(plans?.length).toBeGreaterThan(0)

      // Check that we have the expected plans
      const planNames = plans?.map((plan) => plan.name) || []
      expect(planNames).toContain("Free")
    })
  })

  describe("isApproachingLimits", () => {
    it("should return approaching limits info", async () => {
      const { approaching, details, error } =
        await SubscriptionService.isApproachingLimits(testUserId)

      expect(error).toBeNull()
      expect(typeof approaching).toBe("boolean")

      if (approaching) {
        expect(details).toBeDefined()
        expect(details?.groups).toBeDefined()
        expect(details?.items).toBeDefined()
        expect(details?.groups.percentage).toBeGreaterThanOrEqual(80)
        expect(details?.items.percentage).toBeGreaterThanOrEqual(80)
      }
    })
  })

  describe("updateUserUsage", () => {
    it("should update user usage counts", async () => {
      const { success, error } = await SubscriptionService.updateUserUsage(testUserId)

      expect(error).toBeNull()
      expect(success).toBe(true)
    })
  })
})
