import { PostgrestError } from "@supabase/supabase-js"

import { supabase } from "./supabase"

/**
 * Service for handling database operations with Supabase
 */
export class DatabaseService {
  /**
   * Get all items from a table
   */
  static async getAll<T>(
    table: string,
    options?: {
      columns?: string
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
      filter?: { column: string; value: any; operator?: string }
    },
  ): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    try {
      let query = supabase.from(table).select(options?.columns || "*")

      // Apply ordering if specified
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      // Apply limit if specified
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      // Apply filter if specified
      if (options?.filter) {
        const { column, value, operator = "eq" } = options.filter
        query = query.filter(column, operator, value)
      }

      const { data, error } = await query

      return { data: data as T[] | null, error }
    } catch (error) {
      console.error(`Error getting data from ${table}:`, error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Get a single item from a table by ID
   */
  static async getById<T>(
    table: string,
    id: string | number,
    options?: {
      columns?: string
      idColumn?: string
    },
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const idColumn = options?.idColumn || "id"

      const { data, error } = await supabase
        .from(table)
        .select(options?.columns || "*")
        .eq(idColumn, id)
        .single()

      return { data: data as T | null, error }
    } catch (error) {
      console.error(`Error getting item from ${table} with ID ${id}:`, error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Create a new item in a table
   */
  static async create<T>(
    table: string,
    data: Record<string, any>,
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const { data: createdData, error } = await supabase.from(table).insert(data).select().single()

      return { data: createdData as T | null, error }
    } catch (error) {
      console.error(`Error creating item in ${table}:`, error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Update an item in a table
   */
  static async update<T>(
    table: string,
    id: string | number,
    data: Record<string, any>,
    options?: {
      idColumn?: string
    },
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const idColumn = options?.idColumn || "id"

      const { data: updatedData, error } = await supabase
        .from(table)
        .update(data)
        .eq(idColumn, id)
        .select()
        .single()

      return { data: updatedData as T | null, error }
    } catch (error) {
      console.error(`Error updating item in ${table} with ID ${id}:`, error)
      return {
        data: null,
        error: error as PostgrestError,
      }
    }
  }

  /**
   * Delete an item from a table
   */
  static async delete(
    table: string,
    id: string | number,
    options?: {
      idColumn?: string
    },
  ): Promise<{ error: PostgrestError | null }> {
    try {
      const idColumn = options?.idColumn || "id"

      const { error } = await supabase.from(table).delete().eq(idColumn, id)

      return { error }
    } catch (error) {
      console.error(`Error deleting item from ${table} with ID ${id}:`, error)
      return {
        error: error as PostgrestError,
      }
    }
  }
}
