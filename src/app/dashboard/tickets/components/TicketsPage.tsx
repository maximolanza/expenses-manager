"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, addDays, subDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useTickets } from "@/hooks/use-tickets"
import { useStores } from "@/hooks/use-stores"
import { useProducts } from "@/hooks/use-products"
import { TicketForm } from "./TicketForm"
import { TicketList } from "./TicketList"
import { TicketStats } from "./TicketStats"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Receipt } from "lucide-react"
import { AlertToast } from "@/components/ui/alert-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database, PaymentMethod } from "@/types/supabase"
import { 
  getTodayNormalized, 
  dateToISOString, 
  formatDateForDisplay, 
  getPreviousDay, 
  getNextDay 
} from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type Store = Database["public"]["Tables"]["stores"]["Row"] & {
  category: Database["public"]["Tables"]["store_categories"]["Row"]
}

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["product_categories"]["Row"]
  brand?: Database["public"]["Tables"]["brands"]["Row"]
  latest_price?: number
  prices_by_store?: Record<number, number>
}

type TicketItem = {
  description: string
  quantity: number
  unitPrice: number
  temporaryItem: boolean
  productId?: number
}

interface TicketFormProps {
  stores: Store[]
  products: Product[]
  loading: boolean
  selectedDate: string
  formatDateDisplay: (date: string) => string
  onSubmit: (data: {
    storeId: number | undefined
    date: string
    totalAmount: number
    paymentMethod: PaymentMethod
    installments: number
    items: TicketItem[]
    paymentCardId?: number | null
  }) => Promise<void>
  getProducts: (storeId?: number, searchQuery?: string) => Promise<any>
  ticket?: any
  mode?: "create" | "edit"
  onClose: () => void
  isOpen: boolean
  onCreateProduct: (data: { name: string, store_id: string }) => Promise<Product>
  onUpdateProductPrices: (
    storeId: number, 
    items: { 
      productId: number, 
      price: number, 
      previousPrice: number,
      isDiscount?: boolean,
      discountEndDate?: string 
    }[]
  ) => Promise<void>
}

