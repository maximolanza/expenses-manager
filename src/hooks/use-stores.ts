"use client"

import { useCallback, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database } from "@/types/supabase"

type Store = Database["public"]["Tables"]["stores"]["Row"]
type StoreInput = Database["public"]["Tables"]["stores"]["Insert"]

export function useStores() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)

  const getStores = useCallback(async () => {
    if (!workspace) return []

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("stores")
        .select(`
          *,
          category:store_categories(
            id,
            name
          )
        `)
        .eq("workspace_id", workspace.id)
        .order("name")

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching stores:", error)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const getStoreCategories = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .order("name")

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching store categories:", error)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createStore = useCallback(async (data: {
    name: string
    location?: string | null
    categoryId: number
  }) => {
    if (!workspace) return null

    try {
      setLoading(true)
      const { data: store, error } = await supabase
        .from("stores")
        .insert([
          {
            workspace_id: workspace.id,
            name: data.name,
            location: data.location,
            category_id: data.categoryId,
            metadata: {},
          },
        ])
        .select(`
          *,
          category:store_categories(
            id,
            name
          )
        `)
        .single()

      if (error) {
        throw error
      }

      return store
    } catch (error) {
      console.error("Error creating store:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const updateStore = useCallback(async (
    id: number,
    data: {
      name?: string
      location?: string | null
      categoryId?: number
    }
  ) => {
    if (!workspace) return null

    try {
      setLoading(true)
      const { data: store, error } = await supabase
        .from("stores")
        .update({
          name: data.name,
          location: data.location,
          category_id: data.categoryId,
        })
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .select(`
          *,
          category:store_categories(
            id,
            name
          )
        `)
        .single()

      if (error) {
        throw error
      }

      return store
    } catch (error) {
      console.error("Error updating store:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const deleteStore = useCallback(async (id: number) => {
    if (!workspace) return false

    try {
      setLoading(true)
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspace.id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting store:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  return {
    loading,
    getStores,
    getStoreCategories,
    createStore,
    updateStore,
    deleteStore,
  }
} 