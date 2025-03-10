"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export default function NewWorkspacePage() {
  const router = useRouter()
  const { createWorkspace } = useWorkspace()
  const [workspaceName, setWorkspaceName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceName.trim()) {
      toast.error("Por favor ingresa un nombre para tu espacio de trabajo")
      return
    }

    setIsLoading(true)
    try {
      const workspace = await createWorkspace(workspaceName.trim())
      if (workspace) {
        toast.success("¡Espacio de trabajo creado con éxito!")
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Error al crear el espacio de trabajo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Espacio de Trabajo</CardTitle>
          <CardDescription>
            Crea un nuevo espacio de trabajo para gestionar tus gastos y compartirlo con otras personas.
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
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Espacio de Trabajo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 