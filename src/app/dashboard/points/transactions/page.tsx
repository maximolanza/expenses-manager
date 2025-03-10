"use client"

import { useState, useEffect } from "react"
import { usePoints } from "@/hooks/use-points"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  CoinsIcon, 
  ArrowUpRight, 
  ArrowDownLeft,
  Ticket 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function PointsTransactionsPage() {
  const { loading, getPointsTransactions, getPointsSystems } = usePoints()
  const [transactions, setTransactions] = useState<any[]>([])
  const [systems, setSystems] = useState<any[]>([])
  const [selectedSystem, setSelectedSystem] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [selectedSystem])

  const loadData = async () => {
    const systemsResult = await getPointsSystems()
    setSystems(systemsResult.systems)
    await loadTransactions()
  }

  const loadTransactions = async () => {
    const systemId = selectedSystem !== "all" ? parseInt(selectedSystem) : undefined
    const result = await getPointsTransactions(systemId)
    setTransactions(result.transactions)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy HH:mm", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Historial de Transacciones</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial de Transacciones</h1>
          <p className="text-muted-foreground">
            Consulta todas las operaciones de puntos realizadas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Filtrar por sistema:</div>
          <Select 
            value={selectedSystem} 
            onValueChange={setSelectedSystem}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los sistemas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los sistemas</SelectItem>
              {systems.map((system) => (
                <SelectItem key={system.id} value={system.id.toString()}>
                  {system.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
          <CardDescription>
            Historial de acumulación y uso de puntos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CoinsIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No hay transacciones</h3>
              <p className="mt-2 text-center text-muted-foreground">
                No se encontraron movimientos de puntos {selectedSystem !== "all" ? "para el sistema seleccionado" : ""}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell>
                      {transaction.points_system?.name || "Sistema desconocido"}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {transaction.ticket ? (
                        <Link 
                          href={`/dashboard/tickets/${transaction.ticket.id}`}
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Ticket className="h-4 w-4 mr-1" />
                          #{transaction.ticket.id}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? (
                        <span className="flex items-center justify-end">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          +{transaction.amount}
                        </span>
                      ) : (
                        <span className="flex items-center justify-end">
                          <ArrowDownLeft className="h-4 w-4 mr-1" />
                          {transaction.amount}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Separator className="my-4" />
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/points">
              Volver a panel de puntos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 