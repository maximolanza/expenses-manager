"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, AuthProvider } from "@/lib/auth-context"

function AuthLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Si el usuario ya está autenticado, redirigir al dashboard
      // y prevenir que vuelva a la página de login
      router.replace("/dashboard")
    }
  }, [user, router])

  // Solo mostrar el contenido si no hay usuario autenticado
  return !user ? children : null
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AuthLayoutContent>
        {children}
      </AuthLayoutContent>
    </AuthProvider>
  )
}
