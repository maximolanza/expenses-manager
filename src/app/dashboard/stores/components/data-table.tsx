"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "sonner"
import { StoreDialog } from "./store-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Store {
  id: number
  name: string
  location: string | null
  category_id: number
  enabled?: boolean
  categories: {
    id: number
    name: string
  } | null
}

interface DataTableProps {
  data: Store[]
  onDataChange?: () => void
}

export function DataTable({ data, onDataChange }: DataTableProps) {
  const { supabase } = useSupabase()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [storeToEdit, setStoreToEdit] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEditClick = (store: Store) => {
    setStoreToEdit(store)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (store: Store) => {
    setStoreToDelete(store)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!storeToDelete) return

    try {
      setIsLoading(true)
      
      // Actualizar el campo enabled a false en lugar de eliminar
      const { error } = await supabase
        .from('stores')
        .update({ enabled: false })
        .eq('id', storeToDelete.id)

      if (error) throw error

      toast.success(`Tienda "${storeToDelete.name}" deshabilitada correctamente`)
      
      // Refrescar los datos si se proporciona la función onDataChange
      if (onDataChange) {
        onDataChange()
      }
    } catch (error) {
      console.error("Error al deshabilitar la tienda:", error)
      toast.error("Error al deshabilitar la tienda")
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      setStoreToDelete(null)
    }
  }

  const handleStoreEdited = () => {
    if (onDataChange) {
      onDataChange()
    }
    setIsEditDialogOpen(false)
    setStoreToEdit(null)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.location || '-'}</TableCell>
                  <TableCell>{store.categories?.name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(store)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(store)}
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No hay tiendas registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de edición */}
      {storeToEdit && (
        <StoreDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          storeToEdit={storeToEdit}
          onStoreEdited={handleStoreEdited}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción deshabilitará la tienda "{storeToDelete?.name}". 
              La tienda no aparecerá en las listas pero sus datos se conservarán en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deshabilitando..." : "Deshabilitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 