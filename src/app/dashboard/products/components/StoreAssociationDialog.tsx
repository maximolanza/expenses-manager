"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Store } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Product } from "../../tickets/types"

// El componente Switch no está disponible aún. Vamos a crear un componente simple para reemplazarlo
function Switch({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: () => void }) {
  return (
    <Button 
      variant={checked ? "default" : "outline"} 
      size="sm" 
      onClick={onCheckedChange}
      className="h-8 w-12 px-1"
    >
      {checked ? "Activa" : "Inactiva"}
    </Button>
  );
}

interface StoreAssociationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  stores: any[]
  onSave: () => void
}

export function StoreAssociationDialog({
  open,
  onOpenChange,
  product,
  stores,
  onSave
}: StoreAssociationDialogProps) {
  const [storeAssociations, setStoreAssociations] = useState<{
    [storeId: number]: {
      active: boolean
      price: string
      previousPrice: string | null
    }
  }>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Cargar asociaciones de tiendas cuando se abre el diálogo
  useEffect(() => {
    if (open && product) {
      loadStoreAssociations()
    }
  }, [open, product])

  // Cargar asociaciones de tiendas y precios
  const loadStoreAssociations = async () => {
    setLoading(true)
    try {
      // Inicializar asociaciones para todas las tiendas
      const initialAssociations: {
        [storeId: number]: {
          active: boolean
          price: string
          previousPrice: string | null
        }
      } = {}
      
      // Establecer valores por defecto para todas las tiendas
      stores.forEach(store => {
        initialAssociations[store.id] = {
          active: false,
          price: "0.00",
          previousPrice: null
        }
      })
      
      // Si el producto tiene precios por tienda, actualizarlos
      if (product.prices_by_store) {
        Object.entries(product.prices_by_store).forEach(([storeId, price]) => {
          const storeIdNum = parseInt(storeId)
          initialAssociations[storeIdNum] = {
            active: true,
            price: typeof price === 'number' ? price.toFixed(2) : (price as any).toString(),
            previousPrice: null
          }
        })
      }
      
      // Consultar los precios históricos para obtener el precio anterior si existe
      const { data: priceData, error } = await supabase
        .from("product_prices")
        .select("store_id, price, previous_price")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      // Agrupar por tienda y obtener el registro más reciente
      if (priceData && priceData.length > 0) {
        const storesPrices: Record<number, any> = {}
        
        // Solo guardar el registro más reciente para cada tienda
        priceData.forEach(record => {
          if (!storesPrices[record.store_id]) {
            storesPrices[record.store_id] = record
          }
        })
        
        // Actualizar precios anteriores si existen
        Object.entries(storesPrices).forEach(([storeId, priceRecord]) => {
          const storeIdNum = parseInt(storeId)
          if (initialAssociations[storeIdNum]) {
            initialAssociations[storeIdNum].previousPrice = 
              priceRecord.previous_price !== null 
                ? priceRecord.previous_price.toString() 
                : null
          }
        })
      }
      
      setStoreAssociations(initialAssociations)
    } catch (error) {
      console.error("Error al cargar asociaciones de tiendas:", error)
      toast.error("No se pudieron cargar las asociaciones de tiendas")
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado de activación para una tienda
  const handleToggleStore = (storeId: number) => {
    setStoreAssociations(prev => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        active: !prev[storeId].active
      }
    }))
  }

  // Actualizar precio para una tienda
  const handlePriceChange = (storeId: number, price: string) => {
    // Validar que sea un número válido o vacío
    if (price === "" || !isNaN(parseFloat(price))) {
      setStoreAssociations(prev => ({
        ...prev,
        [storeId]: {
          ...prev[storeId],
          price
        }
      }))
    }
  }

  // Guardar asociaciones de tiendas
  const handleSaveAssociations = async () => {
    setSaving(true)
    try {
      // Filtrar tiendas activas y con precio válido
      const activeStores = Object.entries(storeAssociations)
        .filter(([_, data]) => data.active && parseFloat(data.price) > 0)
        .map(([storeId, data]) => ({
          storeId: parseInt(storeId),
          price: parseFloat(data.price),
          previousPrice: data.previousPrice ? parseFloat(data.previousPrice) : null
        }))
      
      if (activeStores.length === 0) {
        toast.warning("No has seleccionado ninguna tienda con precio válido")
        setSaving(false)
        return
      }
      
      // 1. Actualizar precios por tienda en el producto
      const newPricesByStore: Record<number, number> = {}
      activeStores.forEach(store => {
        newPricesByStore[store.storeId] = store.price
      })
      
      // Actualizar el producto con los nuevos precios por tienda
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          prices_by_store: newPricesByStore,
          // Actualizar el precio más reciente si es necesario
          latest_price: activeStores.length > 0 
            ? Math.max(...activeStores.map(s => s.price))
            : product.latest_price
        })
        .eq("id", product.id)
      
      if (updateError) throw updateError
      
      // 2. Insertar nuevos registros en el historial de precios para tiendas con precio cambiado
      const priceHistoryRecords = activeStores
        .filter(store => {
          // Solo registrar si el precio es diferente al anterior
          const previousPrice = store.previousPrice;
          return previousPrice === null || store.price !== previousPrice;
        })
        .map(store => ({
          product_id: product.id,
          store_id: store.storeId,
          price: store.price.toString(),
          is_discount: store.previousPrice !== null && store.price < store.previousPrice,
          discount_end_date: null,
          date: new Date().toISOString(),
          recorded_by: null,
          metadata: {},
          price_change_type: "regular",
          workspace_id: 1
        }))
      
      if (priceHistoryRecords.length > 0) {
        const { error: historyError } = await supabase
          .from("product_price_history")
          .insert(priceHistoryRecords)
        
        if (historyError) throw historyError
      }
      
      toast.success("Asociaciones de tiendas actualizadas correctamente")
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al guardar asociaciones de tiendas:", error)
      toast.error("Error al guardar las asociaciones de tiendas")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asociar Tiendas</DialogTitle>
          <DialogDescription>
            Administra las tiendas asociadas a {product.name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="py-4 overflow-y-auto max-h-[calc(80vh-180px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Activa</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Precio anterior</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {store.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={storeAssociations[store.id]?.active || false}
                        onCheckedChange={() => handleToggleStore(store.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={storeAssociations[store.id]?.price || ""}
                          onChange={(e) => handlePriceChange(store.id, e.target.value)}
                          disabled={!storeAssociations[store.id]?.active}
                          className="w-24"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {storeAssociations[store.id]?.previousPrice 
                        ? `$${parseFloat(storeAssociations[store.id].previousPrice || "0").toFixed(2)}` 
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveAssociations}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 