import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'
import { AuthError } from '@supabase/supabase-js'
import { useAuth } from '@/lib/auth-context'
import { AuthProvider } from '@/types/auth'
import { mainConfig } from '@/config/mainConfig'
import { useRouter } from 'next/navigation'

// Estilos para los logs
const logStyles = {
  firebase: {
    title: 'color: #FFA000; font-weight: bold; font-size: 12px;',
    action: 'color: #F57C00; font-weight: normal; font-size: 12px;',
    info: 'color: #777777; font-size: 11px;'
  },
  supabase: {
    title: 'color: #3ECF8E; font-weight: bold; font-size: 12px;',
    action: 'color: #00A36C; font-weight: normal; font-size: 12px;',
    info: 'color: #777777; font-size: 11px;'
  }
}

// Función para loggear acciones de autenticación
const logAuthAction = (provider: AuthProvider, action: string, info?: any) => {
  const styles = provider === AuthProvider.FIREBASE ? logStyles.firebase : logStyles.supabase
  console.log(
    `%c${provider.toUpperCase()} %c${action}`,
    styles.title,
    styles.action,
    info ? '\n' : '',
    info ? `%c${JSON.stringify(info, null, 2)}` : '',
    info ? styles.info : ''
  )
}

// Interfaces para los handlers de autenticación
interface AuthHandlerResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

interface IAuthImplementation {
  signIn(email: string, password: string): Promise<AuthHandlerResult>
  signUp(email: string, password: string, fullName: string): Promise<AuthHandlerResult>
  signOut(): Promise<AuthHandlerResult>
  signInWithGoogle(): Promise<AuthHandlerResult>
}

// Implementación de Firebase
const firebaseAuthImplementation: IAuthImplementation = {
  async signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, data: result.user }
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Error al iniciar sesión con Firebase' 
      }
    }
  },

  async signUp(email: string, password: string, fullName: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      // TODO: Actualizar el perfil del usuario con fullName
      return { success: true, data: result.user }
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Error al registrarse con Firebase' 
      }
    }
  },

  async signOut() {
    try {
      await firebaseSignOut(auth)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Error al cerrar sesión en Firebase' 
      }
    }
  },

  async signInWithGoogle() {
    try {
      const googleProvider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, googleProvider)
      return { success: true, data: result.user }
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Error al iniciar sesión con Google en Firebase' 
      }
    }
  }
}

// Implementación de Supabase
const supabaseAuthImplementation: IAuthImplementation = {
  async signIn(email: string, password: string) {
    try {
      // Log de intento de conexión
      console.info(
        '%c🔄 Iniciando autenticación con Supabase...',
        'color: #3ECF8E; font-weight: bold;',
        {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          email,
          timestamp: new Date().toISOString()
        }
      )

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Log del resultado
      if (error) {
        console.error(
          '%c❌ Error de autenticación',
          'color: #EF4444; font-weight: bold;',
          {
            error,
            timestamp: new Date().toISOString()
          }
        )
        throw error
      }

      console.info(
        '%c✅ Autenticación exitosa',
        'color: #10B981; font-weight: bold;',
        {
          userId: data.user?.id,
          timestamp: new Date().toISOString()
        }
      )

      return { success: true, data }
    } catch (error) {
      // Log detallado del error
      console.error(
        '%c🔴 Error en el proceso de autenticación',
        'color: #EF4444; font-weight: bold;',
        {
          error,
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      )

      // Manejar errores específicos de red
      if (error instanceof Error) {
        if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          return {
            success: false,
            error: 'No se puede conectar al servidor de autenticación. Posibles causas:\n' +
                   '- La URL de Supabase es incorrecta\n' +
                   '- Hay problemas de DNS\n' +
                   '- No hay conexión a internet'
          }
        }
        if (error.message === 'Failed to fetch') {
          return {
            success: false,
            error: 'Error de conexión. Por favor:\n' +
                   '- Verifica tu conexión a internet\n' +
                   '- Asegúrate de que el servidor de Supabase esté disponible\n' +
                   '- Intenta nuevamente en unos momentos'
          }
        }
      }

      // Otros errores de Supabase
      return { 
        success: false, 
        error: getErrorMessage(error as AuthError) 
      }
    }
  },

  async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      if (data.user?.identities?.length === 0) {
        throw new Error('Este email ya está registrado')
      }
      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: getErrorMessage(error as AuthError) 
      }
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: getErrorMessage(error as AuthError) 
      }
    }
  },

  async signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: mainConfig.auth.oAuth.callbackUrl,
        },
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: getErrorMessage(error as AuthError) 
      }
    }
  }
}

function getErrorMessage(error: AuthError | Error): string {
  if (error instanceof AuthError) {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas. Por favor, verifica tu email y contraseña.'
      case 'Email not confirmed':
        return 'Por favor, confirma tu email antes de iniciar sesión.'
      case 'User already registered':
        return 'Este email ya está registrado.'
      case 'Password should be at least 6 characters':
        return 'La contraseña debe tener al menos 6 caracteres.'
      default:
        return error.message || 'Ha ocurrido un error. Por favor, intenta nuevamente.'
    }
  }
  return error.message || 'Ha ocurrido un error. Por favor, intenta nuevamente.'
}

export function useAuthHandler() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { provider } = useAuth()
  const router = useRouter()

  // Log del proveedor actual
  useEffect(() => {
    console.info(
      '%cAuth Provider: %c' + provider,
      'color: #3B82F6; font-weight: bold;',
      'color: #10B981; font-weight: bold;'
    )
  }, [provider])

  // Seleccionar la implementación según el proveedor
  const implementation = provider === AuthProvider.FIREBASE 
    ? firebaseAuthImplementation 
    : supabaseAuthImplementation

  const handleAuthAction = async <T,>(
    action: () => Promise<AuthHandlerResult<T>>,
    successRedirect?: string,
    actionName?: string
  ) => {
    setLoading(true)
    setError(null)
    
    logAuthAction(provider, actionName || 'Auth Action')
    
    try {
      const result = await action()
      
      if (result.success) {
        if (successRedirect) {
          console.info(
            '%c🔒 Redirigiendo después de autenticación exitosa',
            'color: #3B82F6; font-weight: bold;',
            {
              to: successRedirect,
              timestamp: new Date().toISOString()
            }
          )

          // Construir URL absoluta para la redirección
          const redirectUrl = new URL(successRedirect, window.location.origin).toString()
          
          // Usar replace para prevenir navegación hacia atrás
          router.replace(redirectUrl)
        }
        return result.data
      } else {
        setError(result.error || 'Ha ocurrido un error')
        return null
      }
    } catch (err) {
      const message = getErrorMessage(err as AuthError | Error)
      console.error(
        '%c❌ Error en autenticación',
        'color: #EF4444; font-weight: bold;',
        {
          error: err,
          message,
          timestamp: new Date().toISOString()
        }
      )
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    signIn: (email: string, password: string) => 
      handleAuthAction(
        () => implementation.signIn(email, password),
        mainConfig.auth.redirects.afterLogin,
        'Sign In with Email'
      ),
    signUp: (email: string, password: string, fullName: string) => 
      handleAuthAction(
        () => implementation.signUp(email, password, fullName),
        mainConfig.auth.redirects.afterLogin,
        'Sign Up'
      ),
    signOut: () => 
      handleAuthAction(
        () => implementation.signOut(),
        mainConfig.auth.redirects.afterLogout,
        'Sign Out'
      ),
    signInWithGoogle: () => 
      handleAuthAction(
        () => implementation.signInWithGoogle(),
        mainConfig.auth.redirects.afterLogin,
        'Sign In with Google'
      ),
  }
} 