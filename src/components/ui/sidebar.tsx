"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Receipt,
  Store,
  Tags,
  Users,
  Settings,
  LucideIcon,
  ChevronDown,
  Check,
  Package
} from "lucide-react"
import { useWorkspace } from "@/components/providers/workspace-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface SidebarProps {
  className?: string
}

interface NavLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

export function Sidebar({ className }: SidebarProps) {
  const { workspace, workspaces, switchWorkspace, loading } = useWorkspace()

  return (
    <aside className={cn("fixed left-0 top-0 z-20 h-full w-64 bg-background border-r", className)}>
      <div className="flex h-full flex-col">
        {/* Header con selector de workspace */}
        <div className="flex h-14 items-center border-b px-4">
          {loading ? (
            <Skeleton className="h-8 w-[180px]" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2 hover:bg-accent"
                >
                  <Receipt className="h-5 w-5" />
                  <span className="flex-1 text-left truncate">
                    {workspace?.name || "Seleccionar Workspace"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[240px]"
                side="right"
                sideOffset={0}
              >
                {loading ? (
                  <DropdownMenuItem disabled>
                    <Skeleton className="h-4 w-[100px]" />
                  </DropdownMenuItem>
                ) : (
                  workspaces.map((ws) => (
                    <DropdownMenuItem
                      key={ws.id}
                      onClick={() => switchWorkspace(ws.id)}
                      className="cursor-pointer"
                    >
                      <span className="truncate">{ws.name}</span>
                      {workspace?.id === ws.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings#workspaces"
                    className="cursor-pointer gap-2"
                  >
                    <span>Gestionar workspaces</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          <NavLink href="/dashboard" icon={Home}>
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/tickets" icon={Receipt}>
            Tickets
          </NavLink>
          <NavLink href="/dashboard/products" icon={Package}>
            Productos
          </NavLink>
          <NavLink href="/dashboard/stores" icon={Store}>
            Tiendas
          </NavLink>
          <NavLink href="/dashboard/categories" icon={Tags}>
            Categorías
          </NavLink>
          <NavLink href="/dashboard/members" icon={Users}>
            Miembros
          </NavLink>
          <NavLink href="/dashboard/settings" icon={Settings}>
            Configuración
          </NavLink>
        </nav>
      </div>
    </aside>
  )
}

function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-accent text-accent-foreground" 
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  )
} 