"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { normalizeProductName } from "../../tickets/utils"

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onSave
}: CreateProductDialogProps) {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validar el formulario
  const validateForm = () => {
    if (!name.trim()) {
      setError("El nombre del producto es obligatorio")
      return false
    }
    setError(null)
    return true
  }

  // Limpiar el formulario al cerrar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("")
      setError(null)
    }
    onOpenChange(open)
  }

  // Guardar nuevo producto
  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const normalizedName = normalizeProductName(name.trim())
      
      // Verificar si ya existe un producto con ese nombre
      const { data: existingProducts, error: searchError } = await supabase
        .from("products")
        .select("id, name")
        .ilike("name", `%${normalizedName}%`)
      
      if (searchError) throw searchError
      
      // Comprobar si algún producto existente tiene el mismo nombre normalizado
      const exactMatch = existingProducts?.find(
        p => normalizeProductName(p.name) === normalizedName
      )
      
      if (exactMatch) {
        setError(`Ya existe un producto con el nombre "${exactMatch.name}"`)
        setSaving(false)
        return
      }
      
      // Crear el nuevo producto
      const { error: insertError } = await supabase
        .from("products")
        .insert({ 
          name: name.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) throw insertError
      
      toast.success("Producto creado correctamente")
      setName("")
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al crear el producto:", error)
      toast.error("Error al crear el producto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>
            Añade un nuevo producto al catálogo
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del producto</Label>
            <Input
              id="name"
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              "Crear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 