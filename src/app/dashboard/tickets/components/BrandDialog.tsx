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

interface BrandDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onBrandCreated: (brandId: number) => void
}

export function BrandDialog({
  isOpen,
  onOpenChange,
  onBrandCreated,
}: BrandDialogProps) {
  const { createBrand, loading: productsLoading } = useProducts()
  const [isLoading, setIsLoading] = useState(false)
  const [brandName, setBrandName] = useState("")

  // Manejar la apertura del diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Limpiar el formulario al cerrar
      setBrandName("")
    }
    onOpenChange(open)
  }

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) {
      toast.error("Por favor ingresa el nombre de la marca")
      return
    }

    setIsLoading(true)
    try {
      const brand = await createBrand({
        name: brandName.trim(),
      })
      
      if (brand) {
        toast.success("Marca creada con éxito")
        onBrandCreated(brand.id)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error al crear la marca")
    } finally {
      setIsLoading(false)
    }
  }

  const loading = productsLoading || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Marca</DialogTitle>
          <DialogDescription>
            Agrega una nueva marca para tus productos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateBrand} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Nombre</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear Marca"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 