"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  Search, 
  PlusCircle,
  Store, 
  ShoppingCart, 
  History, 
  Edit, 
  Trash, 
  Upload
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import dynamic from 'next/dynamic'

import { EditProductDialog } from "./EditProductDialog"
import { CreateProductDialog } from "./CreateProductDialog"
import { PriceHistoryDialog } from "./PriceHistoryDialog"

export function ProductsOverview() {
  // Estados para productos, tiendas y filtros
  const [products, setProducts] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStores, setLoadingStores] = useState(true)
  const [showDisabledProducts, setShowDisabledProducts] = useState(false)
  
  // Estados para diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [priceHistoryDialogOpen, setPriceHistoryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  
  // Estados para resultados de validación
  const [validationResult, setValidationResult] = useState<{
    isValidating: boolean;
    isDone: boolean;
    canDelete: boolean;
    ticketItems: any[] | null;
    priceHistoryCount: number | null;
    errorMessage: string | null;
  }>({
    isValidating: false,
    isDone: false,
    canDelete: false,
    ticketItems: null,
    priceHistoryCount: null,
    errorMessage: null
  })

  // Estado para mostrar opciones adicionales
  const [showDisableOption, setShowDisableOption] = useState(false)

  // Función para cargar los productos
  const loadProductsData = useCallback(() => {
    loadProducts()
  }, [searchQuery, selectedStore, showDisabledProducts])

  // Cargar tiendas al iniciar
  useEffect(() => {
    loadStores()
  }, [])

  // Cargar productos cuando cambian los filtros utilizando la función memorizada
  useEffect(() => {
    loadProductsData()
  }, [loadProductsData])

  // Función para cargar tiendas
  const loadStores = async () => {
    setLoadingStores(true)
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name")
      
      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error("Error al cargar tiendas:", error)
      toast.error("No se pudieron cargar las tiendas")
    } finally {
      setLoadingStores(false)
    }
  }

  // Función para cargar productos
  const loadProducts = async () => {
    setLoading(true)
    try {
      // Query básica para productos
      let query = supabase
        .from("products")
        .select(`
          *,
          category_id (id, name),
          brand_id (id, name)
        `)
        .order("name")

      // Filtrar por nombre si hay búsqueda
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`)
      }

      // Filtrar productos deshabilitados a menos que se indique lo contrario
      if (!showDisabledProducts) {
        query = query.eq('enabled', true)
      }

      // Ejecutar la consulta
      const { data: productsData, error } = await query

      if (error) throw error

      // Consultar precios recientes de productos y añadir el campo latest_price si no existe
      const productsWithPrices = productsData?.map(product => {
        // Si ya tiene latest_price, lo mantenemos
        if (product.latest_price !== undefined && product.latest_price !== null) {
          return product;
        }
        
        // Si no tiene latest_price, pero tiene prices_by_store, calculamos el máximo
        if (product.prices_by_store && Object.keys(product.prices_by_store).length > 0) {
          const prices = Object.values(product.prices_by_store);
          const maxPrice = Math.max(...prices as number[]);
          return {
            ...product,
            latest_price: maxPrice
          };
        }
        
        // Si no tiene ningún precio
        return product;
      }) || []
      
      // Filtrar por búsqueda y tienda
      let filteredProducts = productsWithPrices
      
      if (selectedStore) {
        const storeId = parseInt(selectedStore)
        filteredProducts = filteredProducts.filter(product => {
          if (!product.prices_by_store) return false
          return product.prices_by_store[storeId] !== undefined
        })
      }
      
      // Obtener conteo de tiendas actuales de cada producto (fallback)
      const productsWithStoreCount = filteredProducts.map(product => ({
        ...product,
        unique_store_count: product.prices_by_store ? Object.keys(product.prices_by_store).length : 0
      }))
      
      // Procesar productos
      const processedProducts = productsWithStoreCount.map(product => {
        // Usar la columna enabled directamente
        const isDisabled = !product.enabled;
        return {
          ...product,
          isDisabled
        };
      });

      setProducts(processedProducts || [])
      
      // Ahora intentamos enriquecer con datos del historial, pero si falla no interrumpe la experiencia
      try {
        // Procesar productos en lotes para evitar demasiadas consultas simultáneas
        const BATCH_SIZE = 5
        const batches = []
        
        for (let i = 0; i < processedProducts.length; i += BATCH_SIZE) {
          batches.push(processedProducts.slice(i, i + BATCH_SIZE))
        }
        
        for (const batch of batches) {
          const updatedBatch = await Promise.all(
            batch.map(async (product) => {
              try {
                // Eliminar la verificación que causa el error 400
                // Simplemente intentamos consultar directamente los datos
                const { data: priceHistoryData, error } = await supabase
                  .from("product_price_history")
                  .select("store_id, product_id, price, date")
                  .eq("product_id", product.id)

                // Si hay un error porque la tabla no existe, lo manejamos silenciosamente
                if (error) {
                  return product
                }

                if (!priceHistoryData || priceHistoryData.length === 0) {
                  return product
                }
                
                // Procesar los precios por tienda, quedándonos con el más reciente por cada tienda
                const pricesByStore: { [storeId: string]: number } = {}
                const latestDateByStore: { [storeId: string]: string } = {}

                // Agrupar por tienda y quedarnos con el precio más reciente
                priceHistoryData.forEach(record => {
                  const storeId = record.store_id
                  const date = record.date
                  const price = parseFloat(record.price)
                  
                  if (isNaN(price)) return
                  
                  // Si no tenemos fecha para esta tienda o la fecha es más reciente que la guardada
                  if (!latestDateByStore[storeId] || new Date(date) > new Date(latestDateByStore[storeId])) {
                    latestDateByStore[storeId] = date
                    pricesByStore[storeId] = price
                  }
                })

                // Extraer tiendas únicas
                const uniqueStores = new Set(Object.keys(pricesByStore).map(id => parseInt(id)))
                
                return {
                  ...product,
                  unique_store_count: uniqueStores.size || product.unique_store_count,
                  prices_by_store: pricesByStore,
                }
              } catch (err) {
                // Error al procesar este producto individual, mantenemos el valor original
                return product
              }
            })
          )
          
          // Actualizar el estado con cada lote procesado
          setProducts(prevProducts => {
            const newProducts = [...prevProducts]
            updatedBatch.forEach(updatedProduct => {
              const index = newProducts.findIndex(p => p.id === updatedProduct.id)
              if (index !== -1) {
                newProducts[index] = updatedProduct
              }
            })
            return newProducts
          })
        }
      } catch (historyError) {
        console.log("Error al procesar historial de precios, usando fallback:", historyError)
        // Ya hemos establecido los productos con el conteo fallback, así que la UI sigue funcionando
      }
    } catch (error) {
      console.error("Error al cargar productos:", error)
      toast.error("No se pudieron cargar los productos")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Función para ver el historial de precios
  const handleViewPriceHistory = (product: any) => {
    setSelectedProduct(product)
    setPriceHistoryDialogOpen(true)
  }

  // Función para editar producto
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setEditDialogOpen(true)
  }

  // Función para iniciar el proceso de eliminación y validación
  const handleInitiateDelete = (product: any) => {
    setSelectedProduct(product)
    // Resetear el estado de validación
    setValidationResult({
      isValidating: false,
      isDone: false,
      canDelete: false,
      ticketItems: null,
      priceHistoryCount: null,
      errorMessage: null
    })
    setShowDisableOption(false)
    setDeleteDialogOpen(true)
  }

  // Función para validar si un producto puede ser eliminado
  const validateProductDeletion = async () => {
    if (!selectedProduct) return
    
    setValidationResult(prev => ({ ...prev, isValidating: true }))
    
    try {
      // Verificar si el producto está siendo utilizado en tickets
      const { data: ticketItems, error: ticketItemsError, count } = await supabase
        .from("ticket_items")
        .select("id, ticket_id", { count: "exact" })
        .eq("product_id", selectedProduct.id)
      
      if (ticketItemsError) throw ticketItemsError
      
      // Contar asociaciones en product_price_history
      const { count: priceHistoryCount, error: priceHistoryCountError } = await supabase
        .from("product_price_history")
        .select("id", { count: "exact", head: true })
        .eq("product_id", selectedProduct.id)
      
      if (priceHistoryCountError) throw priceHistoryCountError
      
      // Determinar si se puede eliminar
      const canDelete = !ticketItems || ticketItems.length === 0
      
      setValidationResult({
        isValidating: false,
        isDone: true,
        canDelete,
        ticketItems,
        priceHistoryCount,
        errorMessage: !canDelete 
          ? `El producto está asociado a ${count} tickets y no puede ser eliminado.`
          : null
      })
      
      // Mostrar opción de deshabilitar si no se puede eliminar
      if (!canDelete) {
        setShowDisableOption(true)
      }
      
    } catch (error) {
      console.error("Error al validar el producto:", error)
      setValidationResult({
        isValidating: false,
        isDone: true,
        canDelete: false,
        ticketItems: null,
        priceHistoryCount: null,
        errorMessage: "Error al validar el producto. Inténtalo de nuevo."
      })
    }
  }

  // Función para eliminar producto
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    
    // Si aún no se ha validado el producto, ejecutar la validación
    if (!validationResult.isDone) {
      await validateProductDeletion()
      return
    }
    
    // Si no se puede eliminar, mostrar mensaje y opciones
    if (!validationResult.canDelete) {
      return
    }
    
    try {
      // Verificar asociaciones en product_store_prices
      const { count: priceAssociations, error: priceAssociationsError } = await supabase
        .from("product_price_history")
        .select("id", { count: "exact", head: true })
        .eq("product_id", selectedProduct.id)
      
      if (priceAssociationsError) throw priceAssociationsError
      
      // Advertir al usuario si hay muchas asociaciones de precio
      if (priceAssociations && priceAssociations > 10) {
        const confirmDelete = window.confirm(
          `Este producto tiene ${priceAssociations} registros históricos de precios que serán eliminados. ¿Está seguro de que desea continuar?`
        )
        
        if (!confirmDelete) {
          setDeleteDialogOpen(false)
          return
        }
      }
      
      // 1. Eliminar entradas en el historial de precios
      const { error: priceHistoryError } = await supabase
        .from("product_price_history")
        .delete()
        .eq("product_id", selectedProduct.id)
      
      if (priceHistoryError) throw priceHistoryError
      
      // 2. Eliminar el producto
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id)
      
      if (productError) throw productError
      
      toast.success("Producto eliminado correctamente")
      setDeleteDialogOpen(false)
      loadProducts()
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      toast.error("Error al eliminar el producto")
    }
  }

  // Función para deshabilitar el producto en lugar de eliminarlo
  const handleDisableProduct = async () => {
    if (!selectedProduct) return
    
    try {
      // Actualizamos la columna enabled a false para deshabilitar el producto
      const { error } = await supabase
        .from("products")
        .update({
          enabled: false
        })
        .eq("id", selectedProduct.id)
      
      if (error) throw error
      
      toast.success(`El producto "${selectedProduct.name}" ha sido deshabilitado`)
      setDeleteDialogOpen(false)
      loadProducts()
    } catch (error) {
      console.error("Error al deshabilitar el producto:", error)
      toast.error("Error al deshabilitar el producto")
    }
  }

  // Función para habilitar un producto deshabilitado
  const handleEnableProduct = async (product: any) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          enabled: true
        })
        .eq("id", product.id)
      
      if (error) throw error
      
      toast.success(`El producto "${product.name}" ha sido habilitado`)
      loadProducts()
    } catch (error) {
      console.error("Error al habilitar el producto:", error)
      toast.error("Error al habilitar el producto")
    }
  }

  // Función que formatea el precio para mostrar
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "-"
    return `$${price.toFixed(2)}`
  }

  // Función para determinar la tienda con el precio más bajo
  const getStoreWithLowestPrice = (product: any) => {
    if (!product.prices_by_store || typeof product.prices_by_store !== 'object') {
      return { store: null, price: null };
    }
    
    const storeIds = Object.keys(product.prices_by_store);
    
    if (storeIds.length === 0) {
      return { store: null, price: null };
    }
    
    // Si solo hay una tienda, la devolvemos directamente
    if (storeIds.length === 1) {
      const storeId = parseInt(storeIds[0]);
      const store = stores.find(s => s.id === storeId);
      const price = Number(product.prices_by_store[storeId]);
      return { store: store || null, price: isNaN(price) ? null : price };
    }
    
    // Encontrar la tienda con el precio más bajo
    let lowestPrice = Infinity;
    let storeWithLowestPrice = null;
    
    for (const storeId of storeIds) {
      const price = Number(product.prices_by_store[storeId]);
      if (!isNaN(price) && price < lowestPrice) {
        lowestPrice = price;
        storeWithLowestPrice = storeId;
      }
    }
    
    if (!storeWithLowestPrice || lowestPrice === Infinity) {
      return { store: null, price: null };
    }
    
    const store = stores.find(s => s.id === parseInt(storeWithLowestPrice));
    return { store: store || null, price: lowestPrice };
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Productos</CardTitle>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros y búsqueda */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-[200px]">
            <Select 
              value={selectedStore || "all"} 
              onValueChange={(value) => setSelectedStore(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las tiendas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tiendas</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="show-disabled" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
              <input
                id="show-disabled"
                type="checkbox"
                checked={showDisabledProducts}
                onChange={(e) => setShowDisabledProducts(e.target.checked)}
                className="rounded border-gray-300 cursor-pointer"
              />
              Mostrar productos deshabilitados
            </label>
          </div>
        </div>

        {/* Tabla de productos */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || selectedStore 
              ? "No se encontraron productos con los filtros aplicados" 
              : "No hay productos registrados"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead >Nombre</TableHead>
                  <TableHead>Tiendas</TableHead>
                  <TableHead>Precio más bajo</TableHead>
                  <TableHead>Mejor precio en</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const storeCount = product.unique_store_count || 0;
                  const { store: lowestPriceStore, price: lowestPrice } = getStoreWithLowestPrice(product);
                    
                  return (
                    <TableRow key={product.id} className={product.isDisabled ? "bg-gray-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.name}
                          {product.isDisabled && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                Deshabilitado
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-600"
                                onClick={() => handleEnableProduct(product)}
                                title="Habilitar producto"
                              >
                                Habilitar
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                     
                      <TableCell>
                        {storeCount} {storeCount === 1 ? "tienda" : "tiendas"}
                      </TableCell>
                      <TableCell>
                        {formatPrice(lowestPrice)}
                      </TableCell>
                      <TableCell>
                        {lowestPriceStore ? (
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            {lowestPriceStore.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Editar - visible directamente */}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8"
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Botón Eliminar - visible directamente */}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleInitiateDelete(product)}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            title="Eliminar producto"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          
                          {/* Menú desplegable con acciones adicionales */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Más acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Más acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleViewPriceHistory(product)}
                                className="gap-2 cursor-pointer"
                              >
                                <History className="h-4 w-4" />
                                Historial de precios
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Diálogo de Creación de Producto */}
      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={loadProducts}
      />

      {/* Diálogo de Edición de Producto */}
      {selectedProduct && (
        <EditProductDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          product={selectedProduct}
          onSave={loadProducts}
        />
      )}

      {/* Diálogo de Historial de Precios */}
      {selectedProduct && (
        <PriceHistoryDialog
          open={priceHistoryDialogOpen}
          onOpenChange={setPriceHistoryDialogOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
        />
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            
            {!validationResult.isDone ? (
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el producto 
                {selectedProduct ? ` "${selectedProduct.name}"` : ""} y 
                todo su historial de precios.
              </AlertDialogDescription>
            ) : validationResult.canDelete ? (
              <AlertDialogDescription>
                La validación ha sido exitosa. Puedes proceder a eliminar el producto
                {selectedProduct ? ` "${selectedProduct.name}"` : ""} y 
                todo su historial de precios.
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription className="text-red-600">
                {validationResult.errorMessage}
              </AlertDialogDescription>
            )}
            
            {!validationResult.isDone && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p><strong>Nota importante:</strong> Esta operación solo es posible si el producto no está asociado a ningún ticket.
                Si el producto ya está siendo utilizado, considere deshabilitarlo en lugar de eliminarlo.</p>
                
                <p className="mt-2">Durante este proceso se verificará:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Que el producto no esté asociado a tickets existentes.</li>
                  <li>Si hay muchos registros de historial de precios, se solicitará confirmación adicional.</li>
                </ul>
              </div>
            )}
            
            {validationResult.isDone && !validationResult.canDelete && showDisableOption && (
              <div className="mt-4 p-3 border rounded-md bg-orange-50">
                <p className="font-medium text-orange-800">Opción alternativa: Deshabilitar producto</p>
                <p className="text-sm text-orange-700 mt-1">
                  En lugar de eliminar el producto, puedes deshabilitarlo. Esto lo mantendrá en el sistema
                  para preservar los registros históricos, pero no aparecerá en las nuevas búsquedas.
                  Los productos deshabilitados pueden volver a habilitarse en el futuro.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2 bg-orange-100 hover:bg-orange-200 border-orange-300"
                  onClick={handleDisableProduct}
                >
                  Deshabilitar producto
                </Button>
              </div>
            )}
            
            {validationResult.isValidating && (
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Validando producto...</p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!validationResult.isDone ? (
              <Button 
                onClick={validateProductDeletion} 
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Validar
              </Button>
            ) : validationResult.canDelete ? (
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 