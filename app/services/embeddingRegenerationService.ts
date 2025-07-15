import { supabase } from "./supabase/supabase"
import { EdgeFunctionService } from "./edgeFunctionService"

/**
 * Service for regenerating embeddings for existing items
 */
export class EmbeddingRegenerationService {
  /**
   * Get all items that need embedding regeneration
   */
  static async getItemsForRegeneration(): Promise<{
    success: boolean
    items?: Array<{
      id: string
      title: string
      details?: string
      category?: string
      location?: string
    }>
    error?: string
  }> {
    try {
      const { data: items, error } = await supabase
        .from("items")
        .select("id, title, details, category, location")
        .not("title", "is", null)
        .neq("title", "")

      if (error) {
        console.error("Error fetching items:", error)
        return { success: false, error: error.message }
      }

      return { success: true, items: items || [] }
    } catch (error) {
      console.error("Error in getItemsForRegeneration:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Regenerate embedding for a single item
   */
  static async regenerateItemEmbedding(
    itemId: string,
    title: string,
    details?: string,
    category?: string,
    location?: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    return await EdgeFunctionService.generateItemEmbedding(
      itemId,
      title,
      details,
      category,
      location
    )
  }

  /**
   * Regenerate embeddings for all items (one by one)
   */
  static async regenerateAllEmbeddings(): Promise<{
    success: boolean
    processed: number
    totalItems: number
    errors: string[]
    message?: string
    error?: string
  }> {
    try {
      // Get all items
      const itemsResult = await this.getItemsForRegeneration()
      if (!itemsResult.success || !itemsResult.items) {
        return {
          success: false,
          processed: 0,
          totalItems: 0,
          errors: [itemsResult.error || "Failed to fetch items"],
          error: itemsResult.error
        }
      }

      const items = itemsResult.items
      const results = {
        processed: 0,
        errors: [] as string[]
      }

      console.log(`Starting regeneration for ${items.length} items`)

      // Process items one by one with delays to avoid rate limits
      for (const item of items) {
        try {
          const result = await this.regenerateItemEmbedding(
            item.id,
            item.title,
            item.details,
            item.category,
            item.location
          )

          if (result.success) {
            results.processed++
            console.log(`✅ Regenerated embedding for: ${item.title}`)
          } else {
            results.errors.push(`${item.title}: ${result.error}`)
            console.error(`❌ Failed to regenerate embedding for: ${item.title}`, result.error)
          }

          // Add delay between requests to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error"
          results.errors.push(`${item.title}: ${errorMsg}`)
          console.error(`❌ Error processing ${item.title}:`, errorMsg)
        }
      }

      return {
        success: true,
        processed: results.processed,
        totalItems: items.length,
        errors: results.errors,
        message: `Processed ${results.processed} out of ${items.length} items`
      }

    } catch (error) {
      console.error("Error in regenerateAllEmbeddings:", error)
      return {
        success: false,
        processed: 0,
        totalItems: 0,
        errors: [],
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }
} 