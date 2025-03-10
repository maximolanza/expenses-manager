"use client"

import { useEffect, useState } from "react"
import { addDays, format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  CreditCard,
  DollarSign,
  Store as StoreIcon,
  Tag,
  Ticket,
} from "lucide-react"
import { useReports, type ReportSummary } from "@/hooks/use-reports"

export default function ReportsPage() {
  const { getReportSummary, loading } = useReports()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [period, setPeriod] = useState("current")

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    let startDate: Date
    let endDate: Date

    switch (period) {
      case "current":
        startDate = startOfMonth(new Date())
        endDate = endOfMonth(new Date())
        break
      case "previous":
        startDate = startOfMonth(addDays(new Date(), -30))
        endDate = endOfMonth(addDays(new Date(), -30))
        break
      case "last90":
        startDate = addDays(new Date(), -90)
        endDate = new Date()
        break
      default:
        startDate = startOfMonth(new Date())
        endDate = endOfMonth(new Date())
    }

    const data = await getReportSummary(
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd")
    )
    setSummary(data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Analiza tus gastos y obtén información detallada
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecciona un período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Mes Actual</SelectItem>
            <SelectItem value="previous">Mes Anterior</SelectItem>
            <SelectItem value="last90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gastado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.ticketCount} tickets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Promedio por Ticket
              </CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.averageTicketAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.storeCount} tiendas diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Débito vs Crédito
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.byPaymentMethod.Debito.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                ${summary.byPaymentMethod.Credito.toFixed(2)} en crédito
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Categoría
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.byCategory[0]?.categoryName || "Sin datos"}
              </div>
              <p className="text-xs text-muted-foreground">
                ${summary.byCategory[0]?.total.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Tienda</CardTitle>
              <CardDescription>
                Top tiendas por monto total gastado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.byStore.map((store) => (
                  <div
                    key={store.storeId}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {store.storeName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {store.categoryName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${store.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {store.ticketCount} tickets
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>
                Distribución de gastos por categoría de tienda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.byCategory.map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {category.categoryName}
                      </p>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(category.total / summary.totalAmount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${category.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {category.ticketCount} tickets
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && summary.recentTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tickets Recientes</CardTitle>
            <CardDescription>
              Últimos tickets registrados en el período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{ticket.store?.name}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(ticket.date), "PPP", { locale: es })}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {ticket.payment_method === "Credito"
                          ? `Crédito (${ticket.current_installment}/${ticket.installments})`
                          : "Débito"
                        }
                      </div>
                      <div className="flex items-center gap-2">
                        <StoreIcon className="h-4 w-4" />
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                          {ticket.store?.category.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${ticket.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 