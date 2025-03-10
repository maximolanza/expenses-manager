"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Loader2 } from "lucide-react"

const storeFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category_id: z.string().min(1, "La categoría es requerida"),
  is_main: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  enabled: z.boolean().default(true),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

interface Category {
  id: number
  name: string
}

interface Store {
  id: number
  name: string
  location: string | null
  category_id: number
  is_main?: boolean
  is_hidden?: boolean
  enabled?: boolean
}

interface StoreFormProps {
  onSubmit: (data: {
    name: string;
    category_id: number; 
    is_main: boolean;
    is_hidden: boolean;
    enabled: boolean;
  }) => void;
  initialData?: Store;
  isLoading?: boolean;
}

export function StoreForm({ onSubmit, initialData, isLoading = false }: StoreFormProps) {
  const { supabase } = useSupabase()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      category_id: initialData?.category_id ? initialData.category_id.toString() : "",
      is_main: initialData?.is_main || false,
      is_hidden: initialData?.is_hidden || false,
      enabled: initialData?.enabled !== undefined ? initialData.enabled : true,
    },
  })

  // Efecto para actualizar el formulario cuando cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        category_id: initialData.category_id.toString(),
        is_main: initialData.is_main || false,
        is_hidden: initialData.is_hidden || false,
        enabled: initialData.enabled !== undefined ? initialData.enabled : true,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("store_categories")
          .select("id, name")
          .order("name")

        if (error) throw error

        setCategories(data || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  const handleSubmit = (data: StoreFormValues) => {
    onSubmit({
      ...data,
      category_id: parseInt(data.category_id),
    })
  }

  if (loading) {
    return <div className="flex justify-center py-4">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  }

  // Determinar si es modo edición (existe initialData)
  const isEditMode = !!initialData;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la tienda" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormField
            control={form.control}
            name="is_main"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Marcar como principal</FormLabel>
                  <FormDescription className="text-xs">
                    Las tiendas principales aparecerán al inicio de la lista
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_hidden"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ocultar de la lista principal</FormLabel>
                  <FormDescription className="text-xs">
                    Solo aparecerá cuando se busque específicamente
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Checkbox para Enabled - Solo mostrar en modo edición */}
          {isEditMode && (
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Habilitada</FormLabel>
                    <FormDescription className="text-xs">
                      Si está deshabilitada, no aparecerá en las listas
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </form>
    </Form>
  )
} 