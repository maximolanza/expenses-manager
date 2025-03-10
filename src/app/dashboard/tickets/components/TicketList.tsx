"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { isoStringToDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash, ShoppingBag } from "lucide-react"
import type { Database, PaymentMethod } from "@/types/supabase"

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  store?: Database["public"]["Tables"]["stores"]["Row"]
  items: (Database["public"]["Tables"]["ticket_items"]["Row"] & {
    product?: Database["public"]["Tables"]["products"]["Row"]
  })[]
}

interface TicketListProps {
  tickets: Ticket[]
  onEdit?: (ticket: Ticket) => void
  onDelete?: (ticket: Ticket) => void
}

export function TicketList({ tickets, onEdit, onDelete }: TicketListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount)
  }

  const getPaymentMethodLabel = (method: PaymentMethod, metadata?: any) => {
    // Si existe el método de pago original en los metadatos, usar ese
    if (metadata?.original_payment_method) {
      const originalMethod = metadata.original_payment_method;
      
      // Mostrar el método original
      const labels = {
        Efectivo: 'Efectivo',
        Debito: 'Débito',
        Credito: 'Crédito',
        Transferencia: 'Transferencia',
        Prepaga: 'Prepaga'
      }
      
      return labels[originalMethod as keyof typeof labels] || originalMethod;
    }
    
    // Si no hay método original, mostrar el método actual
    const labels = {
      Efectivo: 'Efectivo',
      Debito: 'Débito',
      Credito: 'Crédito',
      Transferencia: 'Transferencia',
      Prepaga: 'Prepaga'
    }

    // Intentar obtener directamente, si no existe usar el método original
    return labels[method as keyof typeof labels] || method;
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <Accordion type="single" collapsible>
            <AccordionItem value={ticket.id.toString()} className="border-0">
              <AccordionTrigger className="hover:no-underline hover:bg-muted/30 pl-2 pr-4">
                <div className="grid grid-cols-12 w-full py-3 px-2 gap-2">
                  {/* Tienda y fecha */}
                  <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col items-start">
                    <span className="font-medium truncate">
                      {ticket.store?.name || "Tienda no especificada"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(isoStringToDate(ticket.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  </div>
                  
                  {/* Cantidad de productos */}
                  <div className="col-span-4 md:col-span-2 flex items-center gap-1 text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden sm:inline">{ticket.items.length} {ticket.items.length === 1 ? "producto" : "productos"}</span>
                    <span className="sm:hidden">{ticket.items.length}</span>
                  </div>
                  
                  {/* Método de pago */}
                  <div className="col-span-4 md:col-span-2 flex items-center justify-end md:justify-center">
                    <Badge variant="outline" className="whitespace-nowrap">
                      {getPaymentMethodLabel(ticket.payment_method, ticket.metadata)}
                    </Badge>
                  </div>
                  
                  {/* Total */}
                  <div className="col-span-4 md:col-span-2 flex justify-end items-center">
                    <span className="font-semibold">
                      {formatCurrency(ticket.total_amount)}
                    </span>
                  </div>
                  
                  {/* Botones de acción - siempre visibles en escritorio, ocultos en móvil dentro del acordeón */}
                  <div className="hidden md:col-span-1 md:flex justify-end gap-1">
                    {onEdit && (
                      <div
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(ticket);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </div>
                    )}
                    {onDelete && (
                      <div
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-0 text-destructive cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(ticket);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 py-3 bg-muted/10">
                  {/* Cabecera de la tabla de productos */}
                  <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground mb-2 px-2">
                    <div className="col-span-6">Producto</div>
                    <div className="col-span-3 text-center">Cantidad</div>
                    <div className="col-span-3 text-right">Importe</div>
                  </div>
                  
                  {/* Detalles de los items */}
                  <div className="divide-y">
                    {ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 py-2 px-2"
                      >
                        <div className="col-span-6">
                          <span className="font-medium">
                            {item.product?.name || item.description}
                          </span>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="text-sm text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="font-medium">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Botones de acción móvil - solo se muestran en la versión móvil */}
                    <div className="flex md:hidden justify-end gap-2 pt-3 mt-3">
                      {onEdit && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(ticket);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(ticket);
                          }}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                    
                    {/* Total del ticket */}
                    <div className="grid grid-cols-12 py-3 px-2 font-semibold">
                      <div className="col-span-9 text-right">Total:</div>
                      <div className="col-span-3 text-right">
                        {formatCurrency(ticket.total_amount)}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  )
} 