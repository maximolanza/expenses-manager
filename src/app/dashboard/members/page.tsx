"use client"

import { useWorkspace } from "@/components/providers/workspace-provider"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { MoreHorizontal, UserPlus, Mail, Clock, Check, X, Shield, User, UserCog } from "lucide-react"

type Member = {
  user_id: string;
  role: "owner" | "collaborator";
  created_at: string;
  user: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    full_name?: string;
  };
};

type Invitation = {
  id: number;
  email: string;
  role: "owner" | "collaborator";
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export default function MembersPage() {
  const { members, inviteMember, updateMember, removeMember, workspace, isLoading } = useWorkspace()
  const { supabase, user } = useSupabase()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"owner" | "collaborator">("collaborator")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [memberDetails, setMemberDetails] = useState<Record<string, any>>({})
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(true)
  const [activeTab, setActiveTab] = useState("members")
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  // Cargar detalles de los usuarios
  useEffect(() => {
    async function loadUserDetails() {
      if (!members?.length) return;
      
      try {
        const userIds = members.map(member => member.user_id).filter(Boolean);
        if (userIds.length === 0) return;

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, full_name')
          .in('id', userIds);
        
        if (profilesError) {
          console.error("Error loading user details:", profilesError.message);
          toast.error("Error al cargar los detalles de usuarios");
          
          // Crear datos fallback para evitar bloqueos
          const fallbackDetails = members.reduce((acc, member) => {
            acc[member.user_id] = {
              id: member.user_id,
              email: "usuario@" + member.user_id.substring(0, 6),
              display_name: "Usuario " + member.user_id.substring(0, 6),
              avatar_url: null,
              full_name: null
            };
            return acc;
          }, {} as Record<string, any>);
          
          setMemberDetails(fallbackDetails);
          return;
        }
        
        if (!profiles || profiles.length === 0) {
          console.warn("No user profiles found");
          // Crear un mapa con información básica de los miembros
          const basicDetailsMap = members.reduce((acc, member) => {
            acc[member.user_id] = {
              id: member.user_id,
              email: "usuario@" + member.user_id.substring(0, 6),
              display_name: "Usuario " + member.user_id.substring(0, 6),
              avatar_url: null,
              full_name: null
            };
            return acc;
          }, {} as Record<string, any>);
          
          setMemberDetails(basicDetailsMap);
          return;
        }

        const detailsMap = profiles.reduce((acc, profile) => {
          if (profile?.id) {
            acc[profile.id] = {
              id: profile.id,
              email: profile.email,
              display_name: profile.display_name || profile.full_name || profile.email?.split('@')[0],
              avatar_url: profile.avatar_url,
              full_name: profile.full_name
            };
          }
          return acc;
        }, {} as Record<string, any>);
        
        setMemberDetails(detailsMap);
      } catch (err) {
        console.error("Unexpected error loading user details:", err);
        toast.error("Error inesperado al cargar los detalles de usuarios");
        
        // Proporcionar datos fallback en caso de error
        const fallbackDetails = members.reduce((acc, member) => {
          acc[member.user_id] = {
            id: member.user_id,
            email: "usuario@" + member.user_id.substring(0, 6),
            display_name: "Usuario " + member.user_id.substring(0, 6),
            avatar_url: null,
            full_name: null
          };
          return acc;
        }, {} as Record<string, any>);
        
        setMemberDetails(fallbackDetails);
      }
    }
    
    loadUserDetails();
  }, [members, supabase]);

  // Cargar invitaciones
  useEffect(() => {
    async function loadInvitations() {
      if (!workspace) return;
      
      setLoadingInvitations(true);
      
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error loading invitations:", error);
        toast.error("Error al cargar las invitaciones");
        setLoadingInvitations(false);
        return;
      }
      
      setInvitations(data || []);
      setLoadingInvitations(false);
    }
    
    loadInvitations();
  }, [workspace, supabase]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Por favor ingresa un email")
      return
    }

    const success = await inviteMember(email, role)
    if (success) {
      toast.success("Invitación enviada con éxito")
      setEmail("")
      setRole("collaborator")
      setIsInviteDialogOpen(false)
      
      // Recargar invitaciones
      if (workspace) {
        const { data } = await supabase
          .from('workspace_invitations')
          .select('*')
          .eq('workspace_id', workspace.id)
          .order('created_at', { ascending: false });
        
        setInvitations(data || []);
      }
    }
  }

  const handleUpdateRole = async (userId: string, newRole: "owner" | "collaborator") => {
    const result = await updateMember(userId, newRole);
    if (result) {
      toast.success(`Rol actualizado a ${newRole === "owner" ? "Propietario" : "Colaborador"}`);
    } else {
      toast.error("Error al actualizar el rol");
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    const success = await removeMember(memberToRemove);
    if (success) {
      toast.success("Miembro eliminado con éxito");
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    } else {
      toast.error("Error al eliminar el miembro");
    }
  }

  const handleCancelInvitation = async (invitationId: number) => {
    if (!workspace) return;
    
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('workspace_id', workspace.id);
    
    if (error) {
      console.error("Error canceling invitation:", error);
      toast.error("Error al cancelar la invitación");
      return;
    }
    
    toast.success("Invitación cancelada con éxito");
    setInvitations(invitations.filter(inv => inv.id !== invitationId));
  }

  const getInitials = (userId: string) => {
    const userDetail = memberDetails[userId];
    if (!userDetail) return "?";
    
    if (userDetail.display_name) {
      return userDetail.display_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return userDetail.email.substring(0, 2).toUpperCase();
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (e) {
      return dateString;
    }
  }

  const isCurrentUser = (userId: string) => {
    return user?.id === userId;
  }

  const isLastOwner = (userId: string) => {
    const ownersCount = members.filter(m => m.role === "owner").length;
    return ownersCount === 1 && members.find(m => m.user_id === userId)?.role === "owner";
  }

  const getUserDisplayName = (userId: string) => {
    const userDetail = memberDetails[userId];
    if (!userDetail) return "Usuario Desconocido";
    
    return userDetail.display_name || userDetail.full_name || userDetail.email.split('@')[0];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Miembros</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu espacio de trabajo
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar Miembro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
              <DialogDescription>
                Envía una invitación a un nuevo miembro para unirse a tu espacio de trabajo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={(value: "owner" | "collaborator") => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Propietario</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="collaborator">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Colaborador</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Los propietarios tienen acceso completo a todas las funciones. Los colaboradores tienen acceso limitado.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  Enviar Invitación
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">
            Miembros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitaciones ({invitations.filter(i => i.status === "pending").length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {members.map((member) => (
                <Card key={member.user_id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={memberDetails[member.user_id]?.avatar_url || ""} />
                          <AvatarFallback>{getInitials(member.user_id)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {getUserDisplayName(member.user_id)}
                            {isCurrentUser(member.user_id) && (
                              <Badge variant="outline" className="ml-2 text-xs">Tú</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {memberDetails[member.user_id]?.email}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                          {member.role === "owner" ? (
                            <div className="flex items-center">
                              <Shield className="mr-1 h-3 w-3" />
                              <span>Propietario</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <User className="mr-1 h-3 w-3" />
                              <span>Colaborador</span>
                            </div>
                          )}
                        </Badge>
                        
                        {!isCurrentUser(member.user_id) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {member.role === "collaborator" && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateRole(member.user_id, "owner")}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>Hacer propietario</span>
                                </DropdownMenuItem>
                              )}
                              
                              {member.role === "owner" && !isLastOwner(member.user_id) && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateRole(member.user_id, "collaborator")}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  <span>Hacer colaborador</span>
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setMemberToRemove(member.user_id);
                                  setIsRemoveDialogOpen(true);
                                }}
                                disabled={isLastOwner(member.user_id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                <span>Eliminar miembro</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Miembro desde {formatDate(member.created_at)}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="invitations" className="mt-4">
          {loadingInvitations ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : invitations.filter(i => i.status === "pending").length > 0 ? (
            <div className="grid gap-4">
              {invitations
                .filter(invitation => invitation.status === "pending")
                .map((invitation) => (
                  <Card key={invitation.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {invitation.email.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {invitation.email}
                            </CardTitle>
                            <CardDescription>
                              Invitado como {invitation.role === "owner" ? "Propietario" : "Colaborador"}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-1 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        <span>Invitación enviada el {formatDate(invitation.created_at)}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">No hay invitaciones pendientes</CardTitle>
                <CardDescription className="text-center">
                  Todas las invitaciones han sido procesadas o no has enviado ninguna invitación aún.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invitar Miembro
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al miembro del espacio de trabajo y no podrá acceder a ningún recurso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 