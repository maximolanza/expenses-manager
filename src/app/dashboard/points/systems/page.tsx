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
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CoinsIcon,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  InfoIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PointsSystemForm } from "./components/points-system-form"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function PointsSystemsPage() {
  const { 
    loading, 
    getPointsSystems, 
    updatePointsSystem,
    deletePointsSystem
  } = usePoints()
  const [systems, setSystems] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<any | null>(null)
  const [deletingSystem, setDeletingSystem] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadSystems()
  }, [])

  const loadSystems = async () => {
    const result = await getPointsSystems()
    setSystems(result.systems)
  }

  const handleToggleEnabled = async (id: number, currentValue: boolean) => {
    try {
      const result = await updatePointsSystem(id, { enabled: !currentValue })
      if (result.success) {
        setSystems(systems.map(system => 
          system.id === id ? { ...system, enabled: !currentValue } : system
        ))
        toast.success(`Sistema ${!currentValue ? 'activado' : 'desactivado'} correctamente`)
      } else {
        toast.error("Error al actualizar el sistema")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al actualizar el sistema")
    }
  }

  const handleToggleAvailableForPurchases = async (id: number, currentValue: boolean) => {
    try {
      const result = await updatePointsSystem(id, { 
        available_for_purchases: !currentValue 
      })
      
      if (result.success) {
        setSystems(systems.map(system => 
          system.id === id ? { ...system, available_for_purchases: !currentValue } : system
        ))
        toast.success(`Sistema ${!currentValue ? 'habilitado' : 'deshabilitado'} para compras`)
      } else {
        toast.error("Error al actualizar el sistema")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al actualizar el sistema")
    }
  }

  const handleDeleteSystem = async () => {
    if (!deletingSystem) return

    setIsDeleting(true)
    try {
      const result = await deletePointsSystem(deletingSystem.id)
      if (result.success) {
        setSystems(systems.filter(system => system.id !== deletingSystem.id))
        toast.success("Sistema eliminado correctamente")
        setDeletingSystem(null)
      } else {
        toast.error("Error al eliminar el sistema")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al eliminar el sistema")
    } finally {
      setIsDeleting(false)
    }
  }

  const renderConversionDetails = (system: any) => {
    if (system.conversion_type === "fixed") {
      return (
        <div>
          <Badge variant="secondary" className="mb-2">Tasa fija</Badge>
          <div className="text-sm">
            1 peso = {system.conversion_rate} {system.point_name_plural}
          </div>
          <div className="text-sm text-muted-foreground">
            100 pesos = {100 * system.conversion_rate} {system.point_name_plural}
          </div>
        </div>
      )
    } else {
      // Variable
      const metadata = system.metadata || {}
      const tiers = metadata.tiers || []
      
      return (
        <div>
          <Badge variant="secondary" className="mb-2">Tasa variable</Badge>
          {tiers.length > 0 ? (
            <div className="space-y-1">
              {tiers.map((tier: any, index: number) => (
                <div key={index} className="text-xs">
                  {tier.minAmount}+ pesos: {tier.rate} {system.point_name_plural}/peso
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No hay rangos configurados
            </div>
          )}
        </div>
      )
    }
  }

  if (loading && systems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sistemas de Puntos</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map(i => (
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
          <h1 className="text-2xl font-bold">Sistemas de Puntos</h1>
          <p className="text-muted-foreground">
            Configura los sistemas de puntos para tus clientes
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nuevo sistema de puntos</DialogTitle>
              <DialogDescription>
                Define las reglas y tasas de conversión para un nuevo sistema de puntos.
              </DialogDescription>
            </DialogHeader>
            <PointsSystemForm 
              onSubmit={async (data: any) => {
                // Esta función se implementará en el componente PointsSystemForm
                setIsFormOpen(false)
                await loadSystems()
              }} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {systems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CoinsIcon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No hay sistemas de puntos</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Crea sistemas de puntos para recompensar a tus clientes y fomentar la fidelidad.
            </p>
            <Button 
              className="mt-6" 
              onClick={() => setIsFormOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear mi primer sistema
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => (
            <Card key={system.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {system.name}
                      {system.enabled ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 ml-2">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 ml-2">Inactivo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {system.point_name_singular} / {system.point_name_plural}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingSystem(system)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar sistema de puntos</DialogTitle>
                          <DialogDescription>
                            Modifica las configuraciones del sistema de puntos.
                          </DialogDescription>
                        </DialogHeader>
                        <PointsSystemForm 
                          initialValues={system} 
                          onSubmit={async () => {
                            setEditingSystem(null)
                            await loadSystems()
                          }} 
                          onCancel={() => setEditingSystem(null)} 
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingSystem(system)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar sistema?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán todos los saldos y transacciones asociadas a este sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteSystem}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                              </>
                            ) : (
                              'Eliminar'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-4">
                  {renderConversionDetails(system)}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Activo</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Habilita o deshabilita el sistema completo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch 
                      checked={system.enabled}
                      onCheckedChange={() => handleToggleEnabled(system.id, system.enabled)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Disponible para compras</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Permite usar este sistema en el proceso de compra</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch 
                      checked={system.available_for_purchases}
                      onCheckedChange={() => handleToggleAvailableForPurchases(system.id, system.available_for_purchases)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/points/systems/${system.id}/transactions`}>
                    Ver transacciones
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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