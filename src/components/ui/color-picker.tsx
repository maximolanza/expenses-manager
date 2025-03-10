import { cn } from "@/lib/utils"

export const COLOR_CATEGORIES = {
  "Colores Principales": [
    { name: "Rojo", value: "#ef4444" },
    { name: "Naranja", value: "#f97316" },
    { name: "Amarillo", value: "#eab308" },
    { name: "Verde", value: "#22c55e" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Morado", value: "#a855f7" },
    { name: "Rosa", value: "#ec4899" },
  ],
  "Tonos Suaves": [
    { name: "Rojo Suave", value: "#fca5a5" },
    { name: "Naranja Suave", value: "#fdba74" },
    { name: "Amarillo Suave", value: "#fde047" },
    { name: "Verde Suave", value: "#86efac" },
    { name: "Azul Suave", value: "#93c5fd" },
    { name: "Morado Suave", value: "#d8b4fe" },
    { name: "Rosa Suave", value: "#f9a8d4" },
  ],
  "Tonos Oscuros": [
    { name: "Rojo Oscuro", value: "#b91c1c" },
    { name: "Naranja Oscuro", value: "#c2410c" },
    { name: "Amarillo Oscuro", value: "#a16207" },
    { name: "Verde Oscuro", value: "#15803d" },
    { name: "Azul Oscuro", value: "#1d4ed8" },
    { name: "Morado Oscuro", value: "#7e22ce" },
    { name: "Rosa Oscuro", value: "#be185d" },
  ],
  "Neutros": [
    { name: "Gris Claro", value: "#f3f4f6" },
    { name: "Gris", value: "#9ca3af" },
    { name: "Gris Oscuro", value: "#4b5563" },
    { name: "Negro", value: "#1f2937" },
  ]
}

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {Object.entries(COLOR_CATEGORIES).map(([category, colors]) => (
        <div key={category} className="space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground">
            {category}
          </h4>
          <div className="grid grid-cols-7 gap-1.5">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => onChange(color.value)}
                className={cn(
                  "group relative h-6 w-full rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1",
                  value === color.value && "ring-2 ring-primary ring-offset-1"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                <span className="absolute -bottom-5 left-1/2 z-10 -translate-x-1/2 transform whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 