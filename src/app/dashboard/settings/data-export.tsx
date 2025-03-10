"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Loader2, FileUp } from "lucide-react"
import { AlertToast } from "@/components/ui/alert-toast"
import type { Database } from "@/types/supabase"

type ExportOption = "products" | "tickets" | "tickets-with-items"

// Definimos interfaces para los tipos de Supabase para facilitar el manejo
interface ProductWithRelations {
  id: number
  name: string
  description: string | null
  barcode: string | null
  enabled: boolean
  created_at: string
  category: { name: string } | null
  brand: { name: string } | null
}

interface StoreWithName {
  name: string
}

interface TicketWithStore {
  id: number
  date: string
  total_amount: number
  payment_method: string
  installments: number | null
  current_installment: number | null
  store: StoreWithName | null
}

interface ProductWithName {
  name: string
}

interface TicketItem {
  id: number
  quantity: number
  unit_price: number
  total_price: number
  description: string
  product: ProductWithName | null
}

interface TicketWithItems extends TicketWithStore {
  items: TicketItem[]
}

export function DataExport() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [exportOption, setExportOption] = useState<ExportOption>("products")
  const [isExporting, setIsExporting] = useState(false)

  // Función para convertir un array de objetos a CSV
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""
    
    // Obtener los encabezados del primer objeto
    const headers = Object.keys(data[0])
    
    // Crear la fila de encabezados
    const csvRows = [headers.join(",")]
    
    // Crear las filas de datos
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header]
        // Escapar comillas dobles y envolver en comillas si es necesario
        if (val === null || val === undefined) return '""'
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      })
      csvRows.push(values.join(","))
    }
    
    return csvRows.join("\n")
  }

  // Función para descargar datos como archivo CSV
  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para exportar productos
  const exportProducts = async () => {
    if (!workspace) return
    
    try {
      setIsExporting(true)
      
      // Obtener todos los productos con información relacionada
      const { data: products, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          barcode,
          enabled,
          created_at,
          category:product_categories(name),
          brand:brands(name)
        `)
        .eq("workspace_id", workspace.id)
      
      if (error) throw error
      
      if (!products || products.length === 0) {
        AlertToast.warning("No hay productos para exportar")
        return
      }
      
      // Transformar los datos para el CSV
      const formattedData = products.map((product: ProductWithRelations) => ({
        ID: product.id,
        Nombre: product.name,
        Descripción: product.description || "",
        Código_Barras: product.barcode || "",
        Categoría: product.category ? product.category.name : "",
        Marca: product.brand ? product.brand.name : "",
        Habilitado: product.enabled ? "Sí" : "No",
        Fecha_Creación: product.created_at
      }))
      
      // Convertir a CSV y descargar
      const csvContent = convertToCSV(formattedData)
      downloadCSV(csvContent, `productos_${new Date().toISOString().split('T')[0]}.csv`)
      
      AlertToast.success(`${products.length} productos exportados exitosamente`)
      
    } catch (error: any) {
      console.error("Error al exportar productos:", error)
      AlertToast.error(`Error al exportar productos: ${error.message || "Error desconocido"}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Función para exportar tickets
  const exportTickets = async () => {
    if (!workspace) return
    
    try {
      setIsExporting(true)
      
      // Obtener todos los tickets con información relacionada
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select(`
          id,
          date,
          total_amount,
          payment_method,
          installments,
          current_installment,
          store:stores(name)
        `)
        .eq("workspace_id", workspace.id)
        .order("date", { ascending: false })
      
      if (error) throw error
      
      if (!tickets || tickets.length === 0) {
        AlertToast.warning("No hay tickets para exportar")
        return
      }
      
      // Transformar los datos para el CSV
      const formattedData = tickets.map((ticket: TicketWithStore) => ({
        ID: ticket.id,
        Fecha: ticket.date,
        Tienda: ticket.store ? ticket.store.name : "No especificada",
        Total: ticket.total_amount,
        Método_Pago: ticket.payment_method,
        Cuotas: ticket.installments || 1,
        Cuota_Actual: ticket.current_installment || 1
      }))
      
      // Convertir a CSV y descargar
      const csvContent = convertToCSV(formattedData)
      downloadCSV(csvContent, `tickets_${new Date().toISOString().split('T')[0]}.csv`)
      
      AlertToast.success(`${tickets.length} tickets exportados exitosamente`)
      
    } catch (error: any) {
      console.error("Error al exportar tickets:", error)
      AlertToast.error(`Error al exportar tickets: ${error.message || "Error desconocido"}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Función para exportar tickets con sus items
  const exportTicketsWithItems = async () => {
    if (!workspace) return
    
    try {
      setIsExporting(true)
      
      // Obtener todos los tickets con sus items
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          id,
          date,
          total_amount,
          payment_method,
          store:stores(name),
          items:ticket_items(
            id,
            quantity,
            unit_price,
            total_price,
            description,
            product:products(name)
          )
        `)
        .eq("workspace_id", workspace.id)
        .order("date", { ascending: false })
      
      if (ticketsError) throw ticketsError
      
      if (!tickets || tickets.length === 0) {
        AlertToast.warning("No hay tickets para exportar")
        return
      }
      
      // Transformar los datos para el CSV (aplanando la estructura)
      const formattedData: any[] = []
      
      tickets.forEach((ticket: TicketWithItems) => {
        if (!ticket.items || ticket.items.length === 0) {
          // Agregar ticket sin items
          formattedData.push({
            Ticket_ID: ticket.id,
            Fecha: ticket.date,
            Tienda: ticket.store ? ticket.store.name : "No especificada",
            Método_Pago: ticket.payment_method,
            Total_Ticket: ticket.total_amount,
            Item_ID: "",
            Producto: "",
            Descripción: "",
            Cantidad: "",
            Precio_Unitario: "",
            Total_Item: ""
          })
        } else {
          // Agregar cada item con su información de ticket
          ticket.items.forEach(item => {
            formattedData.push({
              Ticket_ID: ticket.id,
              Fecha: ticket.date,
              Tienda: ticket.store ? ticket.store.name : "No especificada",
              Método_Pago: ticket.payment_method,
              Total_Ticket: ticket.total_amount,
              Item_ID: item.id,
              Producto: item.product ? item.product.name : "No especificado",
              Descripción: item.description || "",
              Cantidad: item.quantity,
              Precio_Unitario: item.unit_price,
              Total_Item: item.total_price
            })
          })
        }
      })
      
      // Convertir a CSV y descargar
      const csvContent = convertToCSV(formattedData)
      downloadCSV(csvContent, `tickets_con_items_${new Date().toISOString().split('T')[0]}.csv`)
      
      AlertToast.success(`${tickets.length} tickets con sus items exportados exitosamente`)
      
    } catch (error: any) {
      console.error("Error al exportar tickets con items:", error)
      AlertToast.error(`Error al exportar tickets con items: ${error.message || "Error desconocido"}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Función para manejar la exportación según la opción seleccionada
  const handleExport = async () => {
    switch (exportOption) {
      case "products":
        await exportProducts()
        break
      case "tickets":
        await exportTickets()
        break
      case "tickets-with-items":
        await exportTicketsWithItems()
        break
      default:
        AlertToast.error("Selecciona una opción válida para exportar")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importación y Exportación de datos</CardTitle>
        <CardDescription>
          Exporta tus datos a archivos CSV para análisis o respaldo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar datos</TabsTrigger>
            <TabsTrigger value="import" disabled>Importar datos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Selecciona los datos a exportar:</p>
              <Select
                value={exportOption}
                onValueChange={(value: ExportOption) => setExportOption(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Lista de productos</SelectItem>
                  <SelectItem value="tickets">Lista de tickets</SelectItem>
                  <SelectItem value="tickets-with-items">Tickets con sus items</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-6">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a CSV
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="p-4 bg-muted rounded-md text-center">
              <FileUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                La importación de datos estará disponible próximamente.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 