import { PostgrestError } from "@supabase/supabase-js"

import { supabase } from "./supabase"

export interface ItemCategory {
  value: string
  label: string
}

export interface CreateItemData {
  group_id: string
  user_id: string
  title: string
  category: string
  location?: string
  notes?: string
  content?: string
  media_urls?: string[]
}

export interface ItemWithProfile {
  id: string
  group_id: string
  user_id: string
  title: string
  category: string
  location?: string
  details?: string
  created_at: string
  updated_at: string
  image_urls?: string[]
  profile_id?: string
  full_name?: string
  email?: string
  avatar_url?: string
}

/**
 * Service for handling item-related operations
 */
export class ItemService {
  /**
   * Get all available item categories
   */
  static async getCategories(): Promise<{
    data: ItemCategory[] | null
    error: PostgrestError | null
  }> {
    try {
      // Since we're using an enum, we need to query the enum values
      // For now, we'll return the predefined categories
      const categories: ItemCategory[] = [
        { value: "food", label: "Food" },
        { value: "drinks", label: "Drinks" },
        { value: "household", label: "Household" },
        { value: "electronics", label: "Electronics" },
        { value: "clothing", label: "Clothing" },
        { value: "health", label: "Health" },
        { value: "beauty", label: "Beauty" },
        { value: "books", label: "Books" },
        { value: "sports", label: "Sports" },
        { value: "toys", label: "Toys" },
        { value: "automotive", label: "Automotive" },
        { value: "garden", label: "Garden" },
        { value: "office", label: "Office" },
        { value: "entertainment", label: "Entertainment" },
        { value: "other", label: "Other" },
      ]

      return { data: categories, error: null }
    } catch (error) {
      console.error("Error getting item categories:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create a new item in a group
   */
  static async createItem(
    data: CreateItemData,
  ): Promise<{ data: ItemWithProfile | null; error: PostgrestError | null }> {
    try {
      const { data: createdItem, error } = await supabase
        .from("items")
        .insert({
          group_id: data.group_id,
          user_id: data.user_id,
          title: data.title,
          category: data.category,
          location: data.location,
          details: data.notes,
          image_urls: data.media_urls || [],
        })
        .select()
        .single()

      return { data: createdItem as ItemWithProfile | null, error }
    } catch (error) {
      console.error("Error creating item:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Fetches all items for a group, including user profile info (via RPC)
   */
  static async getGroupItemsWithProfiles(
    groupId: string,
  ): Promise<{ data: ItemWithProfile[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase.rpc("get_group_items_with_profiles", { group_id: groupId })
      return { data: data as ItemWithProfile[] | null, error }
    } catch (error) {
      console.error("Error getting group items with profiles:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get a single item by ID
   */
  static async getItemById(
    itemId: string,
  ): Promise<{ data: ItemWithProfile | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase.from("items").select("*").eq("id", itemId).single()

      return { data: data as ItemWithProfile | null, error }
    } catch (error) {
      console.error("Error getting item by ID:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update an item
   */
  static async updateItem(
    itemId: string,
    data: Partial<CreateItemData>,
  ): Promise<{ data: ItemWithProfile | null; error: PostgrestError | null }> {
    try {
      const { data: updatedItem, error } = await supabase
        .from("items")
        .update(data)
        .eq("id", itemId)
        .select()
        .single()

      return { data: updatedItem as ItemWithProfile | null, error }
    } catch (error) {
      console.error("Error updating item:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Delete an item
   */
  static async deleteItem(itemId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase.from("items").delete().eq("id", itemId)

      return { error }
    } catch (error) {
      console.error("Error deleting item:", error)
      return {
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get the count of items created by a specific user
   */
  static async getUserItemsCount(
    userId: string,
  ): Promise<{ data: number | null; error: PostgrestError | null }> {
    try {
      const { count, error } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      return { data: count, error }
    } catch (error) {
      console.error("Error getting user items count:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }
}
