import { Metadata } from "next"
import { ProductsOverview } from "./components"

export const metadata: Metadata = {
  title: "Gestión de Productos | Sistema de Tickets",
  description: "Gestiona tu catálogo de productos, precios e inventario",
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
        <p className="text-muted-foreground">
          Administra tu catálogo de productos, asigna precios por tienda y consulta el historial de precios.
        </p>
      </div>
      
      <ProductsOverview />
    </div>
  )
} 