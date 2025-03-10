import { Link } from "react-router-dom"
import { Receipt, Home, Receipt as ReceiptIcon, Store, Tags, Users, Settings } from "lucide-react"
import { usePathname } from "../hooks/usePathname"
import { cn } from "../lib/utils"

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 h-full w-64 bg-background border-r">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <ReceiptIcon className="h-6 w-6" />
            <span>Expenses Manager</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 p-2">
          <NavLink to="/dashboard" icon={Home}>
            Dashboard
          </NavLink>
          <NavLink to="/dashboard/tickets" icon={Receipt}>
            Tickets
          </NavLink>
          <NavLink to="/dashboard/stores" icon={Store}>
            Tiendas
          </NavLink>
          <NavLink to="/dashboard/categories" icon={Tags}>
            Categorías
          </NavLink>
          <NavLink to="/dashboard/members" icon={Users}>
            Miembros
          </NavLink>
          <NavLink to="/dashboard/settings" icon={Settings}>
            Configuración
          </NavLink>
        </nav>
      </div>
    </aside>
  )
}

interface NavLinkProps {
  to: string
  icon: LucideIcon
  children: React.ReactNode
}

function NavLink({ to, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === to

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-accent text-accent-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  )
} 