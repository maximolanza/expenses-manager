"use client"

import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { User, UserCircle, CreditCard, CheckCircle } from "lucide-react"
import Link from "next/link"

type Profile = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  full_name: string | null
  updated_at: string
}

export default function ProfilePage() {
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!user?.id) return

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading profile:', error.message)
          toast.error('Error al cargar el perfil')
          return
        }

        setProfile(data)
        setDisplayName(data.display_name || '')
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
      } catch (err) {
        console.error('Unexpected error loading profile:', err)
        toast.error('Error inesperado al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error.message)
        toast.error('Error al actualizar el perfil')
        return
      }

      toast.success('Perfil actualizado con éxito', {
        description: 'Los cambios han sido guardados correctamente',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        duration: 4000,
      })
      
      setProfile({
        ...profile!,
        display_name: displayName,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Unexpected error updating profile:', err)
      toast.error('Error inesperado al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback>
            {profile?.display_name ? getInitials(profile.display_name) : <UserCircle />}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal y cómo te verán otros usuarios en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre para mostrar</Label>
              <Input
                id="displayName"
                placeholder="¿Cómo quieres que te vean otros usuarios?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                placeholder="Tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL del avatar</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://ejemplo.com/tu-avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Ingresa la URL de una imagen para usar como tu avatar.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Opciones de Pago</CardTitle>
          <CardDescription>
            Administra tus tarjetas de crédito, débito y prepagas para agilizar la carga de tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Mis Tarjetas</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona tus métodos de pago para usar en tickets
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/profile/paymentCards">
              Administrar tarjetas
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 