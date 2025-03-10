"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { usePoints } from "@/hooks/use-points"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, PlusCircle, Trash } from "lucide-react"
import { type PointsConversionType } from "@/types/supabase"

const pointsSystemSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  point_name_singular: z.string().min(1, "Ingresa el nombre singular de la unidad"),
  point_name_plural: z.string().min(1, "Ingresa el nombre plural de la unidad"),
  conversion_type: z.enum(["fixed", "variable"]),
  conversion_rate: z.number().nullable().optional(),
  enabled: z.boolean().default(true),
  available_for_purchases: z.boolean().default(true),
  tiers: z.array(
    z.object({
      minAmount: z.number().min(0),
      rate: z.number().min(0)
    })
  ).optional()
})

type PointsSystemFormValues = z.infer<typeof pointsSystemSchema>

interface PointsSystemFormProps {
  initialValues?: any
  onSubmit: (data: PointsSystemFormValues) => Promise<void>
  onCancel: () => void
}

export function PointsSystemForm({ initialValues, onSubmit, onCancel }: PointsSystemFormProps) {
  const { createPointsSystem, updatePointsSystem } = usePoints()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tiers, setTiers] = useState<{ minAmount: number; rate: number }[]>(
    initialValues?.metadata?.tiers || []
  )

  const form = useForm<PointsSystemFormValues>({
    resolver: zodResolver(pointsSystemSchema),
    defaultValues: initialValues ? {
      name: initialValues.name,
      point_name_singular: initialValues.point_name_singular,
      point_name_plural: initialValues.point_name_plural,
      conversion_type: initialValues.conversion_type as PointsConversionType,
      conversion_rate: initialValues.conversion_rate,
      enabled: initialValues.enabled,
      available_for_purchases: initialValues.available_for_purchases,
      tiers: initialValues.metadata?.tiers || []
    } : {
      name: "",
      point_name_singular: "punto",
      point_name_plural: "puntos",
      conversion_type: "fixed" as PointsConversionType,
      conversion_rate: 1,
      enabled: true,
      available_for_purchases: true,
      tiers: []
    }
  })

  const conversionType = form.watch("conversion_type")

  const handleAddTier = () => {
    setTiers([...tiers, { minAmount: 0, rate: 0 }])
  }

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  const handleTierChange = (index: number, field: keyof typeof tiers[0], value: number) => {
    const newTiers = [...tiers]
    newTiers[index][field] = value
    setTiers(newTiers)
  }

  const handleSubmit = async (data: PointsSystemFormValues) => {
    setIsSubmitting(true)
    try {
      const metadata: Record<string, any> = {}
      
      // Agregar los tiers al metadata si es del tipo variable
      if (data.conversion_type === "variable") {
        metadata.tiers = tiers
      }

      if (initialValues) {
        // Actualizar sistema existente
        const result = await updatePointsSystem(initialValues.id, {
          name: data.name,
          point_name_singular: data.point_name_singular,
          point_name_plural: data.point_name_plural,
          conversion_type: data.conversion_type,
          conversion_rate: data.conversion_type === "fixed" ? data.conversion_rate : null,
          enabled: data.enabled,
          available_for_purchases: data.available_for_purchases,
          metadata
        })

        if (result.success) {
          toast.success("Sistema actualizado correctamente")
          form.reset()
          await onSubmit(data)
        } else {
          toast.error("Error al actualizar el sistema")
        }
      } else {
        // Crear nuevo sistema
        const result = await createPointsSystem({
          name: data.name,
          point_name_singular: data.point_name_singular,
          point_name_plural: data.point_name_plural,
          conversion_type: data.conversion_type,
          conversion_rate: data.conversion_type === "fixed" ? data.conversion_rate : null,
          enabled: data.enabled,
          available_for_purchases: data.available_for_purchases,
          metadata
        })

        if (result.success) {
          toast.success("Sistema creado correctamente")
          form.reset()
          await onSubmit(data)
        } else {
          toast.error("Error al crear el sistema")
        }
      }
    } catch (error) {
      console.error("Error al guardar el sistema:", error)
      toast.error("Error al guardar el sistema")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del sistema</FormLabel>
              <FormControl>
                <Input 
                  placeholder="ej. Puntos de fidelidad" 
                  {...field} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormDescription>
                Un nombre descriptivo para identificar este sistema
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="point_name_singular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre singular</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ej. punto" 
                    {...field} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormDescription>
                  Nombre para 1 unidad
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="point_name_plural"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre plural</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ej. puntos" 
                    {...field} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormDescription>
                  Nombre para múltiples unidades
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        <FormField
          control={form.control}
          name="conversion_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de conversión</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de conversión" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed">Tasa fija</SelectItem>
                  <SelectItem value="variable">Tasa variable</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === "fixed" 
                  ? "Tasa única para todas las compras" 
                  : "Diferentes tasas según montos"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {conversionType === "fixed" ? (
          <FormField
            control={form.control}
            name="conversion_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasa de conversión</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="ej. 1" 
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormDescription>
                  Cantidad de puntos por cada peso gastado
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Rangos de conversión</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTier}
                disabled={isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir rango
              </Button>
            </div>
            
            {tiers.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                No hay rangos definidos. Añade al menos uno para configurar la tasa variable.
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-end gap-3 bg-muted/20 p-2 rounded-md">
                    <div className="flex-1">
                      <FormLabel>Monto mínimo</FormLabel>
                      <Input
                        type="number"
                        min={0}
                        value={tier.minAmount}
                        onChange={(e) => 
                          handleTierChange(index, "minAmount", parseFloat(e.target.value) || 0)
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex-1">
                      <FormLabel>Tasa</FormLabel>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={tier.rate}
                        onChange={(e) => 
                          handleTierChange(index, "rate", parseFloat(e.target.value) || 0)
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTier(index)}
                      disabled={isSubmitting}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <FormDescription>
              Configura diferentes tasas según el monto de la compra. Por ejemplo: compras mayores a 1000 pesos generan 2 puntos por peso.
            </FormDescription>
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Activo</FormLabel>
                  <FormDescription>
                    Si está activo, los usuarios podrán acumular y usar puntos
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="available_for_purchases"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Disponible para compras</FormLabel>
                  <FormDescription>
                    Si está disponible, este sistema aparecerá en el proceso de compra para canje de puntos
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : initialValues ? (
              "Actualizar sistema"
            ) : (
              "Crear sistema"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 