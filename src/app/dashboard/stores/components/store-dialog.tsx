"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StoreForm } from "./store-form"
import { toast } from "sonner"

interface Store {
  id: number
  name: string
  location: string | null
  category_id: number
  is_main?: boolean
  is_hidden?: boolean
  enabled?: boolean
}

interface StoreDialogProps {
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onStoreCreated?: (storeId: number) => void;
  storeToEdit?: Store;
  onStoreEdited?: () => void;
}

export function StoreDialog({ 
  triggerButton, 
  open: controlledOpen, 
  onOpenChange: setControlledOpen,
  onStoreCreated,
  storeToEdit,
  onStoreEdited
}: StoreDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const { workspace } = useWorkspace()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen : setInternalOpen

  const isEditMode = !!storeToEdit

  const onSubmit = async (data: {
    name: string;
    category_id: number;
    is_main: boolean;
    is_hidden: boolean;
    enabled: boolean;
  }) => {
    try {
      if (!workspace) return
      setIsLoading(true)

      if (isEditMode && storeToEdit) {
        // Actualizar tienda existente, incluyendo el estado de enabled
        const { error } = await supabase
          .from('stores')
          .update({
            ...data,
            // No actualizamos workspace_id para evitar cambiar la tienda de workspace
          })
          .eq('id', storeToEdit.id)

        if (error) throw error

        // Notificación basada en enabled
        if (data.enabled) {
          toast.success(`Tienda "${data.name}" actualizada correctamente`)
        } else {
          toast.success(`Tienda "${data.name}" deshabilitada correctamente`)
        }
        
        // Si tenemos un callback para edición, lo llamamos
        if (onStoreEdited) {
          onStoreEdited()
        }
      } else {
        // Crear nueva tienda (siempre habilitada por defecto)
        const { data: storeData, error } = await supabase
          .from('stores')
          .insert({
            ...data,
            workspace_id: workspace.id,
          })
          .select()

        if (error) throw error

        toast.success(`Tienda "${data.name}" creada correctamente`)
        
        // Si tenemos un callback para creación, lo llamamos
        if (onStoreCreated && storeData && storeData.length > 0) {
          onStoreCreated(storeData[0].id)
        }
      }

      setOpen(false)
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} store:`, error)
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} la tienda`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && triggerButton ? (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button>Agregar Tienda</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Tienda' : 'Nueva Tienda'}</DialogTitle>
        </DialogHeader>
        <StoreForm 
          onSubmit={onSubmit} 
          initialData={storeToEdit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
} 