"use client"

import { useCallback, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["product_categories"]["Row"]
  brand?: Database["public"]["Tables"]["brands"]["Row"]
  latest_price?: number
}

type ProductInput = Database["public"]["Tables"]["products"]["Insert"]

export function useProducts() {
  const { supabase } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)

  // Función para verificar si ya existe un producto con el mismo nombre
  const checkProductExists = useCallback(async (name: string): Promise<any[]> => {
    if (!workspace) return []

    try {
      // Buscar productos con nombre exactamente igual (case insensitive)
      const { data: exactMatches, error: exactError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          barcode,
          image_url,
          created_at,
          category:product_categories(
            id,
            name
          ),
          brand:brands(
            id,
            name,
            logo_url
          )
        `)
        .eq("workspace_id", workspace.id)
        .ilike("name", name)
      
      if (exactError) {
        console.error("Error checking if product exists:", exactError)
        throw exactError
      }

      return exactMatches || []
    } catch (error) {
      console.error("Error checking product existence:", error)
      return []
    }
  }, [supabase, workspace])

  const getProducts = useCallback(async (storeId?: number, searchQuery?: string) => {
    if (!workspace) return []

    try {
      setLoading(true)
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          barcode,
          image_url,
          created_at,
          category:product_categories(
            id,
            name
          ),
          brand:brands(
            id,
            name,
            logo_url
          )
        `)
        .eq("workspace_id", workspace.id)
        .order("name", { ascending: true })

      if (searchQuery) {
        // Mejorar la búsqueda para mostrar resultados más relevantes
        // Primero intentamos una coincidencia exacta (case insensitive)
        query = query.ilike("name", `%${searchQuery}%`)
      }

      const { data: products, error } = await query

      if (error) {
        console.error("Supabase error fetching products:", error)
        throw error
      }

      if (!products || products.length === 0) {
        return []
      }

      // Obtener los precios más recientes para todos los productos
      // Si hay una tienda seleccionada, obtenemos los precios específicos para esa tienda
      const { data: prices, error: pricesError } = await supabase
        .from("product_price_history")
        .select("product_id, store_id, price, date")
        .in("product_id", products.map(p => p.id))
        .order("date", { ascending: false })

      if (pricesError) {
        console.error("Error fetching product prices:", pricesError)
        throw pricesError
      }
        
      // Crear un mapa de los últimos precios por producto y tienda
      const latestPrices: Record<number, Record<number, number>> = {}
      
      prices?.forEach(price => {
        if (!latestPrices[price.product_id]) {
          latestPrices[price.product_id] = {}
        }
        
        if (!latestPrices[price.product_id][price.store_id]) {
          latestPrices[price.product_id][price.store_id] = price.price
        }
      })

      // Ordenar productos para mostrar las coincidencias más relevantes primero
      const sortedProducts = products.slice().sort((a, b) => {
        // Si hay búsqueda, priorizar los que comienzan con el término de búsqueda
        if (searchQuery) {
          const aStartsWithQuery = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
          const bStartsWithQuery = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1;
          if (!aStartsWithQuery && bStartsWithQuery) return 1;
        }
        
        // Luego ordenar alfabéticamente
        return a.name.localeCompare(b.name);
      });

      // Agregar los últimos precios a los productos
      return sortedProducts.map(product => ({
        ...product,
        // Si hay una tienda seleccionada, devolver el precio específico
        latest_price: storeId && latestPrices[product.id] ? 
          latestPrices[product.id][storeId] : 
          null,
        // Incluimos todos los precios disponibles por tienda para posible uso
        prices_by_store: latestPrices[product.id] || {}
      }))
    } catch (error) {
      console.error("Error fetching products:", error instanceof Error ? error.message : error)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const createProduct = useCallback(async (data: {
    name: string
    description?: string
    categoryId?: number
    brandId?: number
    storeId?: number
    price?: number
  }) => {
    if (!workspace) return null

    try {
      setLoading(true)

      // Verificar si ya existe un producto con el mismo nombre
      const existingProducts = await checkProductExists(data.name)
      
      if (existingProducts.length > 0) {
        // Si encuentra un producto con nombre exactamente igual (case insensitive)
        const exactMatch = existingProducts.find(
          p => p.name.toLowerCase() === data.name.toLowerCase()
        )
        
        if (exactMatch) {
          throw new Error(`Ya existe un producto con el nombre "${data.name}". Por favor, use un nombre diferente.`)
        }
        
        // Si hay productos similares, podemos continuar pero advirtiendo
        console.warn(`Se encontraron ${existingProducts.length} productos con nombres similares a "${data.name}".`)
      }

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("No se pudo obtener el usuario")

      // Crear el producto sin asociarlo a una tienda específica
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          workspace_id: workspace.id,
          name: data.name,
          description: data.description || null,
          category_id: data.categoryId || null,
          brand_id: data.brandId || null,
          created_by: user.id,
        })
        .select(`
          *,
          category:product_categories(
            id,
            name
          ),
          brand:brands(
            id,
            name,
            logo_url
          )
        `)
        .single()

      if (productError) {
        throw productError
      }

      // Si se proporciona un precio y una tienda, registrar el precio
      if (data.price && data.storeId && product) {
        const { error: priceError } = await supabase
          .from("product_price_history")
          .insert({
            product_id: product.id,
            store_id: data.storeId,
            price: data.price,
            recorded_by: user.id,
          })

        if (priceError) {
          throw priceError
        }
        
        // Adjuntar el precio al producto que devolvemos
        return {
          ...product,
          latest_price: data.price,
          prices_by_store: {
            [data.storeId]: data.price
          }
        }
      }

      return product
    } catch (error) {
      console.error("Error creating product:", error)
      throw error; // Ahora propagamos el error para manejarlo en los componentes
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace, checkProductExists])

  const getBrands = useCallback(async () => {
    if (!workspace) return []

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("brands")
        .select()
        .eq("workspace_id", workspace.id)

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching brands:", error)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const createBrand = useCallback(async (data: {
    name: string
    description?: string
    website?: string
    logoUrl?: string
  }) => {
    if (!workspace) return null

    try {
      setLoading(true)
      const { data: brand, error } = await supabase
        .from("brands")
        .insert({
          workspace_id: workspace.id,
          name: data.name,
          description: data.description || null,
          website: data.website || null,
          logo_url: data.logoUrl || null,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return brand
    } catch (error) {
      console.error("Error creating brand:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const getProductCategories = useCallback(async () => {
    if (!workspace) return []

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("product_categories")
        .select()
        .eq("workspace_id", workspace.id)

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching product categories:", error)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  const createProductCategory = useCallback(async (data: { name: string }) => {
    if (!workspace) return null

    try {
      setLoading(true)
      const { data: category, error } = await supabase
        .from("product_categories")
        .insert({
          workspace_id: workspace.id,
          name: data.name,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return category
    } catch (error) {
      console.error("Error creating product category:", error)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, workspace])

  return {
    loading,
    getProducts,
    createProduct,
    checkProductExists,
    getBrands,
    createBrand,
    getProductCategories,
    getCategories: getProductCategories,
    createProductCategory,
  }
} 