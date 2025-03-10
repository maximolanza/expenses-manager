"use client"

import { useCallback, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database } from "@/types/supabase"

type StoreCategory = Database["public"]["Tables"]["store_categories"]["Row"]
type StoreCategoryInput = Database["public"]["Tables"]["store_categories"]["Insert"]

export function useCategories() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)

  const getCategories = useCallback(async () => {
    if (!workspace) return []

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("store_categories")
        .select()
        .eq("workspace_id", workspace.id)
        .order("name")

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching categories:", error)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const createCategory = useCallback(async (data: {
    name: string
  }) => {
    if (!workspace) return null

    try {
      setLoading(true)
      const { data: category, error } = await supabase
        .from("store_categories")
        .insert([
          {
            workspace_id: workspace.id,
            name: data.name,
            metadata: {},
          },
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      return category
    } catch (error) {
      console.error("Error creating category:", error.response?.data || error.message || error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const updateCategory = useCallback(async (
    id: number,
    data: {
      name: string
    }
  ) => {
    if (!workspace) return null

    try {
      setLoading(true)
      const { data: category, error } = await supabase
        .from("store_categories")
        .update({
          name: data.name,
        })
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return category
    } catch (error) {
      console.error("Error updating category:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const deleteCategory = useCallback(async (id: number) => {
    if (!workspace) return false

    try {
      setLoading(true)
      const { error } = await supabase
        .from("store_categories")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspace.id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting category:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  return {
    loading,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
} 