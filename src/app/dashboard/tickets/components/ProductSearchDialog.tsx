"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ProductSearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  products: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  onProductSelected: (product: any) => void
  getProducts: (storeId?: number, query?: string) => Promise<any>
  storeId?: number
}

export function ProductSearchDialog({
  isOpen,
  onOpenChange,
  products,
  searchQuery,
  setSearchQuery,
  onProductSelected,
  getProducts,
  storeId,
}: ProductSearchDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      handleSearch()
    }
  }, [isOpen, storeId])

  const handleSearch = async () => {
    if (!searchQuery.trim() && !storeId) return
    
    setIsLoading(true)
    try {
      const results = await getProducts(storeId, searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error("Error al buscar productos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>

          {searchResults.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => onProductSelected(product)}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category.name}
                          </Badge>
                        )}
                        {product.brand && (
                          <Badge variant="outline" className="text-xs">
                            {product.brand.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {product.latest_price && (
                      <div className="font-medium">
                        ${product.latest_price.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Buscando productos...</p>
                </div>
              ) : searchQuery || storeId ? (
                <p>No se encontraron productos</p>
              ) : (
                <p>Ingresa un término de búsqueda o selecciona una tienda</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 