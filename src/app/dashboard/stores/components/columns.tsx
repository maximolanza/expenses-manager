"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Store {
  id: number
  name: string
  category_id: number
  categories: {
    id: number
    name: string
  }
}

export const columns: ColumnDef<Store>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "categories.name",
    header: "Categoría",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const store = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                // Aquí puedes agregar la lógica para editar
                console.log("Edit store:", store)
              }}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // Aquí puedes agregar la lógica para eliminar
                console.log("Delete store:", store)
              }}
              className="text-red-600"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 