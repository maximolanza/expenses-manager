"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { User as FirebaseUser } from "firebase/auth"
import { supabase } from "./supabase"
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"
import { AuthProvider as AuthProviderEnum, AuthUser, AuthContextType } from "@/types/auth"
import { mainConfig } from "@/config/mainConfig"

// Valores por defecto del contexto basados en la configuración
const DEFAULT_CONTEXT: AuthContextType = {
  user: null,
  loading: true,
  provider: mainConfig.auth.defaultProvider,
  error: null,
  signIn: async () => {},
  signOut: async () => {}
}

const AuthContext = createContext<AuthContextType>(DEFAULT_CONTEXT)

// Imprimir información de la versión en el primer renderizado
if (typeof window !== 'undefined') {
  console.info(
    `%c${mainConfig.ui.appName} %cv${mainConfig.app.version}`,
    'color: #7C3AED; font-weight: bold; font-size: 12px;',
    'color: #64748B; font-size: 12px;',
    `\nEntorno: ${mainConfig.app.environment}`
  )
}

/**
 * Procesa un usuario de Firebase y lo convierte al formato unificado
 */
const processFirebaseUser = (user: FirebaseUser | null): AuthUser | null => {
  if (!user) return null
  return {
    id: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    provider: AuthProviderEnum.FIREBASE
  }
}

/**
 * Procesa un usuario de Supabase y lo convierte al formato unificado
 */
const processSupabaseUser = (user: SupabaseUser | null): AuthUser | null => {
  if (!user) return null
  return {
    id: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.full_name || null,
    photoURL: user.user_metadata?.avatar_url || null,
    provider: AuthProviderEnum.SUPABASE
  }
}

/**
 * Proveedor de autenticación que maneja tanto Firebase como Supabase
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>(DEFAULT_CONTEXT)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Function to handle user sign out
    const handleUserSignOut = () => {
      if (!mounted) return
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        provider: mainConfig.auth.defaultProvider,
        error: null
      }))
    }

    // Solo configurar los listeners si está habilitado el soporte para múltiples proveedores
    if (mainConfig.features.multipleAuthProviders) {
      // Escuchar cambios de autenticación en Supabase
      const {
        data: { subscription: supabaseSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return
        const processedUser = processSupabaseUser(session?.user ?? null)
        
        setState(prev => ({
          ...prev,
          user: processedUser,
          loading: false,
          provider: processedUser ? AuthProviderEnum.SUPABASE : prev.provider,
          error: null
        }))
      })

      // Escuchar cambios de autenticación en Firebase
      const firebaseUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!mounted) return
        const processedUser = processFirebaseUser(firebaseUser)
        
        setState(prev => ({
          ...prev,
          user: processedUser,
          loading: false,
          provider: processedUser ? AuthProviderEnum.FIREBASE : prev.provider,
          error: null
        }))
      })

      // Obtener sesión inicial de Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return
        const processedUser = processSupabaseUser(session?.user ?? null)
        
        setState(prev => ({
          ...prev,
          user: processedUser,
          loading: false,
          provider: processedUser ? AuthProviderEnum.SUPABASE : prev.provider,
          error: null
        }))
      })

      // Limpieza al desmontar
      return () => {
        mounted = false
        supabaseSubscription.unsubscribe()
        firebaseUnsubscribe()
      }
    } else {
      // Si no está habilitado el soporte para múltiples proveedores,
      // solo configurar el proveedor por defecto
      if (mainConfig.auth.defaultProvider === AuthProviderEnum.SUPABASE) {
        const {
          data: { subscription: supabaseSubscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return
          const processedUser = processSupabaseUser(session?.user ?? null)
          
          setState(prev => ({
            ...prev,
            user: processedUser,
            loading: false,
            provider: AuthProviderEnum.SUPABASE,
            error: null
          }))
        })

        // Obtener sesión inicial de Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!mounted) return
          const processedUser = processSupabaseUser(session?.user ?? null)
          
          setState(prev => ({
            ...prev,
            user: processedUser,
            loading: false,
            provider: AuthProviderEnum.SUPABASE,
            error: null
          }))
        })

        return () => {
          mounted = false
          supabaseSubscription.unsubscribe()
        }
      } else {
        const firebaseUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!mounted) return
          const processedUser = processFirebaseUser(firebaseUser)
          
          setState(prev => ({
            ...prev,
            user: processedUser,
            loading: false,
            provider: AuthProviderEnum.FIREBASE,
            error: null
          }))
        })

        return () => {
          mounted = false
          firebaseUnsubscribe()
        }
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        throw error
      }
      const user = data.user
      setState(prev => ({
        ...prev,
        user: processSupabaseUser(user as SupabaseUser | null),
        loading: false,
        provider: AuthProviderEnum.SUPABASE,
        error: null
      }))
    } catch (e) {
      console.error("Error al iniciar sesión:", e)
      setError(e instanceof Error ? e.message : "Error al iniciar sesión")
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      await supabase.auth.signOut()
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        provider: mainConfig.auth.defaultProvider,
        error: null
      }))
    } catch (e) {
      console.error("Error al cerrar sesión:", e)
      setError(e instanceof Error ? e.message : "Error al cerrar sesión")
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook personalizado para acceder al contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }

  // Asegúrate de que no haya efectos secundarios en el primer renderizado
  // console.log({moment: "useAuth",context}); // Evita esto en el primer renderizado

  return context
} 