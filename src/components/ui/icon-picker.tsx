import { useState } from "react"
import { Input } from "./input"
import { ScrollArea } from "./scroll-area"
import { cn } from "@/lib/utils"

export const ICON_CATEGORIES = {
  "Gastos Comunes": ["💰", "💳", "💵", "🏦", "💸", "💱", "📊", "🧾", "💹", "📈"],
  "Hogar": ["🏠", "🛋️", "🛁", "🚿", "🪑", "🛏️", "⚡", "🔧", "🧹", "🪴", "🏡", "🪟"],
  "Transporte": ["🚗", "🚌", "🚇", "✈️", "🚅", "⛽", "🚲", "🛵", "🚕", "🚘", "🛺", "🚁"],
  "Alimentación": ["🍽️", "🍳", "🥗", "🍜", "🥘", "🍱", "🛒", "🥑", "☕", "🍕", "🥐", "🍖"],
  "Entretenimiento": ["🎮", "🎬", "🎵", "🎨", "🎭", "🎪", "🎟️", "🎱", "🎯", "🎲", "🎸", "🎺"],
  "Salud": ["💊", "🏥", "🩺", "🦷", "👓", "🧘", "🏃", "🚑", "💉", "🌡️", "🧪", "⚕️"],
  "Educación": ["📚", "✏️", "🎓", "💻", "📝", "📖", "🎒", "🔬", "📐", "🗂️", "🎯", "📓"],
  "Ropa": ["👕", "👖", "👗", "👔", "👠", "👟", "🧥", "🧦", "👜", "🎽", "👒", "🧢"],
  "Servicios": ["📱", "💻", "📺", "🌐", "📨", "📞", "💡", "��", "📡", "🖨️", "🛜"],
  "Mascotas": ["🐕", "🐈", "🐟", "🐦", "🐹", "🦮", "🐩", "🦜", "🐠", "🐇"],
  "Regalos y Ocio": ["🎁", "🎊", "🎉", "🎈", "🎀", "🎎", "🎍", "🎋", "🎏", "🎐"],
  "Otros": ["✂️", "📷", "🔑", "🗝️", "📌", "🔒", "🎵", "📎", "🔍", "📦"]
}

interface IconPickerProps {
  value?: string
  onChange: (icon: string) => void
  className?: string
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [search, setSearch] = useState("")
  
  const filteredCategories = Object.entries(ICON_CATEGORIES).map(([category, icons]) => ({
    category,
    icons: icons.filter(icon => 
      icon.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(({ icons }) => icons.length > 0)

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <Input
        type="text"
        placeholder="Buscar ícono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />
      <ScrollArea className="h-[300px] w-full rounded-md border">
        <div className="p-4">
          {filteredCategories.map(({ category, icons }) => (
            <div key={category} className="mb-6 w-full last:mb-0">
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                {category}
              </h4>
              <div className="grid w-full grid-cols-8 gap-3 sm:grid-cols-10 md:grid-cols-12">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => onChange(icon)}
                    className={cn(
                      "flex aspect-square w-full items-center justify-center rounded-md text-lg transition-all hover:bg-accent hover:scale-110",
                      value === icon && "bg-primary text-primary-foreground"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 