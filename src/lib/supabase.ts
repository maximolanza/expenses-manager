"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Validar las variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// Función para validar URL de Supabase
const validateSupabaseUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    
    // Verificar que es una URL de Supabase válida
    if (!parsedUrl.hostname.includes('supabase')) {
      throw new Error('La URL no parece ser una URL válida de Supabase')
    }
    
    // Verificar el protocolo
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('La URL debe usar protocolo HTTP o HTTPS')
    }

    // Intentar resolver el dominio
    // if (typeof window !== 'undefined') {
    //   console.info(
    //     '%c🔍 Validando conexión a Supabase...',
    //     'color: #3B82F6; font-weight: bold;',
    //     {
    //       hostname: parsedUrl.hostname,
    //       protocol: parsedUrl.protocol,
    //       timestamp: new Date().toISOString()
    //     }
    //   )
    // }

    return true
  } catch (error) {
    console.error(
      '%c🔴 Error al validar URL de Supabase',
      'color: #EF4444; font-weight: bold;',
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      }
    )
    throw error
  }
}

if (!SUPABASE_URL) {
  console.error('%c🔴 Error: Falta NEXT_PUBLIC_SUPABASE_URL', 'color: #EF4444; font-weight: bold;')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!SUPABASE_ANON_KEY) {
  console.error('%c🔴 Error: Falta NEXT_PUBLIC_SUPABASE_ANON_KEY', 'color: #EF4444; font-weight: bold;')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Validar formato de URL
validateSupabaseUrl(SUPABASE_URL)

// Crear cliente de Supabase
export const supabase = createClientComponentClient<Database>()

// Log de inicialización exitosa
if (typeof window !== 'undefined') {
  console.info(
'🟢 Cliente Supabase inicializado correctamente');
}


