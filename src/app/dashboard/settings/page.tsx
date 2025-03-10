"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Icons } from "@/components/icons"
import { DataCleanup } from "./data-cleanup"
import { DataExport } from "./data-export"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Evitar problemas de hidratación montando el componente solo en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Personaliza la aplicación a tu gusto
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>
              Personaliza cómo se ve la aplicación. Automático se ajustará según las preferencias de tu sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <RadioGroup
                defaultValue={theme}
                onValueChange={(value: string) => setTheme(value)}
                className="grid gap-4 pt-2"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="light"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="light"
                    className="flex items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-x-2">
                      <Icons.sun className="h-5 w-5" />
                      <div className="space-y-1">
                        <p className="font-medium leading-none">Claro</p>
                        <p className="text-sm text-muted-foreground">
                          Utiliza el tema claro
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="dark"
                    className="flex items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-x-2">
                      <Icons.moon className="h-5 w-5" />
                      <div className="space-y-1">
                        <p className="font-medium leading-none">Oscuro</p>
                        <p className="text-sm text-muted-foreground">
                          Utiliza el tema oscuro
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="system"
                    id="system"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="system"
                    className="flex items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-x-2">
                      <Icons.laptop className="h-5 w-5" />
                      <div className="space-y-1">
                        <p className="font-medium leading-none">Sistema</p>
                        <p className="text-sm text-muted-foreground">
                          Sigue las preferencias del sistema
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="pt-2 space-y-4">
                <div className="h-24 rounded-lg border-2 border-muted animate-pulse" />
                <div className="h-24 rounded-lg border-2 border-muted animate-pulse" />
                <div className="h-24 rounded-lg border-2 border-muted animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Componente para limpieza de datos */}
        <DataCleanup />
        
        {/* Componente para exportación de datos */}
        <DataExport />
      </div>
    </div>
  )
} 