export function TicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")
  
  const [selectedDate, setSelectedDate] = useState(dateToISOString(getTodayNormalized()))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [stores, setStores] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  const { 
    loading: ticketsLoading, 
    createTicket,
    updateTicket,
    getTickets,
    deleteTicket
  } = useTickets()
  
  const { 
    loading: storesLoading, 
    getStores 
  } = useStores()
  
  const { 
    loading: productsLoading, 
    getProducts,
  } = useProducts()

  const { supabase, user } = useSupabase()
  const { workspace } = useWorkspace()

  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const ticketsResult = await getTickets(1, 100, selectedDate);
      setTickets(ticketsResult.tickets || []);
      
      const storesData = await getStores();
      setStores(storesData || []);
      
      const productsData = await getProducts();
      setProducts(productsData || []);
    };
    
    fetchData();
  }, [selectedDate, getTickets, getStores, getProducts]);

  // Actualizar la URL cuando cambia la fecha seleccionada
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", selectedDate)
    router.replace(`/dashboard/tickets?${params.toString()}`)
  }, [selectedDate, router, searchParams])

  const handlePreviousDay = () => {
    setSelectedDate(getPreviousDay(selectedDate))
  }

  const handleNextDay = () => {
    setSelectedDate(getNextDay(selectedDate))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(dateToISOString(date))
    }
  }

  const formatDateDisplayLocal = (dateString: string) => {
    return formatDateForDisplay(dateString)
  }

  const handleCreateTicket = async (data: any) => {
    try {
      // Crear un objeto para los metadatos
      const metadata: Record<string, any> = {};
      
      // Si se seleccionó una tarjeta de pago (y no es "none"), añadir la información a los metadatos
      if (data.paymentCardId && data.paymentCardId !== "none") {
        const { data: cardData, error: cardError } = await supabase
          .from('payment_cards')
          .select('*')
          .eq('id', data.paymentCardId)
          .single();
          
        if (!cardError && cardData) {
          metadata.payment_card = {
            id: cardData.id,
            card_type: cardData.card_type,
            bank: cardData.bank,
            card_name: cardData.card_name,
            owner_name: cardData.owner_name,
            last_four_digits: cardData.last_four_digits
          };
        }
      }
      
      const result = await createTicket({
        storeId: data.storeId,
        date: data.date,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        installments: data.installments,
        items: data.items,
        metadata: metadata
      });
      
      // Recargar los tickets después de intentar crear uno nuevo
      const ticketsResult = await getTickets(1, 100, selectedDate);
      setTickets(ticketsResult.tickets || []);
      
      if (result && result.success) {
        setIsDialogOpen(false);
        AlertToast.success("Ticket creado exitosamente");
      } else {
        AlertToast.error("Error al crear el ticket");
      }
    } catch (error) {
      console.error('Error al crear el ticket:', error);
      AlertToast.error("Error al crear el ticket");
    }
  }

  const handleEditTicket = async (data: any) => {
    if (!selectedTicket) return;
    
    // Crear objeto para los metadatos
    const metadata: Record<string, any> = selectedTicket.metadata || {};
    
    // Si se seleccionó una tarjeta de pago (y no es "none"), actualizar la información en los metadatos
    if (data.paymentCardId && data.paymentCardId !== "none") {
      const { data: cardData, error: cardError } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('id', data.paymentCardId)
        .single();
        
      if (!cardError && cardData) {
        metadata.payment_card = {
          id: cardData.id,
          card_type: cardData.card_type,
          bank: cardData.bank,
          card_name: cardData.card_name,
          owner_name: cardData.owner_name,
          last_four_digits: cardData.last_four_digits
        };
      }
    } else {
      // Si no se seleccionó tarjeta o se seleccionó "none", eliminar la referencia si existía
      if (metadata.payment_card) {
        delete metadata.payment_card;
      }
    }
    
    await updateTicket(selectedTicket.id, {
      storeId: data.storeId,
      date: data.date,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      installments: data.installments,
      metadata: metadata
    });
    
    setIsDialogOpen(false);
    setSelectedTicket(null);
    
    // Recargar los tickets después de la edición
    const ticketsResult = await getTickets(1, 100, selectedDate);
    setTickets(ticketsResult.tickets || []);
  }

  const handleOpenEditDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  }

  const handleOpenCreateDialog = () => {
    setSelectedTicket(null);
    setIsDialogOpen(true);
  }

  const handleDialogClose = () => {
    setSelectedTicket(null);
    setIsDialogOpen(false);
  }

  const handleQuickCreateProduct = async (data: { name: string }) => {
    try {
      // Paso 1: Crear el producto sin asociarlo a una tienda
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          workspace_id: workspace?.id,
          created_by: user?.id || '', // Asegúrate de tener acceso al usuario actual
        })
        .select()
        .single()

      if (error) throw error

      // Actualizar la lista de productos usando el setter del hook
      await getProducts() // Esto actualizará el estado interno del hook
      AlertToast.success("Producto creado exitosamente")
      return newProduct;
    } catch (error) {
      console.error('Error al crear el producto:', error)
      AlertToast.error("Error al crear el producto")
      return null;
    }
  }

  // Función para actualizar precios de productos
  const handleUpdateProductPrices = async (
    storeId: number, 
    items: { productId: number, price: number, previousPrice: number, isDiscount?: boolean, discountEndDate?: string }[]
  ) => {
    try {
      // Obtener el usuario actual para el registro
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !workspace) {
        AlertToast.error("No se pudo actualizar los precios: sesión no válida");
        return;
      }
      
      // Crear entradas en la tabla de historial de precios
      const priceUpdates = items.map(item => {
        // Determinar si es un descuento (cuando el precio es menor al anterior)
        const isDiscount = item.isDiscount !== undefined 
          ? item.isDiscount 
          : (item.price < item.previousPrice);
        
        return {
          product_id: item.productId,
          store_id: storeId,
          price: item.price,
          recorded_by: user.id,
          workspace_id: workspace.id,
          // Añadir campos para descuentos
          is_discount: isDiscount,
          // Si es un descuento, establecer fecha de vencimiento (por defecto 15 días)
          discount_end_date: isDiscount 
            ? item.discountEndDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
            : null
        };
      });
      
      const { error } = await supabase
        .from('product_price_history')
        .insert(priceUpdates)
        .select();
        
      if (error) throw error;
      
      AlertToast.success("Precios actualizados correctamente");
    } catch (error) {
      console.error('Error al actualizar precios:', error);
      AlertToast.error("Error al actualizar los precios de los productos");
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    
    try {
      const deleted = await deleteTicket(ticketToDelete.id);
      
      if (deleted) {
        AlertToast.success("Ticket eliminado exitosamente");
        
        // Recargar los tickets después de la eliminación
        const ticketsResult = await getTickets(1, 100, selectedDate);
        setTickets(ticketsResult.tickets || []);
      } else {
        AlertToast.error("Error al eliminar el ticket");
      }
    } catch (error) {
      console.error('Error al eliminar el ticket:', error);
      AlertToast.error("Error al eliminar el ticket");
    } finally {
      setTicketToDelete(null);
      setIsAlertDialogOpen(false);
    }
  }

  const handleConfirmDelete = (ticket: any) => {
    setTicketToDelete(ticket);
    setIsAlertDialogOpen(true);
  }

  const handleCancelDelete = () => {
    setTicketToDelete(null);
    setIsAlertDialogOpen(false);
  }

  const loading = ticketsLoading || storesLoading || productsLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets Recientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus tickets de compras y gastos
          </p>
        </div>
        <div className="flex flex-wrap w-full md:w-auto items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 sm:w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDateDisplayLocal(selectedDate) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={handleOpenCreateDialog} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear ticket 
          </Button>
        </div>
      </div>

      <TicketStats 
        selectedDate={selectedDate} 
        formatDateDisplay={formatDateDisplayLocal}
        loading={loading}
        tickets={tickets}
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Tickets para {formatDateDisplayLocal(selectedDate)}</CardTitle>
            <CardDescription>
              {tickets.length > 0
                ? `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} registrado${tickets.length !== 1 ? "s" : ""} para el ${format(new Date(`${selectedDate}T12:00:00`), "d/M/yyyy", { locale: es })}`
                : `No hay tickets registrados para el ${format(new Date(`${selectedDate}T12:00:00`), "d/M/yyyy", { locale: es })}`}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenCreateDialog} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : tickets.length > 0 ? (
            <TicketList 
              tickets={tickets} 
              onEdit={handleOpenEditDialog}
              onDelete={handleConfirmDelete}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Receipt className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No hay tickets para esta fecha</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs sm:max-w-sm mx-auto">
                No se encontraron tickets registrados para el {format(new Date(`${selectedDate}T12:00:00`), "d/M/yyyy", { locale: es })}.
                Puedes crear un nuevo ticket utilizando el botón de abajo.
              </p>
              <Button 
                onClick={handleOpenCreateDialog} 
                className="mt-4 w-full sm:w-auto"
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline hidden">Crear ticket para {formatDateDisplayLocal(selectedDate)}</span>
                <span className="inline sm:hidden">Crear ticket para Hoy</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTicket ? "Editar Ticket" : "Nuevo Ticket"}
              </DialogTitle>
            </DialogHeader>
            <TicketForm
              stores={stores}
              products={products}
              loading={loading}
              selectedDate={selectedDate}
              formatDateDisplay={formatDateDisplayLocal}
              onSubmit={selectedTicket ? handleEditTicket : handleCreateTicket}
              getProducts={getProducts}
              ticket={selectedTicket}
              mode={selectedTicket ? "edit" : "create"}
              onClose={handleDialogClose}
              isOpen={isDialogOpen}
              onCreateProduct={handleQuickCreateProduct}
              onUpdateProductPrices={handleUpdateProductPrices}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {ticketToDelete && (
                <>
                  Estás a punto de eliminar el ticket de {ticketToDelete.store?.name || "Tienda no especificada"} 
                  con {ticketToDelete.items?.length || 0} producto(s) por un total de {new Intl.NumberFormat('es-UY', {
                    style: 'currency',
                    currency: 'UYU'
                  }).format(ticketToDelete.total_amount)}. Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTicket}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 