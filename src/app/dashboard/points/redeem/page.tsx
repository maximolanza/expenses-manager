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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  CoinsIcon, 
  Gift, 
  ShoppingCart, 
  ArrowRight,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import Link from "next/link"

const redeemSchema = z.object({
  pointsSystemId: z.string().min(1, "Selecciona un sistema de puntos"),
  pointsToUse: z.number().min(1, "Debes usar al menos 1 punto"),
})

type RedeemFormValues = z.infer<typeof redeemSchema>

export default function PointsRedeemPage() {
  const { 
    loading, 
    getPointsSystems, 
    getUserPointsBalance,
    calculateAmountForPoints,
    usePointsForDiscount 
  } = usePoints()
  const [systems, setSystems] = useState<any[]>([])
  const [balances, setBalances] = useState<any[]>([])
  const [balancesBySystem, setBalancesBySystem] = useState<Record<number, any>>({})
  const [currentSystem, setCurrentSystem] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      pointsSystemId: "",
      pointsToUse: 0,
    },
  })

  const selectedSystemId = form.watch("pointsSystemId")
  const pointsToUse = form.watch("pointsToUse")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSystemId && systems.length > 0) {
      const system = systems.find(s => s.id.toString() === selectedSystemId)
      setCurrentSystem(system)
      
      // Reset points to use when system changes
      form.setValue("pointsToUse", 0)
    } else {
      setCurrentSystem(null)
    }
  }, [selectedSystemId, systems])

  useEffect(() => {
    if (currentSystem && pointsToUse > 0) {
      const amount = calculateAmountForPoints(pointsToUse, currentSystem)
      setDiscountAmount(amount)
    } else {
      setDiscountAmount(0)
    }
  }, [pointsToUse, currentSystem])

  const loadData = async () => {
    const [systemsResult, balancesResult] = await Promise.all([
      getPointsSystems(),
      getUserPointsBalance(),
    ])
    
    // Filter systems that are enabled and available for purchases
    const availableSystems = systemsResult.systems.filter(
      s => s.enabled && s.available_for_purchases
    )
    
    setSystems(availableSystems)
    setBalances(balancesResult.balances)
    setBalancesBySystem(balancesResult.balancesBySystem)
  }

  const getMaxPoints = () => {
    if (!currentSystem || !selectedSystemId) return 0
    
    const systemId = parseInt(selectedSystemId)
    const balance = balancesBySystem[systemId]
    
    return balance ? balance.balance : 0
  }

  const onSubmit = async (data: RedeemFormValues) => {
    setIsSubmitting(true)
    setSuccessMessage("")
    
    try {
      const systemId = parseInt(data.pointsSystemId)
      
      const result = await usePointsForDiscount({
        pointsSystemId: systemId,
        pointsToUse: data.pointsToUse,
        discountAmount: discountAmount,
        description: "Canje manual de puntos",
      })
      
      if (result.success) {
        toast.success(`¡Canje exitoso! Ahorraste $${discountAmount.toFixed(2)}`)
        setSuccessMessage(`Has canjeado ${data.pointsToUse} puntos por un descuento de $${discountAmount.toFixed(2)}`)
        form.reset()
        
        // Reload balances
        const balancesResult = await getUserPointsBalance()
        setBalances(balancesResult.balances)
        setBalancesBySystem(balancesResult.balancesBySystem)
      } else {
        toast.error("Error al canjear puntos")
      }
    } catch (error) {
      console.error("Error al canjear puntos:", error)
      toast.error("Error al canjear puntos")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading && systems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Canjear Puntos</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Canjear Puntos</h1>
          <p className="text-muted-foreground">
            Utiliza tus puntos acumulados para obtener descuentos
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Selecciona un sistema de puntos</CardTitle>
              <CardDescription>
                Elige qué tipo de puntos quieres canjear
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systems.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No hay sistemas disponibles</AlertTitle>
                  <AlertDescription>
                    No se encontraron sistemas de puntos habilitados para canje.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="pointsSystemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sistema de puntos</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un sistema" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {systems.map((system) => {
                                const systemId = system.id
                                const balance = balancesBySystem[systemId]
                                const pointsBalance = balance ? balance.balance : 0
                                
                                return (
                                  <SelectItem 
                                    key={system.id} 
                                    value={system.id.toString()}
                                    disabled={pointsBalance <= 0}
                                  >
                                    {system.name} ({pointsBalance} {pointsBalance === 1 ? system.point_name_singular : system.point_name_plural})
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Se muestra tu saldo disponible en cada sistema
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentSystem && (
                      <FormField
                        control={form.control}
                        name="pointsToUse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Puntos a canjear</FormLabel>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4">
                                <FormControl>
                                  <Slider
                                    value={[field.value]}
                                    min={0}
                                    max={getMaxPoints()}
                                    step={1}
                                    onValueChange={(values) => field.onChange(values[0])}
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <Input
                                  type="number"
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value)
                                    const max = getMaxPoints()
                                    field.onChange(value > max ? max : value)
                                  }}
                                  className="w-20"
                                  min={0}
                                  max={getMaxPoints()}
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <span>{getMaxPoints()} disponibles</span>
                              </div>
                            </div>
                            <FormDescription>
                              Selecciona cuántos puntos deseas utilizar
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentSystem && pointsToUse > 0 && (
                      <Alert className="bg-primary/10 border-primary/20">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <AlertTitle>Resumen del canje</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Puntos a canjear:</span>
                            <span className="font-semibold">{pointsToUse} {pointsToUse === 1 ? currentSystem.point_name_singular : currentSystem.point_name_plural}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Descuento equivalente:</span>
                            <span className="font-semibold">${discountAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span>Tasa de conversión:</span>
                            <span>
                              {currentSystem.conversion_type === "fixed" 
                                ? `${currentSystem.conversion_rate} ${currentSystem.point_name_plural}/peso`
                                : "Variable según rangos"
                              }
                            </span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {successMessage && (
                      <Alert className="bg-green-100 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>¡Canje exitoso!</AlertTitle>
                        <AlertDescription>
                          {successMessage}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !currentSystem || pointsToUse <= 0}
                      className="w-full"
                    >
                      {isSubmitting ? "Procesando..." : "Canjear puntos"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi balance de puntos</CardTitle>
              <CardDescription>
                Puntos disponibles en todos los sistemas
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
                    <div key={balance.id} className="flex justify-between p-3 bg-muted/20 rounded-md">
                      <div>
                        <div className="font-medium">{balance.points_system.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {balance.points_system.point_name_plural}
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{balance.balance}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/points/transactions">
                  Ver historial de transacciones
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información sobre canje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">¿Cómo funciona el canje?</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecciona un sistema de puntos y la cantidad que deseas canjear. 
                    El valor del descuento se calculará automáticamente según la tasa de conversión.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">¿Dónde usar mis descuentos?</h3>
                  <p className="text-sm text-muted-foreground">
                    Los descuentos obtenidos se pueden aplicar al crear nuevos tickets 
                    o en tu próxima compra.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Siguientes pasos</h3>
                  <p className="text-sm text-muted-foreground">
                    Después de canjear tus puntos, recibirás un código de descuento que podrás utilizar 
                    inmediatamente o guardar para más tarde.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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