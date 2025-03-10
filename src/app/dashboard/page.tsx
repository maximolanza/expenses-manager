"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReports, type ReportSummary } from "@/hooks/use-reports"
import { formatCurrency, cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { useCategories } from "@/hooks/use-categories"
import { useExpenses } from "@/hooks/use-expenses"
import { Plus, Calendar as CalendarIcon } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { es } from "date-fns/locale"

// Definir la interfaz para la categoría de gastos
interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

// Definir la interfaz para los datos del reporte
interface ReportData {
  totalAmount: {
    UYU: number;
    USD: number;
  };
  previousPeriodComparison?: {
    UYU: number;
    USD: number;
  };
  dailyAverage: {
    UYU: number;
    USD: number;
  };
  largestExpense: {
    amount: number;
    currency: "UYU" | "USD";
    category: string;
  };
  expensesByCategory: {
    UYU: ExpenseCategory[];
    USD: ExpenseCategory[];
  };
}

// Definir tipos para los filtros de fechas
type DateFilterType = "today" | "month" | "week" | "custom";
type DateRange = { from: Date; to: Date };

export default function DashboardPage() {
  const { user } = useSupabase()
  const { getReportSummary } = useReports()
  const [categories, setCategories] = useState<any[]>([])
  const { addExpense } = useExpenses()
  const { getCategories } = useCategories()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  
  // Estados para manejo de filtros de fechas
  const [filterType, setFilterType] = useState<DateFilterType>("today")
  const [currentMonth, setCurrentMonth] = useState<number>(0) // 0 = mes actual, 1 = mes anterior, etc.
  const [currentWeek, setCurrentWeek] = useState<number>(0) // 0 = semana actual, 1 = semana anterior, etc.
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Función para obtener el rango de fechas según el filtro seleccionado
  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date()
    
    switch (filterType) {
      case "today":
        return {
          startDate: now,
          endDate: now
        }
      case "month":
        return {
          startDate: startOfMonth(subMonths(now, currentMonth)),
          endDate: endOfMonth(subMonths(now, currentMonth))
        }
      case "week":
        return {
          startDate: startOfWeek(subWeeks(now, currentWeek), { weekStartsOn: 1 }),
          endDate: endOfWeek(subWeeks(now, currentWeek), { weekStartsOn: 1 })
        }
      case "custom":
        return {
          startDate: dateRange.from || new Date(),
          endDate: dateRange.to || new Date()
        }
      default:
        return {
          startDate: startOfMonth(now),
          endDate: now
        }
    }
  }

  // Función para obtener el título descriptivo del período seleccionado
  const getPeriodTitle = (): string => {
    const { startDate, endDate } = getDateRange()
    
    switch (filterType) {
      case "today":
        return "Hoy"
      case "month":
        return format(startDate, "MMMM yyyy", { locale: es })
      case "week":
        return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`
      case "custom":
        return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`
      default:
        return "Período actual"
    }
  }

  // Actualizar datos cuando cambie el filtro
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filterType, currentMonth, currentWeek, dateRange, getReportSummary, getCategories])

  const loadData = async () => {
    // Obtener rango de fechas según filtro seleccionado
    const { startDate, endDate } = getDateRange()
    
    // Obtener el resumen del reporte con el rango de fechas correspondiente
    const summary = await getReportSummary(
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0]
    )
    
    if (summary) {
      // Obtener resumen del periodo anterior para comparación
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const previousEndDate = new Date(startDate)
      previousEndDate.setDate(previousEndDate.getDate() - 1)
      const previousStartDate = new Date(previousEndDate)
      previousStartDate.setDate(previousStartDate.getDate() - daysInPeriod)
      
      const previousSummary = await getReportSummary(
        previousStartDate.toISOString().split('T')[0],
        previousEndDate.toISOString().split('T')[0]
      )
      
      // Calcular gastos por categoría y moneda
      const expensesByCategory = {
        UYU: [] as ExpenseCategory[],
        USD: [] as ExpenseCategory[]
      }
      
      // Para cada moneda (UYU/USD), procesar categorías
      const processCategoriesByCurrency = (currency: "UYU" | "USD") => {
        // Para este ejemplo, usaremos los datos de categoría de tickets
        // Asumimos que las categorías de tiendas son equivalentes a categorías de gastos
        const categoriesData = summary.byCategory.map(cat => ({
          category: cat.categoryName,
          amount: cat.total,
          percentage: summary.totalAmount > 0 ? (cat.total / summary.totalAmount) * 100 : 0,
          color: getColorForCategory(cat.categoryName),
          ticketCount: cat.ticketCount
        }))
        
        // Ordenar por monto
        return categoriesData.sort((a, b) => b.amount - a.amount)
      }
      
      // Función auxiliar para asignar colores a categorías
      const getColorForCategory = (name: string): string => {
        // Colores predeterminados para categorías comunes
        const colorMap: Record<string, string> = {
          "Supermercado": "#4CAF50",
          "Restaurantes": "#FF5722",
          "Combustible": "#2196F3",
          "Farmacia": "#E91E63",
          "Entretenimiento": "#9C27B0",
          "Viajes": "#FF9800",
          "Hogar": "#795548"
        }
        
        return colorMap[name] || `#${Math.floor(Math.random()*16777215).toString(16)}` // Color aleatorio si no está en el mapa
      }
      
      // Procesar categorías para ambas monedas
      // Por simplicidad, asignamos todos a UYU por ahora
      expensesByCategory.UYU = processCategoriesByCurrency("UYU")
      expensesByCategory.USD = [] // Adaptar si se tiene información de USD
      
      // Encontrar el gasto más grande
      let largestExpense = {
        amount: 0,
        currency: "UYU" as "UYU" | "USD",
        category: ""
      }
      
      // Si hay tickets recientes, encontrar el más grande
      if (summary.recentTickets && summary.recentTickets.length > 0) {
        // Ordenar por monto total
        const sortedTickets = [...summary.recentTickets].sort((a, b) => 
          b.total_amount - a.total_amount
        )
        
        if (sortedTickets.length > 0) {
          largestExpense = {
            amount: sortedTickets[0].total_amount,
            currency: "UYU", // Asumir UYU por defecto, adaptar si hay información de moneda
            category: sortedTickets[0].store?.category?.name || "Sin categoría"
          }
        }
      }
      
      // Calcular promedios diarios
      const dayCount = Math.max(1, daysInPeriod)
      const dailyAverageUYU = summary.totalAmount / dayCount
      
      // Calcular comparación con período anterior
      const comparisonUYU = previousSummary?.totalAmount && previousSummary.totalAmount > 0
        ? ((summary.totalAmount - previousSummary.totalAmount) / previousSummary.totalAmount) * 100
        : 0
      
      // Actualizar los datos del reporte
      const data: ReportData = {
        totalAmount: { 
          UYU: summary.totalAmount, 
          USD: 0 // Adaptar si se tiene información de USD
        },
        previousPeriodComparison: { 
          UYU: comparisonUYU, 
          USD: 0 // Adaptar si se tiene información de USD
        },
        dailyAverage: { 
          UYU: dailyAverageUYU, 
          USD: 0 // Adaptar si se tiene información de USD
        },
        largestExpense,
        expensesByCategory
      }
      
      setReportData(data)
    } else {
      // Si no hay datos, establecer valores por defecto
      setReportData({
        totalAmount: { UYU: 0, USD: 0 },
        previousPeriodComparison: { UYU: 0, USD: 0 },
        dailyAverage: { UYU: 0, USD: 0 },
        largestExpense: { amount: 0, currency: "UYU", category: "" },
        expensesByCategory: { UYU: [], USD: [] }
      })
    }
    
    // Cargar categorías
    const categoriesData = await getCategories()
    setCategories(categoriesData || [])
  }

  const comparisonUYU = reportData?.previousPeriodComparison?.UYU ?? 0
  const comparisonUSD = reportData?.previousPeriodComparison?.USD ?? 0

  const handleAddExpense = async (data: any) => {
    if (!user) return

    const expense = await addExpense({
      ...data,
      user_id: user.id,
      metadata: {}
    })

    if (expense) {
      // Recargar los datos del reporte
      await loadData()
      setShowExpenseForm(false)
    }
  }

  const handlePreviousPeriod = () => {
    if (filterType === "month") {
      setCurrentMonth(prev => prev + 1)
    } else if (filterType === "week") {
      setCurrentWeek(prev => prev + 1)
    }
  }

  const handleNextPeriod = () => {
    if (filterType === "month" && currentMonth > 0) {
      setCurrentMonth(prev => prev - 1)
    } else if (filterType === "week" && currentWeek > 0) {
      setCurrentWeek(prev => prev - 1)
    }
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido, {user?.email?.split("@")[0]}
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tus finanzas
          </p>
        </div>
      </div>

      {/* Controles de filtro de fecha */}
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(value: DateFilterType) => setFilterType(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          {filterType === "custom" ? (
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-2 gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col space-y-2 p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Selecciona un rango</span>
                    {(dateRange.from || dateRange.to) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setDateRange({ from: startOfMonth(new Date()), to: new Date() });
                        }}
                      >
                        Reiniciar
                      </Button>
                    )}
                  </div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={(range) => {
                      // Cuando ya hay un rango seleccionado y el usuario hace clic en una fecha
                      // reiniciar la selección para permitir un nuevo rango desde cero
                      if (dateRange.from && dateRange.to && range?.from && !range?.to) {
                        setDateRange({
                          from: range.from,
                          to: range.from // Establecer "to" igual a "from" para reiniciar el rango
                        });
                      } else if (range?.from) {
                        setDateRange({
                          from: range.from,
                          to: range.to || dateRange.to
                        });
                        
                        // Solo cerrar cuando ambas fechas están seleccionadas
                        if (range.to) {
                          setShowDatePicker(false);
                        }
                      }
                    }}
                    initialFocus
                    locale={es}
                    numberOfMonths={2}
                  />
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPeriod}
                disabled={filterType === "today" || (filterType !== "month" && filterType !== "week")}
              >
                &lt;
              </Button>
              <span className="font-medium">
                {getPeriodTitle()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPeriod}
                disabled={filterType === "today" || 
                          (filterType === "month" && currentMonth === 0) || 
                          (filterType === "week" && currentWeek === 0) || 
                          (filterType !== "month" && filterType !== "week")}
              >
                &gt;
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
            <DialogDescription>
              Ingresa los detalles del gasto que deseas registrar
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            categories={categories}
            onSubmit={handleAddExpense}
            onClose={() => setShowExpenseForm(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total UYU
            </CardTitle>
            <span role="img" aria-label="money" className="text-xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData ? formatCurrency(reportData.totalAmount.UYU, "UYU") : "$0"}
            </div>
            <p className={cn(
              "text-xs text-muted-foreground",
              comparisonUYU > 0 ? "text-red-500" : "text-green-500"
            )}>
              {comparisonUYU > 0 ? "+" : ""}
              {comparisonUYU.toFixed(1)}% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total USD
            </CardTitle>
            <span role="img" aria-label="money" className="text-xl">💵</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData ? formatCurrency(reportData.totalAmount.USD, "USD") : "$0"}
            </div>
            <p className={cn(
              "text-xs text-muted-foreground",
              comparisonUSD > 0 ? "text-red-500" : "text-green-500"
            )}>
              {comparisonUSD > 0 ? "+" : ""}
              {comparisonUSD.toFixed(1)}% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio Diario
            </CardTitle>
            <span role="img" aria-label="chart" className="text-xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {reportData ? formatCurrency(reportData.dailyAverage.UYU, "UYU") : "$0"}
            </div>
            <div className="text-lg font-bold">
              {reportData ? formatCurrency(reportData.dailyAverage.USD, "USD") : "$0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mayor Gasto
            </CardTitle>
            <span role="img" aria-label="target" className="text-xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData ? formatCurrency(reportData.largestExpense.amount, reportData.largestExpense.currency) : "$0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData?.largestExpense.category || "Sin gastos"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Gastos por Categoría</h2>
        <Tabs defaultValue="UYU" className="space-y-4">
          <TabsList>
            <TabsTrigger value="UYU">Pesos Uruguayos</TabsTrigger>
            <TabsTrigger value="USD">Dólares</TabsTrigger>
          </TabsList>
          
          <TabsContent value="UYU" className="space-y-4">
            {reportData?.expensesByCategory.UYU.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay gastos registrados
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reportData?.expensesByCategory.UYU.map((category) => (
                  <Card key={category.category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(category.amount, "UYU")}
                      </div>
                      <div className="mt-4 h-1 w-full rounded-full bg-muted">
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}% del total
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="USD" className="space-y-4">
            {reportData?.expensesByCategory.USD.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay gastos registrados
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reportData?.expensesByCategory.USD.map((category) => (
                  <Card key={category.category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(category.amount, "USD")}
                      </div>
                      <div className="mt-4 h-1 w-full rounded-full bg-muted">
                        <div
                          className="h-1 rounded-full"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}% del total
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
