"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useState } from "react"

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const { workspaces, isLoading, createWorkspace } = useWorkspace()
  const [workspaceName, setWorkspaceName] = useState("")

  // Redirigir si el usuario ya tiene workspaces
  useEffect(() => {
    if (!isLoading && workspaces.length > 0) {
      router.push("/dashboard")
    }
  }, [isLoading, workspaces, router])

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceName.trim()) {
      toast.error("Por favor ingresa un nombre para tu espacio de trabajo")
      return
    }

    const workspace = await createWorkspace(workspaceName.trim())
    if (workspace) {
      toast.success("¡Espacio de trabajo creado con éxito!")
      router.push("/dashboard")
    }
  }

  if (isLoading || !user || workspaces.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenido a Expenses Manager</CardTitle>
          <CardDescription>
            Para comenzar, crea tu primer espacio de trabajo. Podrás usarlo para gestionar tus gastos
            y compartirlo con otras personas si lo deseas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del espacio de trabajo</Label>
              <Input
                id="name"
                placeholder="Ej: Gastos Personales"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Crear Espacio de Trabajo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 