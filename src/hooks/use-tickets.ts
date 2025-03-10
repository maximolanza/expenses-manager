"use client"

import { useCallback, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database, PaymentMethod } from "@/types/supabase"
import { isoStringToDate, dateToISOString } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  store?: Database["public"]["Tables"]["stores"]["Row"] & {
    category: Database["public"]["Tables"]["store_categories"]["Row"]
  }
  items: (Database["public"]["Tables"]["ticket_items"]["Row"] & {
    product?: Database["public"]["Tables"]["products"]["Row"]
  })[]
}

type TicketInput = Database["public"]["Tables"]["tickets"]["Insert"]
type TicketItemInput = Database["public"]["Tables"]["ticket_items"]["Insert"]

export function useTickets() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)

  const getTickets = useCallback(async (page = 1, limit = 10, date?: string) => {
    if (!workspace) return { tickets: [], count: 0 }

    try {
      setLoading(true)
      
      // Calcular el offset basado en la página y el límite
      const from = (page - 1) * limit
      const to = from + limit - 1
      
      // Construir la consulta base
      let query = supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
      
      // Filtrar por fecha si se proporciona
      if (date) {
        // Asegurar que la fecha esté correctamente formateada
        query = query.eq("date", date)
      }
      
      // Obtener el conteo total de tickets
      const { count, error: countError } = await query
      
      if (countError) {
        throw countError
      }
      
      // Construir la consulta para obtener los tickets
      let ticketsQuery = supabase
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
            temporary_item,
            product:products(
              id,
              name,
              description
            )
          )
        `)
        .eq("workspace_id", workspace.id)
        .order("date", { ascending: false })
      
      // Filtrar por fecha si se proporciona
      if (date) {
        ticketsQuery = ticketsQuery.eq("date", date)
      }
      
      // Aplicar paginación
      ticketsQuery = ticketsQuery.range(from, to)
      
      // Ejecutar la consulta
      const { data, error } = await ticketsQuery

      if (error) {
        throw error
      }

      return { tickets: data, count: count || 0 }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      return { tickets: [], count: 0 }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const createTicket = useCallback(async (data: {
    storeId?: number
    date: string
    totalAmount: number
    paymentMethod: PaymentMethod
    installments?: number
    items: {
      description: string
      quantity: number
      unitPrice: number
      temporaryItem?: boolean
      productId?: number
    }[]
    metadata?: Record<string, any>
  }) => {
    if (!workspace) return null

    try {
      setLoading(true)

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("No se pudo obtener el usuario")

      // Mapear métodos de pago adicionales a valores aceptados por la base de datos
      let paymentMethod = data.paymentMethod;
      if (paymentMethod === "Efectivo" || paymentMethod === "Transferencia") {
        // Usar "Debito" como valor por defecto para estos métodos
        paymentMethod = "Debito";
        
        // Guardar el valor original en los metadatos
        if (!data.metadata) {
          data.metadata = {};
        }
        data.metadata.original_payment_method = data.paymentMethod;
      }

      // Crear el ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          store_id: data.storeId || null,
          date: data.date,
          total_amount: data.totalAmount,
          payment_method: paymentMethod,
          installments: data.installments || 1,
          current_installment: 1,
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (ticketError) {
        throw ticketError
      }

      // Crear los items del ticket
      const ticketItems = data.items.map(item => ({
        ticket_id: ticket.id,
        product_id: item.productId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        description: item.description || "",
        temporary_item: item.temporaryItem || false
      }))

      const { error: itemsError } = await supabase
        .from("ticket_items")
        .insert(ticketItems)

      if (itemsError) {
        throw itemsError
      }

      return { success: true, ticket }
    } catch (error) {
      console.error("Error creating ticket:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const updateTicket = useCallback(async (
    id: number,
    data: {
      storeId?: number
      date?: string
      totalAmount?: number
      paymentMethod?: PaymentMethod
      installments?: number
      currentInstallment?: number
      metadata?: Record<string, any>
    }
  ) => {
    if (!workspace) return null

    try {
      setLoading(true)

      const updateData: Partial<TicketInput> = {}

      if (data.storeId !== undefined) updateData.store_id = data.storeId
      if (data.date !== undefined) updateData.date = data.date
      if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount
      
      // Mapear métodos de pago adicionales a valores aceptados por la base de datos
      if (data.paymentMethod !== undefined) {
        if (data.paymentMethod === "Efectivo" || data.paymentMethod === "Transferencia") {
          // Usar "Debito" como valor por defecto para estos métodos
          updateData.payment_method = "Debito";
          
          // Guardar el valor original en los metadatos
          if (!data.metadata) {
            data.metadata = {};
          }
          data.metadata.original_payment_method = data.paymentMethod;
        } else {
          updateData.payment_method = data.paymentMethod;
        }
      }
      
      if (data.installments !== undefined) updateData.installments = data.installments
      if (data.currentInstallment !== undefined) updateData.current_installment = data.currentInstallment
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      const { data: ticket, error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", id)
        .eq("workspace_id", workspace.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return ticket
    } catch (error) {
      console.error("Error updating ticket:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const deleteTicket = useCallback(async (id: number) => {
    if (!workspace) return false

    try {
      setLoading(true)
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspace.id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting ticket:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const getTicketStats = useCallback(async (date?: string, period?: string) => {
    try {
      setLoading(true)
      
      // Asegurarnos de que tenemos un workspace
      if (!workspace) return { count: 0, sum: 0, payments: {} }
      
      // Convertir la fecha usando las funciones normalizadas
      const normalizedDate = date ? isoStringToDate(date) : new Date()
      const dateString = dateToISOString(normalizedDate)
      let startDate = `${dateString}T12:00:00`
      let endDate = `${dateString}T12:00:00`

      // ... existing code ...

      return { count: 0, sum: 0, payments: {} }
    } catch (error) {
      console.error("Error fetching ticket stats:", error)
      return { count: 0, sum: 0, payments: {} }
    } finally {
      setLoading(false)
    }
  }, [workspace])

  const groupTicketsByDate = useCallback((tickets: any[]) => {
    return tickets.reduce((groups: Record<string, any[]>, date: any) => {
      // Usar la función de utilidad para normalizar la fecha
      const dateValue = date.date ? isoStringToDate(date.date) : new Date();
      const uniqueDate = dateToISOString(dateValue);
      
      if (!groups[uniqueDate]) {
        groups[uniqueDate] = [];
      }
      groups[uniqueDate].push(date);
      return groups;
    }, {});
  }, []);

  return {
    loading,
    getTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketStats,
    groupTicketsByDate,
  }
} 