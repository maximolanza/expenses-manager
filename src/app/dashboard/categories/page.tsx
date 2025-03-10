"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCategories } from "@/hooks/use-categories"
import type { Database } from "@/types/supabase"

type StoreCategory = Database["public"]["Tables"]["store_categories"]["Row"]

export default function CategoriesPage() {
  const { getCategories, createCategory, updateCategory, deleteCategory, loading } = useCategories()
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) {
      toast.error("Por favor ingresa un nombre para la categoría")
      return
    }

    setIsLoading(true)
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, categoryName.trim())
        toast.success("Categoría actualizada con éxito")
      } else {
        await createCategory(categoryName.trim())
        toast.success("Categoría creada con éxito")
      }
      await loadCategories()
      setIsOpen(false)
      setCategoryName("")
      setSelectedCategory(null)
    } catch (error) {
      toast.error(selectedCategory 
        ? "Error al actualizar la categoría"
        : "Error al crear la categoría"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (category: StoreCategory) => {
    setSelectedCategory(category)
    setCategoryName(category.name)
    setIsOpen(true)
  }

  const handleDelete = async (category: StoreCategory) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      return
    }

    setIsLoading(true)
    try {
      await deleteCategory(category.id)
      toast.success("Categoría eliminada con éxito")
      await loadCategories()
    } catch (error) {
      toast.error("Error al eliminar la categoría")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorías de Tiendas</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías para clasificar tus tiendas
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setSelectedCategory(null)
            setCategoryName("")
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? "Editar Categoría" : "Crear Nueva Categoría"}
              </DialogTitle>
              <DialogDescription>
                {selectedCategory 
                  ? "Modifica los datos de la categoría"
                  : "Agrega una nueva categoría para clasificar tus tiendas"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la categoría</Label>
                <Input
                  id="name"
                  placeholder="Ej: Supermercados"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (selectedCategory ? "Actualizando..." : "Creando...") 
                  : (selectedCategory ? "Actualizar Categoría" : "Crear Categoría")
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Categorías</CardTitle>
          <CardDescription>
            Lista de todas las categorías disponibles para clasificar tiendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <span>{category.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                      disabled={isLoading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay categorías creadas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 