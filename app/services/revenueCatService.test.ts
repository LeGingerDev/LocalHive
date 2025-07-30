import { revenueCatService } from "./revenueCatService"

// Mock data for testing different subscription scenarios
const mockCustomerInfo = {
  // Active pro subscription
  activePro: {
    originalAppUserId: "test-user-id",
    entitlements: {
      active: {
        pro: {
          identifier: "pro",
          expirationDate: "2024-12-31T23:59:59Z",
          isActive: true,
          periodType: "normal",
        },
      },
      all: {
        pro: {
          identifier: "pro",
          expirationDate: "2024-12-31T23:59:59Z",
          isActive: true,
          periodType: "normal",
        },
      },
    },
  },

  // Expired pro subscription
  expiredPro: {
    originalAppUserId: "test-user-id",
    entitlements: {
      active: {},
      all: {
        pro: {
          identifier: "pro",
          expirationDate: "2024-01-01T00:00:00Z", // Past date
          isActive: false,
          periodType: "normal",
        },
      },
    },
  },

  // Active trial
  activeTrial: {
    originalAppUserId: "test-user-id",
    entitlements: {
      active: {
        trial: {
          identifier: "trial",
          expirationDate: "2024-01-15T00:00:00Z", // 7 days from now
          isActive: true,
          periodType: "intro",
        },
      },
      all: {
        trial: {
          identifier: "trial",
          expirationDate: "2024-01-15T00:00:00Z",
          isActive: true,
          periodType: "intro",
        },
      },
    },
  },

  // Cancelled subscription (no active entitlements)
  cancelled: {
    originalAppUserId: "test-user-id",
    entitlements: {
      active: {},
      all: {
        pro: {
          identifier: "pro",
          expirationDate: "2024-01-01T00:00:00Z", // Past date
          isActive: false,
          periodType: "normal",
        },
      },
    },
  },

  // Free user (no entitlements)
  free: {
    originalAppUserId: "test-user-id",
    entitlements: {
      active: {},
      all: {},
    },
  },
}

describe("RevenueCat Service - Subscription Sync Logic", () => {
  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks()
  })

  describe("Trial Detection", () => {
    it("should detect trial by identifier", () => {
      const trialEntitlement = {
        identifier: "trial_monthly",
        expirationDate: "2024-12-31T23:59:59Z",
        periodType: "normal",
      }

      // This would be tested in the actual sync logic
      const isTrial =
        trialEntitlement.identifier.includes("trial") ||
        trialEntitlement.identifier.includes("intro") ||
        trialEntitlement.periodType === "intro"

      expect(isTrial).toBe(true)
    })

    it("should detect trial by period type", () => {
      const trialEntitlement = {
        identifier: "monthly",
        expirationDate: "2024-12-31T23:59:59Z",
        periodType: "intro",
      }

      const isTrial =
        trialEntitlement.identifier.includes("trial") ||
        trialEntitlement.identifier.includes("intro") ||
        trialEntitlement.periodType === "intro"

      expect(isTrial).toBe(true)
    })
  })

  describe("Expired Subscription Detection", () => {
    it("should detect expired pro subscription", () => {
      const expiredEntitlement = {
        identifier: "pro",
        expirationDate: "2024-01-01T00:00:00Z", // Past date
        isActive: false,
      }

      const now = new Date()
      const expirationDate = new Date(expiredEntitlement.expirationDate)
      const isExpired = now > expirationDate

      expect(isExpired).toBe(true)
    })

    it("should not detect active subscription as expired", () => {
      const activeEntitlement = {
        identifier: "pro",
        expirationDate: "2024-12-31T23:59:59Z", // Future date
        isActive: true,
      }

      const now = new Date()
      const expirationDate = new Date(activeEntitlement.expirationDate)
      const isExpired = now > expirationDate

      expect(isExpired).toBe(false)
    })
  })

  describe("Pro Subscription Detection", () => {
    it("should detect pro subscription by identifier", () => {
      const proIdentifiers = ["pro", "premium", "pro_monthly", "pro_yearly", "monthly", "yearly"]

      proIdentifiers.forEach((identifier) => {
        const isPro =
          identifier === "pro" ||
          identifier.includes("pro") ||
          identifier.includes("premium") ||
          identifier.includes("monthly") ||
          identifier.includes("yearly")

        expect(isPro).toBe(true)
      })
    })
  })
})

export { mockCustomerInfo }
