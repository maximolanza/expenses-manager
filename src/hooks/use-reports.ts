"use client"

import { useCallback, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database } from "@/types/supabase"

type Store = Database["public"]["Tables"]["stores"]["Row"] & {
  category: Database["public"]["Tables"]["store_categories"]["Row"]
}

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  store: Store
  items: Database["public"]["Tables"]["ticket_items"]["Row"][]
}

export type ReportSummary = {
  totalAmount: number
  ticketCount: number
  storeCount: number
  averageTicketAmount: number
  byPaymentMethod: {
    Debito: number
    Credito: number
  }
  byStore: {
    storeId: number
    storeName: string
    categoryName: string
    total: number
    ticketCount: number
  }[]
  byCategory: {
    categoryId: number
    categoryName: string
    total: number
    ticketCount: number
  }[]
  recentTickets: Ticket[]
}

export function useReports() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)

  const getReportSummary = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<ReportSummary | null> => {
    if (!workspace) return null

    try {
      setLoading(true)

      // Obtener tickets con sus items y detalles de la tienda
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          store:stores(
            id,
            name,
            category:store_categories(
              id,
              name
            )
          ),
          items:ticket_items(
            id,
            quantity,
            unit_price,
            total_price,
            description,
            product:products(
              id,
              name,
              category:product_categories(
                id,
                name
              )
            )
          )
        `)
        .eq("workspace_id", workspace.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })

      if (ticketsError) throw ticketsError

      if (!tickets || tickets.length === 0) {
        return {
          totalAmount: 0,
          ticketCount: 0,
          storeCount: 0,
          averageTicketAmount: 0,
          byPaymentMethod: { Debito: 0, Credito: 0 },
          byStore: [],
          byCategory: [],
          recentTickets: []
        }
      }

      // Calcular totales por método de pago
      const byPaymentMethod = tickets.reduce(
        (acc, ticket) => {
          acc[ticket.payment_method] += ticket.total_amount
          return acc
        },
        { Debito: 0, Credito: 0 }
      )

      // Calcular totales por tienda
      const byStore = Object.values(tickets.reduce((acc, ticket) => {
        if (!ticket.store) return acc
        
        const key = ticket.store.id
        if (!acc[key]) {
          acc[key] = {
            storeId: ticket.store.id,
            storeName: ticket.store.name,
            categoryName: ticket.store.category.name,
            total: 0,
            ticketCount: 0
          }
        }
        acc[key].total += ticket.total_amount
        acc[key].ticketCount++
        return acc
      }, {} as Record<number, ReportSummary["byStore"][0]>))

      // Calcular totales por categoría
      const byCategory = Object.values(tickets.reduce((acc, ticket) => {
        if (!ticket.store?.category) return acc
        
        const key = ticket.store.category.id
        if (!acc[key]) {
          acc[key] = {
            categoryId: ticket.store.category.id,
            categoryName: ticket.store.category.name,
            total: 0,
            ticketCount: 0
          }
        }
        acc[key].total += ticket.total_amount
        acc[key].ticketCount++
        return acc
      }, {} as Record<number, ReportSummary["byCategory"][0]>))

      // Calcular totales generales
      const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.total_amount, 0)
      const uniqueStores = new Set(tickets.map(t => t.store?.id).filter(Boolean))

      return {
        totalAmount,
        ticketCount: tickets.length,
        storeCount: uniqueStores.size,
        averageTicketAmount: totalAmount / tickets.length,
        byPaymentMethod,
        byStore: byStore.sort((a, b) => b.total - a.total),
        byCategory: byCategory.sort((a, b) => b.total - a.total),
        recentTickets: tickets.slice(0, 5)
      }
    } catch (error) {
      console.error("Error getting report summary:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  return {
    loading,
    getReportSummary
  }
} 