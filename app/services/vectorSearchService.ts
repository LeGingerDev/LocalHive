import Config from "@/config"

import { AnalyticsService, AnalyticsEvents } from "./analyticsService"
import { ItemWithProfile } from "./supabase/itemService"
import { supabase } from "./supabase/supabase"

// Use the actual deployed vector search Edge Function URL
const getVectorSearchEndpoint = () => {
  const supabaseUrl = Config.SUPABASE_URL
  if (!supabaseUrl) {
    console.warn("⚠️  SUPABASE_URL not available during build time")
    return "https://placeholder.supabase.co/functions/v1/vector-search"
  }
  return `${supabaseUrl}/functions/v1/vector-search`
}

export async function searchItemsByVector(query: string): Promise<ItemWithProfile[]> {
  const startTime = Date.now()

  try {
    const vectorSearchEndpoint = getVectorSearchEndpoint()
    console.log("[VectorService] Starting vector search for query:", query)
    console.log("[VectorService] Using endpoint:", vectorSearchEndpoint)

    // Track search start
    AnalyticsService.trackEvent({
      name: AnalyticsEvents.VECTOR_SEARCH_PERFORMED,
      properties: {
        query_length: query.length,
        query_preview: query.substring(0, 50), // First 50 chars for privacy
        timestamp: new Date().toISOString(),
      },
    })

    // Parse query for category filtering
    const queryLower = query.toLowerCase()
    const categoryKeywords = {
      food: ["food", "eat", "meal", "snack", "breakfast", "lunch", "dinner", "cook", "recipe"],
      drinks: ["drink", "beverage", "juice", "soda", "water", "coffee", "tea", "alcohol"],
      household: ["household", "cleaning", "kitchen", "bathroom", "laundry", "home"],
      beauty: ["beauty", "cosmetic", "makeup", "skincare", "hair", "shower", "bath"],
      health: ["health", "medical", "medicine", "vitamin", "supplement", "first aid"],
      electronics: ["electronic", "tech", "device", "phone", "computer", "gadget"],
      clothing: ["clothing", "clothes", "shirt", "pants", "dress", "shoes", "fashion"],
      books: ["book", "reading", "novel", "textbook", "magazine", "literature"],
      sports: ["sport", "exercise", "fitness", "gym", "workout", "athletic"],
      toys: ["toy", "game", "play", "entertainment", "fun", "children"],
      automotive: ["car", "auto", "vehicle", "transport", "driving"],
      garden: ["garden", "plant", "flower", "outdoor", "yard", "lawn"],
      office: ["office", "work", "business", "desk", "stationery", "paper"],
    }

    // Extract category from query
    let targetCategory: string | null = null
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => queryLower.includes(keyword))) {
        targetCategory = category
        break
      }
    }

    console.log("[VectorService] Detected category:", targetCategory)

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("[VectorService] No valid session found:", sessionError)

      // Track authentication error
      AnalyticsService.trackEvent({
        name: AnalyticsEvents.ERROR_OCCURRED,
        properties: {
          error_type: "authentication_error",
          service: "vector_search",
          query_length: query.length,
        },
      })

      throw new Error("User not authenticated")
    }

    console.log("[VectorService] Session found, using access token")

    const headers = {
      "Content-Type": "application/json",
      "apikey": Config.SUPABASE_KEY,
      "Authorization": `Bearer ${session.access_token}`,
    }

    console.log("[VectorService] Request headers:", {
      "Content-Type": headers["Content-Type"],
      "apikey": headers["apikey"] ? "Present" : "Missing",
      "Authorization": headers["Authorization"] ? "Present" : "Missing",
    })

    const response = await fetch(vectorSearchEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        category: targetCategory,
        similarityThreshold: 0.3, // Only return items with >30% similarity
      }),
    })

    console.log("[VectorService] Response status:", response.status)
    console.log("[VectorService] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[VectorService] HTTP ${response.status}: ${response.statusText}`)
      console.error(`[VectorService] Error response body:`, errorText)

      // Track API error
      AnalyticsService.trackEvent({
        name: AnalyticsEvents.ERROR_OCCURRED,
        properties: {
          error_type: "api_error",
          service: "vector_search",
          status_code: response.status,
          query_length: query.length,
          detected_category: targetCategory,
        },
      })

      throw new Error(`Vector search failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("[VectorService] Success response:", data)

    // Expecting { items: ItemWithProfile[] }
    const results = data.items || []
    const duration = Date.now() - startTime

    // Track successful search
    AnalyticsService.trackEvent({
      name: AnalyticsEvents.SEARCH_PERFORMED,
      properties: {
        search_type: "vector",
        query_length: query.length,
        results_count: results.length,
        response_time_ms: duration,
        detected_category: targetCategory,
        timestamp: new Date().toISOString(),
      },
    })

    return results
  } catch (error) {
    console.error("[VectorService] Error in vector search:", error)

    const duration = Date.now() - startTime

    // Track general error
    AnalyticsService.trackEvent({
      name: AnalyticsEvents.ERROR_OCCURRED,
      properties: {
        error_type: "general_error",
        service: "vector_search",
        query_length: query.length,
        response_time_ms: duration,
        error_message: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return []
  }
}
