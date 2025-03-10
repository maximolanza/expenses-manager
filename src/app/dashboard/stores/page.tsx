"use client"

import { useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { DataTable } from "./components/data-table"
import { StoreDialog } from "./components/store-dialog"
import { Loader2 } from "lucide-react"

// Definición de la estructura de datos que devuelve Supabase
// Debe coincidir con la interfaz Store del componente DataTable
interface Store {
  id: number
  name: string
  location: string | null
  category_id: number
  workspace_id: number
  metadata: Record<string, any>
  enabled: boolean
  categories: {
    id: number
    name: string
  } | null
}

export default function StoresPage() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStores = useCallback(async () => {
    if (!workspace) {
      console.log("No workspace selected")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          location,
          category_id,
          workspace_id,
          metadata,
          enabled,
          categories:store_categories!category_id (
            id,
            name
          )
        `)
        .eq('workspace_id', workspace.id)
        .eq('enabled', true) // Solo mostrar tiendas habilitadas
        .order('name')

      if (error) {
        console.error("Stores query error:", error)
        throw error
      }

      console.log("Stores fetched:", data)
      // Forzar el tipo para evitar errores de TypeScript
      // Esto es seguro porque la estructura de datos coincide
      setStores(data as any as Store[])

    } catch (error) {
      console.error("Error fetching stores:", error)
      setStores([])
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  if (!workspace) {
    return <div className="flex justify-center items-center h-full">
      <p className="text-muted-foreground">Selecciona un espacio de trabajo</p>
    </div>
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tiendas</h2>
        <StoreDialog onStoreCreated={() => fetchStores()} />
      </div>
      <DataTable data={stores} onDataChange={fetchStores} />
    </div>
  )
} 