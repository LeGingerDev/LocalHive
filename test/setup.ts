// we always make sure 'react-native' gets included first
// eslint-disable-next-line no-restricted-imports
import * as ReactNative from "react-native"

import mockFile from "./mockFile"

// libraries to mock
jest.doMock("react-native", () => {
  // Extend ReactNative
  return Object.setPrototypeOf(
    {
      Image: {
        ...ReactNative.Image,
        resolveAssetSource: jest.fn((_source) => mockFile), // eslint-disable-line @typescript-eslint/no-unused-vars
        getSize: jest.fn(
          (
            uri: string, // eslint-disable-line @typescript-eslint/no-unused-vars
            success: (width: number, height: number) => void,
            failure?: (_error: any) => void, // eslint-disable-line @typescript-eslint/no-unused-vars
          ) => success(100, 100),
        ),
      },
    },
    ReactNative,
  )
})

jest.mock("i18next", () => ({
  currentLocale: "en",
  t: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
  translate: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
}))

jest.mock("expo-localization", () => ({
  ...jest.requireActual("expo-localization"),
  getLocales: () => [{ languageTag: "en-US", textDirection: "ltr" }],
}))

jest.mock("../app/i18n/index.ts", () => ({
  i18n: {
    isInitialized: true,
    language: "en",
    t: (key: string, params: Record<string, string>) => {
      return `${key} ${JSON.stringify(params)}`
    },
    numberToCurrency: jest.fn(),
  },
}))

declare const tron // eslint-disable-line @typescript-eslint/no-unused-vars

// Mock Firebase
jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(),
  app: jest.fn(),
}))

jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperty: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
  getAppInstanceId: jest.fn(),
  setSessionTimeoutDuration: jest.fn(),
  logScreenView: jest.fn(),
}))

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          then: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => ({
          then: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: "free",
                  name: "Free",
                  max_groups: 1,
                  max_items: 10,
                  ai_search_enabled: false,
                  trial_days: 0,
                  price_monthly: 0,
                  price_yearly: 0,
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                },
              ],
              error: null,
            }),
          ),
        })),
        then: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        then: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          then: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          then: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    rpc: jest.fn((functionName: string) => {
      switch (functionName) {
        case "get_user_subscription_status":
          return Promise.resolve({ data: "free", error: null })
        case "get_user_usage":
          return Promise.resolve({ data: [{ groups_count: 0, items_count: 0 }], error: null })
        case "get_user_limits":
          return Promise.resolve({
            data: [{ max_groups: 1, max_items: 10, ai_search_enabled: false }],
            error: null,
          })
        case "get_user_subscription_info":
          return Promise.resolve({
            data: [
              {
                subscription_status: "free",
                groups_count: 0,
                max_groups: 1,
                can_create_group: false,
                items_count: 0,
                max_items: 10,
                can_create_item: false,
                ai_search_enabled: false,
                can_use_ai: false,
              },
            ],
            error: null,
          })
        case "can_create_group":
          return Promise.resolve({ data: false, error: null })
        case "can_create_item":
          return Promise.resolve({ data: false, error: null })
        case "can_use_ai_search":
          return Promise.resolve({ data: false, error: null })
        case "update_user_usage":
          return Promise.resolve({ data: null, error: null })
        case "subscription_plans":
          return Promise.resolve({
            data: [
              {
                id: "free",
                name: "Free",
                max_groups: 1,
                max_items: 10,
                ai_search_enabled: false,
                trial_days: 0,
                price_monthly: 0,
                price_yearly: 0,
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
              },
            ],
            error: null,
          })
        default:
          return Promise.resolve({ data: null, error: null })
      }
    }),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    functions: {
      invoke: jest.fn(() => Promise.resolve({ data: null, error: null })),
    },
  })),
}))

declare global {
  let __TEST__: boolean
}
