"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useProducts } from "@/hooks/use-products"

interface ProductCategoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated: (categoryId: number) => void
}

export function ProductCategoryDialog({
  isOpen,
  onOpenChange,
  onCategoryCreated,
}: ProductCategoryDialogProps) {
  const { createProductCategory, loading: productsLoading } = useProducts()
  const [isLoading, setIsLoading] = useState(false)
  const [categoryName, setCategoryName] = useState("")

  // Manejar la apertura del diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Limpiar el formulario al cerrar
      setCategoryName("")
    }
    onOpenChange(open)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) {
      toast.error("Por favor ingresa el nombre de la categoría")
      return
    }

    setIsLoading(true)
    try {
      const category = await createProductCategory({
        name: categoryName.trim(),
      })
      
      if (category) {
        toast.success("Categoría creada con éxito")
        onCategoryCreated(category.id)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error al crear la categoría")
    } finally {
      setIsLoading(false)
    }
  }

  const loading = productsLoading || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Categoría de Producto</DialogTitle>
          <DialogDescription>
            Agrega una nueva categoría para tus productos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nombre</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear Categoría"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 