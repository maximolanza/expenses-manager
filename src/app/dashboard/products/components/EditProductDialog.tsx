"use client"

import { useState, useEffect } from "react"
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
import { Product } from "../../tickets/types"
import { normalizeProductName } from "../../tickets/utils"

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSave: () => void
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSave
}: EditProductDialogProps) {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inicializar valores cuando se abre el diálogo
  useEffect(() => {
    if (product) {
      setName(product.name)
    }
  }, [product])

  // Validar el formulario
  const validateForm = () => {
    if (!name.trim()) {
      setError("El nombre del producto es obligatorio")
      return false
    }
    setError(null)
    return true
  }

  // Guardar cambios en el producto
  const handleSave = async () => {
    if (!validateForm() || !product) return

    setSaving(true)
    try {
      const normalizedName = normalizeProductName(name.trim())
      
      // Verificar si ya existe un producto con ese nombre (excepto el actual)
      const { data: existingProducts, error: searchError } = await supabase
        .from("products")
        .select("id, name")
        .neq("id", product.id)
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
      
      // Actualizar el producto
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          name: name.trim(),
          enabled: product.enabled !== undefined ? product.enabled : true
        })
        .eq("id", product.id)
      
      if (updateError) throw updateError
      
      toast.success("Producto actualizado correctamente")
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al actualizar el producto:", error)
      toast.error("Error al actualizar el producto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza la información del producto
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
            onClick={() => onOpenChange(false)}
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
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 