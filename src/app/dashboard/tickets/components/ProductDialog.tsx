"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useProducts } from "@/hooks/use-products"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { debounce } from "lodash"

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  brandId: z.string().min(1, "La marca es requerida"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  price: z.string().min(1, "El precio es requerido"),
})

type ProductFormSchema = z.infer<typeof productSchema>

interface ProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onProductCreated?: (productId: number) => void
  storeId?: number
}

export function ProductDialog({
  isOpen,
  onOpenChange,
  onProductCreated,
  storeId,
}: ProductDialogProps) {
  const { createProduct, getBrands, getCategories, checkProductExists, getProducts } = useProducts()
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [similarProducts, setSimilarProducts] = useState<any[]>([])
  const [showSimilarProducts, setShowSimilarProducts] = useState(false)
  const [searchingProducts, setSearchingProducts] = useState(false)

  const form = useForm<ProductFormSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brandId: "",
      categoryId: "",
      price: "",
    },
  })

  // Cargar marcas y categorías al abrir el diálogo
  useEffect(() => {
    async function loadData() {
      const [brandsData, categoriesData] = await Promise.all([
        getBrands(),
        getCategories(),
      ])
      
      if (brandsData) setBrands(brandsData)
      if (categoriesData) setCategories(categoriesData)
    }
    
    if (isOpen) {
      loadData()
      // Reiniciar el estado de productos similares
      setSimilarProducts([])
      setShowSimilarProducts(false)
    }
  }, [isOpen, getBrands, getCategories])

  // Buscar productos similares cuando el usuario escribe
  const debouncedSearch = debounce(async (name: string) => {
    if (!name || name.length < 2) {
      setSimilarProducts([])
      setShowSimilarProducts(false)
      setSearchingProducts(false)
      return
    }

    try {
      const results = await getProducts(undefined, name)
      setSimilarProducts(results)
      setShowSimilarProducts(results.length > 0)
      setSearchingProducts(false)
    } catch (error) {
      console.error("Error buscando productos similares:", error)
      setSearchingProducts(false)
    }
  }, 300)

  // Manejar cambios en el campo de nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    form.setValue("name", value)
    
    // Si el usuario está escribiendo, buscar productos similares
    if (value.length >= 2) {
      setSearchingProducts(true)
      debouncedSearch(value)
    } else {
      setSimilarProducts([])
      setShowSimilarProducts(false)
    }
  }

  const onSubmit = async (data: ProductFormSchema) => {
    try {
      setLoading(true)
      
      // Verificar si ya existe un producto con el mismo nombre
      const existingProducts = await checkProductExists(data.name)
      
      // Si encuentra un producto con nombre exactamente igual
      const exactMatch = existingProducts.find(
        p => p.name.toLowerCase() === data.name.toLowerCase()
      )
      
      if (exactMatch) {
        toast.error(`Ya existe un producto con el nombre "${data.name}". Por favor, usa un nombre diferente.`)
        return
      }
      
      // Si hay productos similares pero no exactamente iguales, mostrar una advertencia
      if (existingProducts.length > 0) {
        // Continuamos con la creación, pero mostramos una notificación
        toast.warning(`Se encontraron ${existingProducts.length} productos con nombres similares a "${data.name}".`)
        console.log("Productos similares encontrados:", existingProducts)
      }
      
      const result = await createProduct({
        name: data.name,
        brandId: parseInt(data.brandId),
        categoryId: parseInt(data.categoryId),
        price: parseFloat(data.price),
        storeId,
      })
      
      if (result?.id) {
        toast.success("Producto creado exitosamente")
        onProductCreated?.(result.id)
        onOpenChange(false)
        form.reset()
      }
    } catch (error: any) {
      // Mostrar mensaje de error específico si viene de la API
      if (error.message) {
        toast.error(error.message)
      } else {
        toast.error("Error al crear el producto")
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo producto</DialogTitle>
          <DialogDescription>
            Agrega un nuevo producto para tu ticket
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: Leche Deslactosada" 
                      onChange={handleNameChange}
                    />
                  </FormControl>
                  <FormMessage />
                  
                  {/* Mostrar productos similares mientras el usuario escribe */}
                  {showSimilarProducts && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md">
                      <div className="p-2 text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Productos similares encontrados:</span>
                      </div>
                      <ScrollArea className="max-h-32">
                        {similarProducts.map((product) => (
                          <div 
                            key={product.id}
                            className="p-2 border-t hover:bg-muted"
                          >
                            <div className="font-medium">{product.name}</div>
                            {product.brand && (
                              <Badge variant="outline" className="mt-1">
                                {product.brand.name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}

                  {searchingProducts && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md p-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Search className="h-4 w-4 animate-pulse" />
                        <span>Buscando productos similares...</span>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una marca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem
                          key={brand.id}
                          value={brand.id.toString()}
                        >
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 