"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/types/supabase"

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"]
}

export function useExpenses() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getExpenses = useCallback(async () => {
    if (!user) {
      setError("Usuario no autenticado")
      return []
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("expenses")
        .select("*, categories(*)")
        .eq("user_id", user.id)
        .order("inserted_at", { ascending: false })

      if (error) {
        console.error("Error fetching expenses:", error)
        setError(error.message)
        return []
      }

      return data as Expense[]
    } catch (error) {
      console.error("Error in getExpenses:", error)
      setError("Error al obtener los gastos")
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  const addExpense = useCallback(
    async (expense: Omit<Expense, "id" | "inserted_at" | "updated_at" | "categories">) => {
      if (!user) {
        setError("Usuario no autenticado")
        return null
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("expenses")
          .insert({
            ...expense,
            user_id: user.id,
            inserted_at: new Date().toISOString()
          })
          .select("*, categories(*)")
          .single()

        if (error) {
          console.error("Error adding expense:", error)
          setError(error.message)
          return null
        }

        return data as Expense
      } catch (error) {
        console.error("Error in addExpense:", error)
        setError("Error al crear el gasto")
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase, user]
  )

  const updateExpense = useCallback(
    async (
      id: number,
      expense: Partial<Omit<Expense, "id" | "created_at" | "categories">>
    ) => {
      if (!user) {
        setError("Usuario no autenticado")
        return null
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("expenses")
          .update(expense)
          .eq("id", id)
          .eq("user_id", user.id)
          .select("*, categories(*)")
          .single()

        if (error) {
          console.error("Error updating expense:", error)
          setError(error.message)
          return null
        }

        return data as Expense
      } catch (error) {
        console.error("Error in updateExpense:", error)
        setError("Error al actualizar el gasto")
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase, user]
  )

  const deleteExpense = useCallback(
    async (id: number) => {
      if (!user) {
        setError("Usuario no autenticado")
        return false
      }

      try {
        setLoading(true)
        setError(null)

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)

        if (error) {
          console.error("Error deleting expense:", error)
          setError(error.message)
          return false
        }

        return true
      } catch (error) {
        console.error("Error in deleteExpense:", error)
        setError("Error al eliminar el gasto")
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase, user]
  )

  return {
    loading,
    error,
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  }
} 