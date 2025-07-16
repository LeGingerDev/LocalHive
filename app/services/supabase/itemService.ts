import { PostgrestError } from "@supabase/supabase-js"

import { supabase } from "./supabase"
import { EdgeFunctionService } from "../edgeFunctionService"

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
  image_urls?: string[]
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

      if (error || !createdItem) {
        return { data: null, error }
      }

      // Generate embedding for the item (fire and forget - don't block item creation)
      try {
        await EdgeFunctionService.generateItemEmbedding(
          createdItem.id,
          data.title,
          data.notes || undefined,
          data.category,
          data.location || undefined,
        )
        console.log(`[ItemService] Generated embedding for item: ${createdItem.id}`)
      } catch (embeddingError) {
        // Log error but don't fail the item creation
        console.error(
          `[ItemService] Failed to generate embedding for item ${createdItem.id}:`,
          embeddingError,
        )
      }

      return { data: createdItem as ItemWithProfile | null, error: null }
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
      const { data, error } = await supabase.rpc("get_group_items_with_profiles", {
        group_id: groupId,
      })
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
      console.log("[ItemService] Updating item:", itemId, "with data:", data)

      // Map the data to match database field names
      const updateData: any = { ...data }

      // Map media_urls to image_urls for database consistency
      if (data.media_urls !== undefined) {
        updateData.image_urls = data.media_urls
        delete updateData.media_urls
      }

      // Map notes to details for database consistency
      if (data.notes !== undefined) {
        updateData.details = data.notes
        delete updateData.notes
      }

      console.log("[ItemService] Mapped update data:", updateData)

      const { data: updatedItem, error } = await supabase
        .from("items")
        .update(updateData)
        .eq("id", itemId)
        .select()
        .single()

      console.log("[ItemService] Update result:", { updatedItem, error })

      if (error || !updatedItem) {
        return { data: null, error }
      }

      // Regenerate embedding for the updated item (fire and forget)
      try {
        const title = data.title || updatedItem.title
        const details = data.notes || updatedItem.details
        const category = data.category || updatedItem.category
        const location = data.location || updatedItem.location
        await EdgeFunctionService.generateItemEmbedding(
          itemId,
          title,
          details || undefined,
          category,
          location || undefined,
        )
        console.log(`[ItemService] Regenerated embedding for updated item: ${itemId}`)
      } catch (embeddingError) {
        // Log error but don't fail the item update
        console.error(
          `[ItemService] Failed to regenerate embedding for item ${itemId}:`,
          embeddingError,
        )
      }

      return { data: updatedItem as ItemWithProfile | null, error: null }
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

  /**
   * Get all items for the current user across all their groups
   */
  static async getAllUserItemsWithProfiles(
    userId: string,
  ): Promise<{ data: ItemWithProfile[] | null; error: PostgrestError | null }> {
    try {
      // First get all groups the user is a member of
      const { data: userGroups, error: groupsError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId)

      if (groupsError) {
        console.error("Error getting user groups:", groupsError)
        return { data: null, error: groupsError }
      }

      if (!userGroups || userGroups.length === 0) {
        return { data: [], error: null }
      }

      const groupIds = userGroups.map((g) => g.group_id)

      // Get all items from all groups the user is a member of
      const { data: items, error } = await supabase
        .from("items")
        .select("*")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error getting all user items:", error)
        return { data: null, error }
      }

      // Transform the data to match ItemWithProfile interface (without profile data for now)
      const itemsWithProfiles: ItemWithProfile[] = (items || []).map((item) => ({
        id: item.id,
        group_id: item.group_id,
        user_id: item.user_id,
        title: item.title,
        category: item.category,
        location: item.location,
        details: item.details,
        created_at: item.created_at,
        updated_at: item.updated_at,
        image_urls: item.image_urls,
        // Profile fields will be undefined since we're not joining with profiles
        profile_id: undefined,
        full_name: undefined,
        email: undefined,
        avatar_url: undefined,
      }))

      return { data: itemsWithProfiles, error: null }
    } catch (error) {
      console.error("Error getting all user items with profiles:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }
}
