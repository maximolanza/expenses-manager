"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlertToast } from "@/components/ui/alert-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

type DeleteOption = "specific-date" | "date-range" | "all"

export function DataCleanup() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [deleteOption, setDeleteOption] = useState<DeleteOption>("specific-date")
  const [specificDate, setSpecificDate] = useState<Date | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<{ tickets: number; products: number }>({
    tickets: 0,
    products: 0
  })
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si existen datos al cargar el componente
  useEffect(() => {
    const checkIfDataExists = async () => {
      if (!workspace) return;
      
      try {
        setIsLoading(true);
        
        // Verificar si hay tickets
        const { count: ticketsCount, error: ticketsError } = await supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);
        
        if (ticketsError) throw ticketsError;
        
        // Verificar si hay productos
        const { count: productsCount, error: productsError } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);
          
        if (productsError) throw productsError;
        
        // Actualizar el estado según los resultados
        setHasData((ticketsCount ?? 0) > 0 || (productsCount ?? 0) > 0);
      } catch (error) {
        console.error("Error al verificar datos:", error);
        setHasData(null); // Estado de error
      } finally {
        setIsLoading(false);
      }
    };
    
    checkIfDataExists();
  }, [supabase, workspace]);

  // Función para contar los elementos que serían eliminados
  const countItemsToDelete = async () => {
    if (!workspace) return
    
    try {
      let ticketsQuery = supabase
        .from("tickets")
        .select("id", { count: "exact" })
        .eq("workspace_id", workspace.id)
        
      let productsQuery = supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("workspace_id", workspace.id)
        
      // Aplicar filtros de fecha
      if (deleteOption === "specific-date" && specificDate) {
        const dateStr = format(specificDate, "yyyy-MM-dd")
        ticketsQuery = ticketsQuery.eq("date", dateStr)
      } else if (deleteOption === "date-range" && dateRange.from && dateRange.to) {
        const fromStr = format(dateRange.from, "yyyy-MM-dd")
        const toStr = format(dateRange.to, "yyyy-MM-dd")
        ticketsQuery = ticketsQuery.gte("date", fromStr).lte("date", toStr)
      }
      
      const [ticketsResult, productsResult] = await Promise.all([
        ticketsQuery,
        deleteOption === "all" ? productsQuery : { count: 0 }
      ])
      
      setItemsToDelete({
        tickets: ticketsResult.count || 0,
        products: deleteOption === "all" ? (productsResult.count || 0) : 0
      })
      
    } catch (error) {
      console.error("Error al contar elementos:", error)
      AlertToast.error("Error al contar elementos a eliminar")
    }
  }

  // Función para eliminar los datos según los criterios seleccionados
  const deleteData = async () => {
    if (!workspace) return
    
    try {
      setIsProcessing(true)
      
      // Primero tenemos que eliminar los items de los tickets, ya que tienen dependencias
      let ticketsToDeleteQuery = supabase
        .from("tickets")
        .select("id")
        .eq("workspace_id", workspace.id)
      
      // Aplicar filtros de fecha
      if (deleteOption === "specific-date" && specificDate) {
        const dateStr = format(specificDate, "yyyy-MM-dd")
        ticketsToDeleteQuery = ticketsToDeleteQuery.eq("date", dateStr)
      } else if (deleteOption === "date-range" && dateRange.from && dateRange.to) {
        const fromStr = format(dateRange.from, "yyyy-MM-dd")
        const toStr = format(dateRange.to, "yyyy-MM-dd")
        ticketsToDeleteQuery = ticketsToDeleteQuery.gte("date", fromStr).lte("date", toStr)
      }
      
      // Obtener IDs de tickets a eliminar
      const { data: ticketsToDelete, error: ticketsError } = await ticketsToDeleteQuery
      
      if (ticketsError) throw ticketsError
      
      let ticketsDeleted = 0;
      let productsDeleted = 0;
      
      if (ticketsToDelete && ticketsToDelete.length > 0) {
        // Eliminar los items de los tickets
        const ticketIds = ticketsToDelete.map(t => t.id)
        
        const { error: itemsError } = await supabase
          .from("ticket_items")
          .delete()
          .in("ticket_id", ticketIds)
        
        if (itemsError) throw itemsError
        
        // Eliminar los tickets
        const { error: deleteTicketsError } = await supabase
          .from("tickets")
          .delete()
          .in("id", ticketIds)
        
        if (deleteTicketsError) throw deleteTicketsError
        
        ticketsDeleted = ticketIds.length;
      }
      
      // Si se seleccionó eliminar todo, eliminar también los productos
      if (deleteOption === "all") {
        // Primero eliminar historial de precios (dependencia)
        const { error: priceHistoryError } = await supabase
          .from("product_price_history")
          .delete()
          .eq("workspace_id", workspace.id)
        
        if (priceHistoryError) throw priceHistoryError
        
        // Luego eliminar los productos
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .delete()
          .eq("workspace_id", workspace.id)
          .select('id')
        
        if (productsError) throw productsError
        
        productsDeleted = productsData?.length || 0;
      }
      
      // Crear mensaje de éxito basado en la operación específica
      let successMessage = "";
      
      if (deleteOption === "specific-date" && specificDate) {
        successMessage = `Se eliminaron ${ticketsDeleted} ticket(s) del ${format(specificDate, "PP", { locale: es })}`;
      } else if (deleteOption === "date-range" && dateRange.from && dateRange.to) {
        successMessage = `Se eliminaron ${ticketsDeleted} ticket(s) entre el ${format(dateRange.from, "PP", { locale: es })} y el ${format(dateRange.to, "PP", { locale: es })}`;
      } else if (deleteOption === "all") {
        successMessage = `Se eliminaron ${ticketsDeleted} ticket(s) y ${productsDeleted} producto(s) de la base de datos`;
      }
      
      // Mostrar mensaje de éxito
      AlertToast.success(successMessage || "Datos eliminados correctamente");
      
      // Restablecer los contadores
      setItemsToDelete({ tickets: 0, products: 0 })
      
      // Verificar si quedan datos después de la eliminación
      if (ticketsDeleted > 0 || productsDeleted > 0) {
        const { count: remainingTickets } = await supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);
          
        const { count: remainingProducts } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);
          
        setHasData((remainingTickets ?? 0) > 0 || (remainingProducts ?? 0) > 0);
      }
      
    } catch (error: any) {
      console.error("Error al eliminar datos:", error)
      
      // Crear mensaje de error más descriptivo
      let errorMessage = "Error al eliminar datos";
      
      if (error?.message) {
        // Si tenemos un mensaje específico del error
        errorMessage = `Error: ${error.message}`;
      } else if (deleteOption === "specific-date") {
        errorMessage = "Error al eliminar tickets de la fecha seleccionada";
      } else if (deleteOption === "date-range") {
        errorMessage = "Error al eliminar tickets del rango de fechas seleccionado";
      } else if (deleteOption === "all") {
        errorMessage = "Error al eliminar todos los tickets y productos";
      }
      
      AlertToast.error(errorMessage);
    } finally {
      setIsProcessing(false)
      setIsConfirmDialogOpen(false)
    }
  }

  // Función para manejar el clic en el botón de eliminar
  const handleDeleteClick = async () => {
    // Validar que se haya seleccionado una opción válida
    if (deleteOption === "specific-date" && !specificDate) {
      AlertToast.error("Debes seleccionar una fecha específica")
      return
    }
    
    if (deleteOption === "date-range" && (!dateRange.from || !dateRange.to)) {
      AlertToast.error("Debes seleccionar un rango de fechas completo")
      return
    }
    
    try {
      // Contar elementos que serían eliminados
      await countItemsToDelete()
      
      // Verificar si hay elementos para eliminar
      if (itemsToDelete.tickets === 0 && (deleteOption !== "all" || itemsToDelete.products === 0)) {
        AlertToast.warning("No hay datos que eliminar con los criterios seleccionados")
        return
      }
      
      // Abrir diálogo de confirmación
      setIsConfirmDialogOpen(true)
    } catch (error) {
      AlertToast.error("Error al verificar los datos a eliminar. Intenta de nuevo.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limpieza de datos</CardTitle>
        <CardDescription>
          Elimina tickets y productos de la base de datos. Esta acción no se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasData === false ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No existen tickets ni productos en la base de datos para eliminar.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Selecciona qué datos eliminar:</p>
              <Select
                value={deleteOption}
                onValueChange={(value: DeleteOption) => setDeleteOption(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific-date">Tickets de una fecha específica</SelectItem>
                  <SelectItem value="date-range">Tickets en un rango de fechas</SelectItem>
                  <SelectItem value="all">Todos los tickets y productos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {deleteOption === "specific-date" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selecciona la fecha:</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !specificDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {specificDate ? (
                        format(specificDate, "PP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={specificDate}
                      onSelect={setSpecificDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {deleteOption === "date-range" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selecciona el rango de fechas:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          format(dateRange.from, "PP", { locale: es })
                        ) : (
                          <span>Fecha inicial</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? (
                          format(dateRange.to, "PP", { locale: es })
                        ) : (
                          <span>Fecha final</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {deleteOption === "all" && (
              <div className="bg-destructive/10 p-4 rounded-md">
                <p className="text-sm font-medium text-destructive">
                  ¡Advertencia! Esta opción eliminará todos los tickets y productos de la base de datos.
                  Esta acción no se puede deshacer.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          disabled={isProcessing || isLoading || hasData === false}
          onClick={handleDeleteClick}
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando datos...
            </>
          ) : hasData === false ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              No hay datos para eliminar
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar datos
            </>
          )}
        </Button>
      </CardFooter>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              {deleteOption === "specific-date" && specificDate && (
                <>Estás a punto de eliminar {itemsToDelete.tickets} ticket(s) del {format(specificDate, "PP", { locale: es })}.</>
              )}
              {deleteOption === "date-range" && dateRange.from && dateRange.to && (
                <>
                  Estás a punto de eliminar {itemsToDelete.tickets} ticket(s) entre 
                  el {format(dateRange.from, "PP", { locale: es })} y 
                  el {format(dateRange.to, "PP", { locale: es })}.
                </>
              )}
              {deleteOption === "all" && (
                <>
                  Estás a punto de eliminar {itemsToDelete.tickets} ticket(s) y {itemsToDelete.products} producto(s) de tu base de datos.
                </>
              )}
              <br /><br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteData}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 