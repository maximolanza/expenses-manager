"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownIcon, ArrowUpIcon, CreditCard, Receipt, Wallet } from "lucide-react"

interface TicketStatsProps {
  selectedDate: string
  formatDateDisplay: (date: string) => string
  loading: boolean
  tickets: any[]
}

export function TicketStats({ 
  selectedDate, 
  formatDateDisplay, 
  loading, 
  tickets 
}: TicketStatsProps) {
  // Función auxiliar para obtener el método de pago real (considerando metadata)
  const getRealPaymentMethod = (ticket: any) => {
    return ticket.metadata?.original_payment_method || ticket.payment_method;
  }

  // Calcular estadísticas
  const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.total_amount, 0)
  const creditAmount = tickets
    .filter(ticket => getRealPaymentMethod(ticket) === "Credito")
    .reduce((sum, ticket) => sum + ticket.total_amount, 0)
  const debitAmount = tickets
    .filter(ticket => {
      const method = getRealPaymentMethod(ticket);
      return method === "Debito" || method === "Efectivo" || method === "Transferencia";
    })
    .reduce((sum, ticket) => sum + ticket.total_amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Gastado
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full max-w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} para {formatDateDisplay(selectedDate)}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pagos en Efectivo/Débito
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full max-w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatCurrency(debitAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {tickets.filter(t => {
                  const method = getRealPaymentMethod(t);
                  return method === "Debito" || method === "Efectivo" || method === "Transferencia";
                }).length} ticket{tickets.filter(t => getRealPaymentMethod(t) === "Debito").length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pagos con Crédito
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full max-w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatCurrency(creditAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {tickets.filter(t => getRealPaymentMethod(t) === "Credito").length} ticket{tickets.filter(t => getRealPaymentMethod(t) === "Credito").length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ticket Promedio
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full max-w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {tickets.length > 0 
                  ? formatCurrency(totalAmount / tickets.length) 
                  : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por ticket en {format(new Date(`${selectedDate}T12:00:00`), "d/M/yyyy", { locale: es })}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 