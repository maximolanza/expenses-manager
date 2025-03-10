"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { CheckCircle, Moon, Sun, Laptop } from "lucide-react"

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hidratación montando el componente solo del lado del cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (value: string) => {
    setTheme(value)
    
    let themeIcon;
    let themeName;
    
    switch (value) {
      case 'light':
        themeIcon = <Sun className="h-5 w-5 text-yellow-500" />;
        themeName = 'claro';
        break;
      case 'dark':
        themeIcon = <Moon className="h-5 w-5 text-blue-500" />;
        themeName = 'oscuro';
        break;
      case 'system':
        themeIcon = <Laptop className="h-5 w-5 text-gray-500" />;
        themeName = 'del sistema';
        break;
      default:
        themeIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
        themeName = value;
    }
    
    toast.success(`Tema cambiado`, {
      description: `Se ha aplicado el tema ${themeName}`,
      icon: themeIcon,
      duration: 3000,
    });
  }

  if (!mounted) {
    return null // No renderizar nada durante SSR
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Apariencia</h2>
        <p className="text-sm text-muted-foreground">
          Personaliza la apariencia de la aplicación. Automáticamente se ajusta al tema del sistema por defecto.
        </p>
      </div>
      <RadioGroup
        defaultValue={theme}
        onValueChange={handleThemeChange}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <RadioGroupItem value="light" id="light" className="peer sr-only" />
            <Label
              htmlFor="light"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="mb-3 h-6 w-6"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <span className="text-sm font-medium">Claro</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
            <Label
              htmlFor="dark"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="mb-3 h-6 w-6"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
              <span className="text-sm font-medium">Oscuro</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="system" id="system" className="peer sr-only" />
            <Label
              htmlFor="system"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="mb-3 h-6 w-6"
              >
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
              <span className="text-sm font-medium">Sistema</span>
            </Label>
          </div>
        </div>
      </RadioGroup>
    </div>
  )
} 