"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StoreForm } from "../../stores/components/store-form"

interface StoreDialogProps {
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onStoreCreated?: (storeId: number) => void;
}

export function StoreDialog({ 
  triggerButton, 
  open: controlledOpen, 
  onOpenChange: setControlledOpen,
  onStoreCreated 
}: StoreDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const { workspace } = useWorkspace()
  const { supabase } = useSupabase()

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined && setControlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen : setInternalOpen

  const onSubmit = async (data: {
    name: string;
    category_id: number;
    is_main: boolean;
    is_hidden: boolean;
  }) => {
    try {
      if (!workspace) return

      const { data: storeData, error } = await supabase
        .from('stores')
        .insert({
          ...data,
          workspace_id: workspace.id
        })
        .select()

      if (error) throw error

      setOpen(false)
      
      // Si tenemos un callback, pasamos el ID de la tienda creada
      if (onStoreCreated && storeData && storeData.length > 0) {
        onStoreCreated(storeData[0].id)
      }
    } catch (error) {
      console.error("Error creating store:", error)
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
          <DialogTitle>Nueva Tienda</DialogTitle>
        </DialogHeader>
        <StoreForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
} 