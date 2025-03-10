"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
import { Checkbox } from "@/components/ui/checkbox"
import { PaymentMethod, PaymentCard } from "@/types/supabase"
import { Loader2 } from "lucide-react"

const paymentCardSchema = z.object({
  card_type: z.enum(["Debito", "Credito", "Prepaga"] as const),
  bank: z.string().min(1, "El nombre del banco es requerido"),
  owner_name: z.string().min(1, "El nombre del titular es requerido"),
  last_four_digits: z.string()
    .min(4, "Debe tener 4 dígitos")
    .max(4, "Debe tener 4 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),
  card_name: z.string().min(1, "El nombre de la tarjeta es requerido"),
  is_default: z.boolean().default(false)
})

type PaymentCardFormValues = z.infer<typeof paymentCardSchema>

interface PaymentCardFormProps {
  initialValues?: PaymentCard
  onSubmit: (data: PaymentCardFormValues) => Promise<void>
  onCancel: () => void
}

export function PaymentCardForm({ initialValues, onSubmit, onCancel }: PaymentCardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PaymentCardFormValues>({
    resolver: zodResolver(paymentCardSchema),
    defaultValues: initialValues ? {
      card_type: initialValues.card_type,
      bank: initialValues.bank,
      owner_name: initialValues.owner_name,
      last_four_digits: initialValues.last_four_digits,
      card_name: initialValues.card_name,
      is_default: initialValues.is_default
    } : {
      card_type: "Debito",
      bank: "",
      owner_name: "",
      last_four_digits: "",
      card_name: "",
      is_default: false
    }
  })

  const handleSubmit = async (data: PaymentCardFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error("Error al guardar la tarjeta:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCardTypeLabel = (type: PaymentMethod) => {
    switch (type) {
      case 'Debito': return 'Débito'
      case 'Credito': return 'Crédito'
      case 'Prepaga': return 'Prepaga'
      default: return type
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="card_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la tarjeta</FormLabel>
              <FormControl>
                <Input placeholder="ej. Mi tarjeta principal" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Un nombre para identificar esta tarjeta fácilmente
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="card_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de tarjeta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Debito">{getCardTypeLabel("Debito")}</SelectItem>
                    <SelectItem value="Credito">{getCardTypeLabel("Credito")}</SelectItem>
                    <SelectItem value="Prepaga">{getCardTypeLabel("Prepaga")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Santander" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="owner_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titular de la tarjeta</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo del titular" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_four_digits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Últimos 4 dígitos</FormLabel>
              <FormControl>
                <Input 
                  placeholder="1234" 
                  maxLength={4}
                  {...field} 
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    field.onChange(value)
                  }}
                />
              </FormControl>
              <FormDescription>
                Solo los últimos 4 dígitos para identificar la tarjeta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Tarjeta predeterminada</FormLabel>
                <FormDescription>
                  Esta tarjeta se seleccionará automáticamente al registrar nuevos tickets
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

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
              "Actualizar tarjeta"
            ) : (
              "Añadir tarjeta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 