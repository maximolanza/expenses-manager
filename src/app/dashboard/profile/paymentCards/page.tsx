"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreditCard, PlusCircle, Edit, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { PaymentCard, PaymentMethod } from "@/types/supabase"
import { PaymentCardForm } from "@/app/dashboard/profile/paymentCards/components/payment-card-form"
import Link from "next/link"

export default function PaymentCardsPage() {
  const { supabase, user } = useSupabase()
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null)
  const [deletingCard, setDeletingCard] = useState<PaymentCard | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cargar tarjetas cuando se obtiene el espacio de trabajo
  useEffect(() => {
    const loadCards = async () => {
      if (!workspace || !user) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('payment_cards')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error al cargar tarjetas:', error)
          toast.error('Error al cargar las tarjetas de pago')
          return
        }

        setCards(data || [])
      } catch (error) {
        console.error('Error inesperado al cargar tarjetas:', error)
        toast.error('Error inesperado al cargar las tarjetas de pago')
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [workspace, user, supabase])

  const handleAddCard = async (newCard: any) => {
    if (!workspace || !user) return

    try {
      // Verificar si esta es la primera tarjeta
      const { data: existingCards, error: countError } = await supabase
        .from('payment_cards')
        .select('id')
        .eq('user_id', user.id)
        .eq('workspace_id', workspace.id)
        
      if (!countError && existingCards) {
        // Si es la primera tarjeta, hacerla predeterminada automáticamente
        if (existingCards.length === 0) {
          newCard.is_default = true
        } 
        // Si se marca como predeterminada, actualizar todas las demás tarjetas
        else if (newCard.is_default) {
          await supabase
            .from('payment_cards')
            .update({ is_default: false })
            .eq('user_id', user.id)
            .eq('workspace_id', workspace.id)
        }
      }

      const { data, error } = await supabase
        .from('payment_cards')
        .insert({
          ...newCard,
          workspace_id: workspace.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
          metadata: {}
        })
        .select()

      if (error) {
        console.error('Error al añadir tarjeta:', error)
        toast.error('Error al guardar la tarjeta')
        return
      }

      toast.success('Tarjeta añadida correctamente', {
        description: 'La tarjeta ha sido guardada en tu perfil',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        duration: 4000,
      })
      
      // Actualizar la lista de tarjetas
      setCards(prevCards => [...prevCards, data[0]])
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error inesperado al añadir tarjeta:', error)
      toast.error('Error inesperado al guardar la tarjeta')
    }
  }

  const handleUpdateCard = async (updatedCard: any) => {
    if (!editingCard || !workspace || !user) return

    try {
      // Si se marca como predeterminada, actualizar todas las demás tarjetas
      if (updatedCard.is_default && !editingCard.is_default) {
        await supabase
          .from('payment_cards')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('workspace_id', workspace.id)
          .neq('id', editingCard.id)
      }
      
      // Si se desmarca como predeterminada y había sido predeterminada, asegurar que quede al menos una tarjeta predeterminada
      if (!updatedCard.is_default && editingCard.is_default) {
        // Verificar si hay más tarjetas
        const { data: otherCards, error: countError } = await supabase
          .from('payment_cards')
          .select('id')
          .eq('user_id', user.id)
          .eq('workspace_id', workspace.id)
          .neq('id', editingCard.id)
          
        if (!countError && otherCards && otherCards.length > 0) {
          // Si hay otras tarjetas, hacer que la primera sea la predeterminada
          await supabase
            .from('payment_cards')
            .update({ is_default: true })
            .eq('id', otherCards[0].id)
        } else {
          // Si no hay otras tarjetas, mantener esta como predeterminada
          updatedCard.is_default = true
          toast.info('Esta es tu única tarjeta, seguirá siendo la predeterminada')
        }
      }

      const { data, error } = await supabase
        .from('payment_cards')
        .update(updatedCard)
        .eq('id', editingCard.id)
        .select()

      if (error) {
        console.error('Error al actualizar tarjeta:', error)
        toast.error('Error al actualizar la tarjeta')
        return
      }

      toast.success('Tarjeta actualizada correctamente', {
        description: 'Los cambios han sido guardados correctamente',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        duration: 4000,
      })
      
      // Actualizar la lista de tarjetas
      setCards(prevCards => prevCards.map(card => 
        card.id === editingCard.id ? data[0] : card
      ))
      setEditingCard(null)
    } catch (error) {
      console.error('Error inesperado al actualizar tarjeta:', error)
      toast.error('Error inesperado al actualizar la tarjeta')
    }
  }

  const handleDeleteCard = async () => {
    if (!deletingCard || !workspace || !user) return

    setIsDeleting(true)
    try {
      // Si se está eliminando la tarjeta predeterminada, hay que marcar otra como predeterminada
      if (deletingCard.is_default) {
        // Buscar otra tarjeta que no sea la que estamos eliminando
        const { data: otherCards, error: otherCardsError } = await supabase
          .from('payment_cards')
          .select('id')
          .eq('user_id', user.id)
          .eq('workspace_id', workspace.id)
          .neq('id', deletingCard.id)

        if (!otherCardsError && otherCards && otherCards.length > 0) {
          // Marcar la primera tarjeta encontrada como predeterminada
          await supabase
            .from('payment_cards')
            .update({ is_default: true })
            .eq('id', otherCards[0].id)
        }
      }

      const { error } = await supabase
        .from('payment_cards')
        .delete()
        .eq('id', deletingCard.id)

      if (error) {
        console.error('Error al eliminar tarjeta:', error)
        toast.error('Error al eliminar la tarjeta')
        return
      }

      toast.success('Tarjeta eliminada correctamente', {
        description: 'La tarjeta ha sido eliminada de tu perfil',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        duration: 4000,
      })
      
      // Actualizar la lista de tarjetas
      setCards(prevCards => prevCards.filter(card => card.id !== deletingCard.id))
      setDeletingCard(null)
    } catch (error) {
      console.error('Error inesperado al eliminar tarjeta:', error)
      toast.error('Error inesperado al eliminar la tarjeta')
    } finally {
      setIsDeleting(false)
    }
  }

  const getCardTypeLabel = (type: PaymentMethod) => {
    switch (type) {
      case 'Debito': return 'Débito'
      case 'Credito': return 'Crédito'
      case 'Prepaga': return 'Prepaga'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mis Tarjetas</h1>
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
          <h1 className="text-2xl font-bold">Mis Tarjetas</h1>
          <p className="text-muted-foreground">
            Administra tus tarjetas de pago para usarlas al registrar tickets
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir tarjeta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir nueva tarjeta</DialogTitle>
              <DialogDescription>
                Añade los detalles de tu tarjeta para facilitar el registro de tus compras.
              </DialogDescription>
            </DialogHeader>
            <PaymentCardForm onSubmit={handleAddCard} onCancel={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No tienes tarjetas registradas</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Añade tarjetas para agilizar el registro de tus compras y llevar un mejor control de tus gastos.
            </p>
            <Button 
              className="mt-6" 
              onClick={() => setIsFormOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir mi primera tarjeta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className={`overflow-hidden ${card.is_default ? 'border-primary' : ''}`}>
              <CardHeader className="relative pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {card.card_name}
                      {card.is_default && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Predeterminada
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {card.bank} - {getCardTypeLabel(card.card_type)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingCard(card)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar tarjeta</DialogTitle>
                          <DialogDescription>
                            Modifica los detalles de tu tarjeta.
                          </DialogDescription>
                        </DialogHeader>
                        {editingCard && (
                          <PaymentCardForm 
                            initialValues={editingCard} 
                            onSubmit={handleUpdateCard} 
                            onCancel={() => setEditingCard(null)} 
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingCard(card)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La tarjeta se eliminará permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteCard}
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
                <div className="mt-2 space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Número</div>
                    <div className="font-mono">•••• •••• •••• {card.last_four_digits}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Titular</div>
                    <div>{card.owner_name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Separator className="my-4" />
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/profile">
              Volver a mi perfil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 