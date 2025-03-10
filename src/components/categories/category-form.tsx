"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconPicker } from "@/components/ui/icon-picker"
import { ColorPicker } from "@/components/ui/color-picker"
import type { Database } from "@/types/supabase"

type Category = Database["public"]["Tables"]["categories"]["Row"]

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  color: z.string().min(1, "El color es requerido"),
  icon: z.string().min(1, "El ícono es requerido"),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormProps {
  category?: Category
  onSubmit: (data: CategoryFormData) => Promise<void>
  onClose: () => void
}

export function CategoryForm({ category, onSubmit, onClose }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      color: category?.color || "#3b82f6",
      icon: category?.icon || "💰",
    },
  })

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      form.reset()
      onClose()
    } catch (error) {
      console.error("Error al guardar la categoría:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Nombre
        </label>
        <Input
          type="text"
          {...form.register("name")}
          placeholder="Ej: Alimentación"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Color
        </label>
        <ColorPicker
          value={form.watch("color")}
          onChange={(color) => form.setValue("color", color)}
        />
        {form.formState.errors.color && (
          <p className="text-sm text-destructive">
            {form.formState.errors.color.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Ícono
        </label>
        <IconPicker
          value={form.watch("icon")}
          onChange={(icon) => form.setValue("icon", icon)}
        />
        {form.formState.errors.icon && (
          <p className="text-sm text-destructive">
            {form.formState.errors.icon.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : category ? (
            "Guardar cambios"
          ) : (
            "Crear categoría"
          )}
        </Button>
      </div>
    </form>
  )
} 