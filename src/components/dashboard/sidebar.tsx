"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Home,
  Package,
  Plus,
  Receipt,
  Settings,
  Store,
  Users,
  Tags,
  Building2
} from "lucide-react"
import { useWorkspace } from "@/components/providers/workspace-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Tickets",
    icon: Receipt,
    href: "/dashboard/tickets",
    color: "text-violet-500",
  },
  {
    label: "Tiendas",
    icon: Store,
    href: "/dashboard/stores",
    color: "text-orange-700",
  },
  {
    label: "Categorías",
    icon: Tags,
    href: "/dashboard/categories",
    color: "text-yellow-600",
  },
  {
    label: "Miembros",
    icon: Users,
    href: "/dashboard/members",
    color: "text-blue-700",
  },
  {
    label: "Configuración",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { workspace, workspaces, setCurrentWorkspace } = useWorkspace()

  const handleWorkspaceChange = (value: string) => {
    if (value === "new") {
      router.push("/dashboard/workspaces/new")
      return
    }

    const selected = workspaces.find(w => w.id.toString() === value)
    if (selected) setCurrentWorkspace(selected)
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="px-3 py-2">
        <div className="space-y-3">
          <div className="mb-8">
            <h2 className="mb-2 px-4 text-lg font-semibold">
              Expenses Manager
            </h2>
            <Select
              value={workspace?.id.toString()}
              onValueChange={handleWorkspaceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id.toString()}>
                    {ws.name}
                  </SelectItem>
                ))}
                <Separator className="my-3" />
                <SelectItem value="new" className="text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Crear nuevo workspace
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition",
                  pathname === route.href ? "bg-gray-200 dark:bg-gray-800" : ""
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 