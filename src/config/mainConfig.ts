import { AuthProvider } from "@/types/auth"
// @ts-ignore - Ignorar error de tipado al importar JSON
import packageJson from "../../package.json"

/**
 * Obtiene la URL de callback de forma segura para SSR
 */
const getCallbackUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` : '/auth/callback'
  }
  return `${window.location.origin}/auth/callback`
}

/**
 * Información de la aplicación
 */
export const appInfo = {
  /** Versión de la aplicación (desde package.json) */
  version: packageJson.version,
  /** Entorno de ejecución */
  environment: process.env.NODE_ENV || 'development',
  /** Fecha de compilación */
  buildDate: new Date().toISOString(),
} as const

/**
 * Configuración de autenticación
 */
export const authConfig = {
  /** Proveedor de autenticación por defecto */
  defaultProvider: AuthProvider.SUPABASE,
  
  /** Configuración de redirecciones */
  redirects: {
    /** Ruta después del inicio de sesión exitoso */
    afterLogin: '/dashboard',
    /** Ruta después del cierre de sesión */
    afterLogout: '/auth/login',
    /** Ruta para usuarios no autenticados */
    auth: '/auth/login',
    /** Ruta para usuarios autenticados */
    protected: '/dashboard',
  },

  /** Configuración de proveedores OAuth */
  oAuth: {
    /** URL de callback para autenticación OAuth */
    get callbackUrl() {
      return getCallbackUrl()
    },
    /** Proveedores habilitados */
    providers: ['google'] as const
  }
} as const

/**
 * Configuración de la interfaz de usuario
 */
export const uiConfig = {
  /** Nombre de la aplicación */
  appName: 'Gestor de Gastos',
  /** Descripción de la aplicación */
  appDescription: 'Gestiona tus gastos de manera eficiente',
  /** Tema por defecto */
  defaultTheme: 'light' as const,
  /** Idioma por defecto */
  defaultLocale: 'es' as const,
} as const

/**
 * Configuración de la API
 */
export const apiConfig = {
  /** URL base de la API */
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  /** Versión de la API */
  version: 'v1',
  /** Timeout por defecto para peticiones (en ms) */
  timeout: 10000,
} as const

/**
 * Configuración de características
 */
export const featureFlags = {
  /** Habilitar múltiples proveedores de autenticación */
  multipleAuthProviders: false,
  /** Habilitar tema oscuro */
  darkMode: true,
  /** Habilitar notificaciones */
  notifications: true,
} as const

/**
 * Configuración global del proyecto
 */
export const mainConfig = {
  app: appInfo,
  auth: authConfig,
  ui: uiConfig,
  api: apiConfig,
  features: featureFlags,
} as const

export type MainConfig = typeof mainConfig 