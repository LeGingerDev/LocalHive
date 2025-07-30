import { PostgrestError } from "@supabase/supabase-js"

import { supabase } from "./supabase"

export interface CreateListData {
  user_id: string
  name: string
  description?: string
}

export interface ItemList {
  id: string
  user_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  item_count?: number
  completed_count?: number
}

export interface ListItem {
  id: string
  list_id: string
  item_id?: string
  text_content?: string
  is_text_item: boolean
  quantity: number
  notes?: string
  is_completed: boolean
  created_at: string
  updated_at: string
  // Joined item data (only for linked items)
  item_title?: string
  item_category?: string
  item_image_urls?: string[]
}

/**
 * Service for handling item list operations
 */
export class ItemListService {
  /**
   * Create a new item list
   */
  static async createList(
    data: CreateListData,
  ): Promise<{ data: ItemList | null; error: PostgrestError | null }> {
    try {
      const { data: createdList, error } = await supabase
        .from("item_lists")
        .insert({
          user_id: data.user_id,
          name: data.name,
          description: data.description,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating list:", error)
        return { data: null, error }
      }

      return { data: createdList, error: null }
    } catch (error) {
      console.error("Error creating list:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get all lists for a user with item counts
   */
  static async getUserLists(
    userId: string,
  ): Promise<{ data: ItemList[] | null; error: PostgrestError | null }> {
    try {
      const { data: lists, error } = await supabase
        .from("item_lists")
        .select(
          `
          *,
          list_items(
            id,
            is_completed
          )
        `,
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error getting user lists:", error)
        return { data: null, error }
      }

      // Process the data to calculate counts
      const processedLists = lists?.map((list) => {
        const itemCount = list.list_items?.length || 0
        const completedCount = list.list_items?.filter((item: any) => item.is_completed).length || 0

        return {
          ...list,
          item_count: itemCount,
          completed_count: completedCount,
          list_items: undefined, // Remove the nested data
        }
      })

      return { data: processedLists || null, error: null }
    } catch (error) {
      console.error("Error getting user lists:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get a single list with all its items
   */
  static async getListWithItems(
    listId: string,
  ): Promise<{ data: (ItemList & { items: ListItem[] }) | null; error: PostgrestError | null }> {
    try {
      const { data: list, error: listError } = await supabase
        .from("item_lists")
        .select("*")
        .eq("id", listId)
        .single()

      if (listError) {
        console.error("Error getting list:", listError)
        return { data: null, error: listError }
      }

      const { data: listItems, error: itemsError } = await supabase
        .from("list_items")
        .select(
          `
          *,
          items(
            title,
            category,
            image_urls
          )
        `,
        )
        .eq("list_id", listId)
        .order("created_at", { ascending: true })

      if (itemsError) {
        console.error("Error getting list items:", itemsError)
        return { data: null, error: itemsError }
      }

      // Process the items data
      const processedItems = listItems?.map((item) => ({
        ...item,
        item_title: item.is_text_item ? item.text_content : item.items?.title,
        item_category: item.items?.category,
        item_image_urls: item.items?.image_urls,
        items: undefined, // Remove the nested data
      }))

      return {
        data: {
          ...list,
          items: processedItems || [],
        },
        error: null,
      }
    } catch (error) {
      console.error("Error getting list with items:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Add an item to a list
   */
  static async addItemToList(
    listId: string,
    itemId: string,
    quantity: number = 1,
    notes?: string,
  ): Promise<{ data: ListItem | null; error: PostgrestError | null }> {
    try {
      const { data: listItem, error } = await supabase
        .from("list_items")
        .insert({
          list_id: listId,
          item_id: itemId,
          is_text_item: false,
          quantity,
          notes,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding item to list:", error)
        return { data: null, error }
      }

      return { data: listItem, error: null }
    } catch (error) {
      console.error("Error adding item to list:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Add a text item to a list
   */
  static async addTextItemToList(
    listId: string,
    textContent: string,
    quantity: number = 1,
    notes?: string,
  ): Promise<{ data: ListItem | null; error: PostgrestError | null }> {
    try {
      const { data: listItem, error } = await supabase
        .from("list_items")
        .insert({
          list_id: listId,
          text_content: textContent,
          is_text_item: true,
          quantity,
          notes,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding text item to list:", error)
        return { data: null, error }
      }

      return { data: listItem, error: null }
    } catch (error) {
      console.error("Error adding text item to list:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update list item (quantity, notes, completion status)
   */
  static async updateListItem(
    listItemId: string,
    data: Partial<{
      quantity: number
      notes: string
      is_completed: boolean
    }>,
  ): Promise<{ data: ListItem | null; error: PostgrestError | null }> {
    try {
      const { data: updatedItem, error } = await supabase
        .from("list_items")
        .update(data)
        .eq("id", listItemId)
        .select()
        .single()

      if (error) {
        console.error("Error updating list item:", error)
        return { data: null, error }
      }

      return { data: updatedItem, error: null }
    } catch (error) {
      console.error("Error updating list item:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Remove an item from a list
   */
  static async removeItemFromList(listItemId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase.from("list_items").delete().eq("id", listItemId)

      if (error) {
        console.error("Error removing item from list:", error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Error removing item from list:", error)
      return { error: error as PostgrestError }
    }
  }

  /**
   * Delete a list and all its items
   */
  static async deleteList(listId: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase.from("item_lists").delete().eq("id", listId)

      if (error) {
        console.error("Error deleting list:", error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Error deleting list:", error)
      return { error: error as PostgrestError }
    }
  }

  /**
   * Archive a list (set is_active to false)
   */
  static async archiveList(
    listId: string,
  ): Promise<{ data: ItemList | null; error: PostgrestError | null }> {
    try {
      const { data: archivedList, error } = await supabase
        .from("item_lists")
        .update({ is_active: false })
        .eq("id", listId)
        .select()
        .single()

      if (error) {
        console.error("Error archiving list:", error)
        return { data: null, error }
      }

      return { data: archivedList, error: null }
    } catch (error) {
      console.error("Error archiving list:", error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }
}
