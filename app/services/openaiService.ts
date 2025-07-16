import Config from "@/config"

import { ItemWithProfile } from "./supabase/itemService"
import { AnalyticsService, AnalyticsEvents } from "./analyticsService"

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export interface AIQueryResponse {
  answer: string
  confidence: number
  relatedItems?: ItemWithProfile[]
}

export async function askAIAboutItems(
  question: string,
  items: ItemWithProfile[],
): Promise<AIQueryResponse> {
  const startTime = Date.now()
  
  try {
    console.log("[OpenAIService] Starting AI query:", question)
    console.log("[OpenAIService] Number of items to analyze:", items.length)

    // Track AI query start
    AnalyticsService.trackEvent({
      name: AnalyticsEvents.AI_SEARCH_PERFORMED,
      properties: {
        query_length: question.length,
        query_preview: question.substring(0, 50), // First 50 chars for privacy
        total_items_available: items.length,
        timestamp: new Date().toISOString(),
      },
    })

    if (!Config.OPENAI_API_KEY) {
      // Track configuration error
      AnalyticsService.trackEvent({
        name: AnalyticsEvents.ERROR_OCCURRED,
        properties: {
          error_type: 'configuration_error',
          service: 'openai',
          query_length: question.length,
        },
      })
      
      throw new Error("OpenAI API key not configured")
    }

    // Smart pre-filtering pipeline to reduce AI costs
    let relevantItems = items
    console.log("[OpenAIService] Starting with", items.length, "items")

    // Stage 1: Category filtering if query suggests it
    const questionLower = question.toLowerCase()
    const categoryKeywords = {
      food: ["food", "eat", "meal", "snack", "breakfast", "lunch", "dinner", "cook", "recipe"],
      drinks: ["drink", "beverage", "juice", "soda", "water", "coffee", "tea", "alcohol"],
      household: ["household", "cleaning", "kitchen", "bathroom", "laundry", "home"],
      beauty: ["beauty", "cosmetic", "makeup", "skincare", "hair", "shower", "bath"],
      electronics: ["electronic", "device", "phone", "computer", "tech", "gadget"],
      clothing: ["clothing", "clothes", "shirt", "pants", "dress", "shoes", "fashion"],
    }

    // Check if query mentions specific categories
    let detectedCategory: string | null = null
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => questionLower.includes(keyword))) {
        const categoryFiltered = items.filter((item) => item.category.toLowerCase() === category)
        if (categoryFiltered.length > 0) {
          relevantItems = categoryFiltered
          detectedCategory = category
          console.log(
            "[OpenAIService] Category filtered to",
            category,
            "items:",
            relevantItems.length,
          )
          break
        }
      }
    }

    // Stage 2: Person name filtering if query mentions specific people
    const personMatch = questionLower.match(/\b(dimi|baba|jordan|husband|wife|family)\b/i)
    let detectedPerson: string | null = null
    if (personMatch) {
      const personName = personMatch[1].toLowerCase()
      detectedPerson = personName
      const personFiltered = relevantItems.filter((item) => {
        const itemText = `${item.title} ${item.details || ""}`.toLowerCase()
        return itemText.includes(personName)
      })
      if (personFiltered.length > 0) {
        relevantItems = personFiltered
        console.log(
          "[OpenAIService] Person filtered to",
          personName,
          "items:",
          relevantItems.length,
        )
      }
    }

    // Stage 3: Limit items sent to AI (max 20 for cost efficiency)
    const originalItemCount = relevantItems.length
    if (relevantItems.length > 20) {
      relevantItems = relevantItems.slice(0, 20)
      console.log("[OpenAIService] Limited to top 20 items for AI analysis")
    }

    console.log("[OpenAIService] Final items for AI analysis:", relevantItems.length)

    // Prepare the items data for the AI
    const itemsContext = relevantItems.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      details: item.details,
    }))

    const systemPrompt = `You are a helpful assistant that answers questions about items in a household inventory app. 
    
The user has provided you with a list of items and their details. Please answer their question based on this information.

For each item, you have access to:
- id: The unique identifier for the item
- title: The name of the item
- category: The category (food, household, etc.)
- details: Additional details about the item (this is where personal preferences are often mentioned)

IMPORTANT: After providing your answer, you must also return a JSON array of ONLY the item IDs that are relevant to the user's question. For example:
- If asked "what foods does dimi like?", only return IDs of food items that mention dimi's preferences in the details
- If asked "where are the electronics?", only return IDs of items in the electronics category
- If asked "what's in the kitchen?", only return IDs of items with kitchen location

Your response should be in this format:
ANSWER: [Your conversational answer here]

RELEVANT_ITEMS: ["item-id-1", "item-id-2", "item-id-3"]

If no items are relevant, return an empty array for RELEVANT_ITEMS.

Respond in a friendly, helpful tone. Keep answers concise but informative.`

    const userPrompt = `Question: ${question}

Items in the inventory:
${JSON.stringify(itemsContext, null, 2)}

Please answer the question based on the items above.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    console.log("[OpenAIService] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[OpenAIService] HTTP ${response.status}: ${response.statusText}`)
      console.error(`[OpenAIService] Error response body:`, errorText)
      
      // Track API error
      AnalyticsService.trackEvent({
        name: AnalyticsEvents.ERROR_OCCURRED,
        properties: {
          error_type: 'openai_api_error',
          service: 'openai',
          status_code: response.status,
          query_length: question.length,
          detected_category: detectedCategory,
          detected_person: detectedPerson,
        },
      })
      
      throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`)
    }

    const data: OpenAIResponse = await response.json()
    console.log("[OpenAIService] Success response:", data)

    const aiResponse = data.choices[0]?.message?.content || "I couldn't generate a response."

    // Parse the AI response to extract answer and relevant items
    let answer = aiResponse
    let relevantItemIds: string[] = []

    // Try to extract the structured response
    const answerMatch = aiResponse.match(/ANSWER:\s*(.*?)(?=\n*RELEVANT_ITEMS:|$)/s)
    const itemsMatch = aiResponse.match(/RELEVANT_ITEMS:\s*(\[.*?\])/s)

    if (answerMatch) {
      answer = answerMatch[1].trim()
    }

    if (itemsMatch) {
      try {
        relevantItemIds = JSON.parse(itemsMatch[1])
        console.log("[OpenAIService] Extracted relevant item IDs:", relevantItemIds)
      } catch (e) {
        console.error("[OpenAIService] Failed to parse relevant items JSON:", e)
      }
    }

    // Filter items based on the AI's selection
    const aiSelectedItems = items.filter((item) => relevantItemIds.includes(item.id))
    console.log("[OpenAIService] AI selected items:", aiSelectedItems.length)

    const duration = Date.now() - startTime

    // Track successful AI query
    AnalyticsService.trackEvent({
      name: AnalyticsEvents.SEARCH_PERFORMED,
      properties: {
        search_type: 'ai',
        query_length: question.length,
        total_items_available: items.length,
        items_sent_to_ai: relevantItems.length,
        items_limited: originalItemCount > 20,
        ai_selected_items: aiSelectedItems.length,
        response_time_ms: duration,
        detected_category: detectedCategory,
        detected_person: detectedPerson,
        answer_length: answer.length,
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      },
    })

    return {
      answer,
      confidence: 0.8, // We could implement a more sophisticated confidence scoring
      relatedItems: aiSelectedItems, // Return only the items the AI deemed relevant
    }
  } catch (error) {
    console.error("[OpenAIService] Error in AI query:", error)
    
    const duration = Date.now() - startTime
    
    // Track general error
    AnalyticsService.trackEvent({
      name: AnalyticsEvents.ERROR_OCCURRED,
      properties: {
        error_type: 'general_error',
        service: 'openai',
        query_length: question.length,
        response_time_ms: duration,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    
    throw new Error(
      `Failed to get AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
