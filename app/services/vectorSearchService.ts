import { ItemWithProfile } from "./supabase/itemService"
import { supabase } from "./supabase/supabase"
import Config from "@/config"

// Use the actual deployed vector search Edge Function URL
const VECTOR_SEARCH_ENDPOINT = "https://xnnobyeytyycngybinqj.supabase.co/functions/v1/vector-search"

export async function searchItemsByVector(query: string): Promise<ItemWithProfile[]> {
  try {
    console.log("[VectorService] Starting vector search for query:", query)
    console.log("[VectorService] Using endpoint:", VECTOR_SEARCH_ENDPOINT)
    
    // Parse query for category filtering
    const queryLower = query.toLowerCase()
    const categoryKeywords = {
      food: ['food', 'eat', 'meal', 'snack', 'breakfast', 'lunch', 'dinner', 'cook', 'recipe'],
      drinks: ['drink', 'beverage', 'juice', 'soda', 'water', 'coffee', 'tea', 'alcohol'],
      household: ['household', 'cleaning', 'kitchen', 'bathroom', 'laundry', 'home'],
      beauty: ['beauty', 'cosmetic', 'makeup', 'skincare', 'hair', 'shower', 'bath'],
      health: ['health', 'medical', 'medicine', 'vitamin', 'supplement', 'first aid'],
      electronics: ['electronic', 'tech', 'device', 'phone', 'computer', 'gadget'],
      clothing: ['clothing', 'clothes', 'shirt', 'pants', 'dress', 'shoes', 'fashion'],
      books: ['book', 'reading', 'novel', 'textbook', 'magazine', 'literature'],
      sports: ['sport', 'exercise', 'fitness', 'gym', 'workout', 'athletic'],
      toys: ['toy', 'game', 'play', 'entertainment', 'fun', 'children'],
      automotive: ['car', 'auto', 'vehicle', 'transport', 'driving'],
      garden: ['garden', 'plant', 'flower', 'outdoor', 'yard', 'lawn'],
      office: ['office', 'work', 'business', 'desk', 'stationery', 'paper']
    }
    
    // Extract category from query
    let targetCategory: string | null = null
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        targetCategory = category
        break
      }
    }
    
    console.log("[VectorService] Detected category:", targetCategory)
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error("[VectorService] No valid session found:", sessionError)
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
    
    const response = await fetch(VECTOR_SEARCH_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        query,
        category: targetCategory,
        similarityThreshold: 0.3 // Only return items with >30% similarity
      }),
    })
    
    console.log("[VectorService] Response status:", response.status)
    console.log("[VectorService] Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[VectorService] HTTP ${response.status}: ${response.statusText}`)
      console.error(`[VectorService] Error response body:`, errorText)
      throw new Error(`Vector search failed: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log("[VectorService] Success response:", data)
    
    // Expecting { items: ItemWithProfile[] }
    return data.items || []
  } catch (error) {
    console.error("[VectorService] Error in vector search:", error)
    return []
  }
} 