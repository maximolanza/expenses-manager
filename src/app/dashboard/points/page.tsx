"use client"

import { useState, useEffect } from "react"
import { usePoints } from "@/hooks/use-points"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  CoinsIcon,
  Settings,
  History,
  Gift,
  BarChart3
} from "lucide-react"
import Link from "next/link"

export default function PointsPage() {
  const { getUserPointsBalance, getPointsSystems, loading } = usePoints()
  const [balances, setBalances] = useState<any[]>([])
  const [systems, setSystems] = useState<any[]>([])
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [pointsResult, systemsResult] = await Promise.all([
      getUserPointsBalance(),
      getPointsSystems()
    ])
    
    setBalances(pointsResult.balances)
    setSystems(systemsResult.systems)
    setTotalPoints(pointsResult.total)
  }

  if (loading && balances.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Programa de Puntos</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programa de Puntos</h1>
          <p className="text-muted-foreground">
            Administra puntos, canjea recompensas y revisa el historial
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Puntos acumulados en todos los sistemas
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/points/balance">
                Ver detalles
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sistemas Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systems.filter(s => s.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              De un total de {systems.length} sistemas configurados
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/points/systems">
                Administrar sistemas
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Últimas Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Revisa el historial de tus transacciones
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/points/transactions">
                Ver historial
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canjear Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Usa tus puntos para obtener descuentos
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/points/redeem">
                Canjear ahora
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Administración</CardTitle>
            <CardDescription>
              Configura y administra los diferentes aspectos del programa de puntos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/dashboard/points/systems">
                <Settings className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Sistemas de Puntos</div>
                  <div className="text-xs text-muted-foreground">Configura reglas y tasas</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/dashboard/points/transactions">
                <History className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Transacciones</div>
                  <div className="text-xs text-muted-foreground">Historial de movimientos</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/dashboard/points/redeem">
                <Gift className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Canje de Puntos</div>
                  <div className="text-xs text-muted-foreground">Configura opciones de canje</div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 justify-start" asChild>
              <Link href="/dashboard/points/stats">
                <BarChart3 className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Estadísticas</div>
                  <div className="text-xs text-muted-foreground">Analiza el uso de puntos</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Puntos Disponibles</CardTitle>
            <CardDescription>
              Saldo actual de puntos por sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CoinsIcon className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No tienes puntos aún</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Realiza compras para empezar a acumular puntos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {balances.map((balance) => (
                  <div key={balance.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{balance.points_system.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {balance.points_system.point_name_plural}
                      </div>
                    </div>
                    <div className="text-xl font-bold">{balance.balance}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/points/balance">
                Ver saldo detallado
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 