import { supabase } from "./supabase/supabase"

/**
 * Service for calling Supabase Edge Functions
 */
export class EdgeFunctionService {
  /**
   * Call the generate-item-embedding edge function
   */
  static async generateItemEmbedding(
    itemId: string,
    title: string,
    details?: string,
    category?: string,
    location?: string,
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { data, error } = await supabase.functions.invoke("generate-item-embedding", {
        body: {
          item_id: itemId,
          title,
          details,
          category,
          location,
        },
      })

      if (error) {
        console.error("Edge function error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Error calling generate-item-embedding:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Call the regenerate-embeddings-batch edge function to regenerate all item embeddings
   */
  static async regenerateAllEmbeddings(): Promise<{
    success: boolean
    message?: string
    processed?: number
    totalItems?: number
    errors?: string[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-embeddings-batch", {
        body: {},
      })

      if (error) {
        console.error("Batch regeneration error:", error)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: data.message,
        processed: data.processed,
        totalItems: data.totalItems,
        errors: data.errors,
      }
    } catch (error) {
      console.error("Error calling regenerate-embeddings-batch:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
