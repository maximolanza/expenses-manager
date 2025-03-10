"use client"

import { useCallback, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database, PointsConversionType } from "@/types/supabase"

type PointsSystem = Database["public"]["Tables"]["points_systems"]["Row"]
type PointsBalance = Database["public"]["Tables"]["user_points_balance"]["Row"]
type PointsTransaction = Database["public"]["Tables"]["points_transactions"]["Row"]

export function usePoints() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)

  // Obtener todos los sistemas de puntos del workspace
  const getPointsSystems = useCallback(async () => {
    if (!workspace) return { systems: [], count: 0 }

    try {
      setLoading(true)
      const { data, error, count } = await supabase
        .from("points_systems")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      return { systems: data || [], count: count || 0 }
    } catch (error) {
      console.error("Error fetching points systems:", error)
      return { systems: [], count: 0 }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Crear un nuevo sistema de puntos
  const createPointsSystem = useCallback(async (data: {
    name: string
    point_name_singular: string
    point_name_plural: string
    conversion_type: PointsConversionType
    conversion_rate?: number | null
    enabled?: boolean
    available_for_purchases?: boolean
    metadata?: Record<string, any>
  }) => {
    if (!workspace) return { success: false, error: "No workspace selected" }

    try {
      setLoading(true)
      const { data: newSystem, error } = await supabase
        .from("points_systems")
        .insert({
          workspace_id: workspace.id,
          name: data.name,
          point_name_singular: data.point_name_singular,
          point_name_plural: data.point_name_plural,
          conversion_type: data.conversion_type,
          conversion_rate: data.conversion_rate,
          enabled: data.enabled ?? true,
          available_for_purchases: data.available_for_purchases ?? true,
          created_at: new Date().toISOString(),
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, system: newSystem }
    } catch (error) {
      console.error("Error creating points system:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Actualizar un sistema de puntos existente
  const updatePointsSystem = useCallback(async (
    id: number,
    data: Partial<{
      name: string
      point_name_singular: string
      point_name_plural: string
      conversion_type: PointsConversionType
      conversion_rate: number | null
      enabled: boolean
      available_for_purchases: boolean
      metadata: Record<string, any>
    }>
  ) => {
    if (!workspace) return { success: false, error: "No workspace selected" }

    try {
      setLoading(true)
      const { data: updatedSystem, error } = await supabase
        .from("points_systems")
        .update(data)
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .select()
        .single()

      if (error) throw error

      return { success: true, system: updatedSystem }
    } catch (error) {
      console.error("Error updating points system:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Eliminar un sistema de puntos
  const deletePointsSystem = useCallback(async (id: number) => {
    if (!workspace) return { success: false, error: "No workspace selected" }

    try {
      setLoading(true)
      const { error } = await supabase
        .from("points_systems")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspace.id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error("Error deleting points system:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Obtener el saldo de puntos del usuario para todos los sistemas o uno específico
  const getUserPointsBalance = useCallback(async (pointsSystemId?: number) => {
    if (!workspace) return { balances: [], total: 0 }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      let query = supabase
        .from("user_points_balance")
        .select(`
          *,
          points_system:points_systems(*)
        `)
        .eq("user_id", user.id)

      if (pointsSystemId) {
        query = query.eq("points_system_id", pointsSystemId)
      }

      const { data, error } = await query

      if (error) throw error

      // Calcular el total de puntos sumando los saldos
      const total = data?.reduce((sum, balance) => sum + balance.balance, 0) || 0

      return { 
        balances: data || [], 
        total,
        balancesBySystem: data?.reduce((acc, balance) => {
          acc[balance.points_system_id] = balance
          return acc
        }, {} as Record<number, typeof data[0]>) || {}
      }
    } catch (error) {
      console.error("Error fetching user points balance:", error)
      return { balances: [], total: 0, balancesBySystem: {} }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Obtener el historial de transacciones de puntos
  const getPointsTransactions = useCallback(async (pointsSystemId?: number, limit = 20) => {
    if (!workspace) return { transactions: [] }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      let query = supabase
        .from("points_transactions")
        .select(`
          *,
          points_system:points_systems(*),
          ticket:tickets(
            id,
            date,
            total_amount,
            store:stores(
              id,
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(limit)

      if (pointsSystemId) {
        query = query.eq("points_system_id", pointsSystemId)
      }

      const { data, error } = await query

      if (error) throw error

      return { transactions: data || [] }
    } catch (error) {
      console.error("Error fetching points transactions:", error)
      return { transactions: [] }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Funciones para calcular puntos para un monto monetario
  const calculatePointsForAmount = useCallback(
    (amount: number, system: PointsSystem) => {
      if (!system) return 0

      if (system.conversion_type === "fixed" && system.conversion_rate) {
        // Conversión fija: multiplicar el monto por la tasa
        return Math.floor(amount * system.conversion_rate)
      } else if (system.conversion_type === "variable") {
        // Para conversión variable, usamos la información del metadata
        const metadata = system.metadata as Record<string, any>;
        const tiers = metadata?.tiers || []
        if (!tiers.length) return 0

        // Ordenar los rangos por monto mínimo
        const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount)
        
        // Encontrar el rango aplicable
        const applicableTier = sortedTiers
          .filter(tier => amount >= tier.minAmount)
          .pop()

        if (!applicableTier) return 0
        
        return Math.floor(amount * applicableTier.rate)
      }

      return 0
    },
    []
  )

  // Funciones para calcular el valor monetario de los puntos
  const calculateAmountForPoints = useCallback(
    (points: number, system: PointsSystem) => {
      if (!system) return 0

      if (system.conversion_type === "fixed" && system.conversion_rate) {
        // Conversión fija: dividir los puntos por la tasa
        return points / system.conversion_rate
      } else if (system.conversion_type === "variable") {
        // Para conversión variable, usamos la información del metadata
        const metadata = system.metadata as Record<string, any>;
        const tiers = metadata?.tiers || []
        if (!tiers.length) return 0

        // Para simplificar, usar la tasa del primer rango
        // (en un caso real, podría ser más complejo)
        const rate = tiers[0]?.rate || 0
        
        if (rate === 0) return 0
        
        return points / rate
      }

      return 0
    },
    []
  )

  // Añadir puntos a un usuario (por ejemplo, al crear un ticket)
  const addPointsToUser = useCallback(async (
    data: {
      pointsSystemId: number
      amount: number
      ticketId?: number
      description?: string
      metadata?: Record<string, any>
    }
  ) => {
    if (!workspace) return { success: false, error: "No workspace selected" }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // 1. Verificar si el usuario ya tiene un saldo para este sistema de puntos
      const { data: balanceData, error: balanceError } = await supabase
        .from("user_points_balance")
        .select("*")
        .eq("user_id", user.id)
        .eq("points_system_id", data.pointsSystemId)
        .single()

      if (balanceError && balanceError.code !== "PGRST116") {
        // Error diferente a "no se encontró ningún registro"
        throw balanceError
      }

      // 2. Crear una transacción de puntos
      const { data: transaction, error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: user.id,
          points_system_id: data.pointsSystemId,
          amount: data.amount,
          ticket_id: data.ticketId || null,
          transaction_date: new Date().toISOString(),
          description: data.description || "Puntos ganados",
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // 3. Actualizar o crear el saldo de puntos
      if (balanceData) {
        // Actualizar saldo existente
        const newBalance = balanceData.balance + data.amount
        const { data: updatedBalance, error: updateError } = await supabase
          .from("user_points_balance")
          .update({
            balance: newBalance,
            last_updated: new Date().toISOString()
          })
          .eq("id", balanceData.id)
          .select()
          .single()

        if (updateError) throw updateError

        return { success: true, transaction, balance: updatedBalance }
      } else {
        // Crear nuevo saldo
        const { data: newBalance, error: insertError } = await supabase
          .from("user_points_balance")
          .insert({
            user_id: user.id,
            points_system_id: data.pointsSystemId,
            balance: data.amount,
            last_updated: new Date().toISOString(),
            metadata: {}
          })
          .select()
          .single()

        if (insertError) throw insertError

        return { success: true, transaction, balance: newBalance }
      }
    } catch (error) {
      console.error("Error adding points to user:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  // Usar puntos para un descuento
  const usePointsForDiscount = useCallback(async (
    data: {
      pointsSystemId: number
      pointsToUse: number
      ticketId?: number
      discountAmount: number
      description?: string
      metadata?: Record<string, any>
    }
  ) => {
    if (!workspace) return { success: false, error: "No workspace selected" }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // 1. Verificar si el usuario tiene suficientes puntos
      const { data: balanceData, error: balanceError } = await supabase
        .from("user_points_balance")
        .select("*")
        .eq("user_id", user.id)
        .eq("points_system_id", data.pointsSystemId)
        .single()

      if (balanceError) throw balanceError

      if (balanceData.balance < data.pointsToUse) {
        throw new Error("Saldo insuficiente de puntos")
      }

      // 2. Crear una transacción de puntos (negativa para representar uso)
      const { data: transaction, error: transactionError } = await supabase
        .from("points_transactions")
        .insert({
          user_id: user.id,
          points_system_id: data.pointsSystemId,
          amount: -data.pointsToUse, // Negativo porque se están usando
          ticket_id: data.ticketId || null,
          transaction_date: new Date().toISOString(),
          description: data.description || "Puntos canjeados",
          metadata: {
            ...data.metadata,
            discount_amount: data.discountAmount
          }
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // 3. Actualizar el saldo de puntos
      const newBalance = balanceData.balance - data.pointsToUse
      const { data: updatedBalance, error: updateError } = await supabase
        .from("user_points_balance")
        .update({
          balance: newBalance,
          last_updated: new Date().toISOString()
        })
        .eq("id", balanceData.id)
        .select()
        .single()

      if (updateError) throw updateError

      return { 
        success: true, 
        transaction, 
        balance: updatedBalance,
        discountAmount: data.discountAmount 
      }
    } catch (error) {
      console.error("Error using points for discount:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  return {
    loading,
    getPointsSystems,
    createPointsSystem,
    updatePointsSystem,
    deletePointsSystem,
    getUserPointsBalance,
    getPointsTransactions,
    calculatePointsForAmount,
    calculateAmountForPoints,
    addPointsToUser,
    usePointsForDiscount
  }
} 