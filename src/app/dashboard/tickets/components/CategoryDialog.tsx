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
import { useCategories } from "@/hooks/use-categories"

interface CategoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated: (categoryId: number) => void
}

export function CategoryDialog({ isOpen, onOpenChange, onCategoryCreated }: CategoryDialogProps) {
  const { createCategory, loading: categoryLoading } = useCategories()
  const [isLoading, setIsLoading] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
  })

  // Manejar la apertura del diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Limpiar el formulario al cerrar
      setCategoryForm({
        name: "",
      })
    }
    onOpenChange(open)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryForm.name) {
      toast.error("Por favor ingresa el nombre de la categoría")
      return
    }

    setIsLoading(true)
    try {
      const category = await createCategory({
        name: categoryForm.name,
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

  const loading = categoryLoading || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
          <DialogDescription>
            Agrega una nueva categoría de tienda
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nombre</Label>
            <Input
              id="categoryName"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
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