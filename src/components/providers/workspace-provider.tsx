"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/types/supabase"

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]
type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"]

interface WorkspaceContextType {
  workspace: Workspace | null
  workspaces: Workspace[]
  members: WorkspaceMember[]
  isLoading: boolean
  error: string | null
  setCurrentWorkspace: (workspace: Workspace) => void
  createWorkspace: (name: string) => Promise<Workspace | null>
  updateWorkspace: (id: number, data: Partial<Workspace>) => Promise<Workspace | null>
  deleteWorkspace: (id: number) => Promise<boolean>
  inviteMember: (email: string, role: WorkspaceMember["role"]) => Promise<boolean>
  updateMember: (userId: string, role: WorkspaceMember["role"]) => Promise<WorkspaceMember | null>
  removeMember: (userId: string) => Promise<boolean>
  loading: boolean
  switchWorkspace: (workspaceId: number) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!supabase) {
        console.error("Supabase client not initialized")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Verificar sesión
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          console.log("No active session")
          setWorkspaces([])
          setLoading(false)
          return
        }

        // Consulta simple a workspaces sin created_at
        const { data, error } = await supabase
          .from('workspaces')
          .select(`
            id,
            name
          `)

        if (error) {
          console.error("Workspaces query error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          throw error
        }

        const workspacesData = data || []


        setWorkspaces(workspacesData)

        // Configurar workspace activo
        if (!workspace && workspacesData.length > 0) {
          const lastWorkspaceId = localStorage.getItem("lastWorkspaceId")
          const initialWorkspace = lastWorkspaceId 
            ? workspacesData.find(ws => ws.id === parseInt(lastWorkspaceId))
            : workspacesData[0]
          
          if (initialWorkspace) {
            setWorkspace(initialWorkspace)
          }
        }

      } catch (error) {
        console.error("Error in workspace provider:", error)
        if (error instanceof Error) {
          console.error("Full error details:", {
            message: error.message,
            name: error.name,
            stack: error.stack
          })
        }
        setWorkspaces([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [supabase])

  // Cargar miembros cuando cambia el workspace
  useEffect(() => {
    async function loadMembers() {
      if (!workspace) return

      setIsLoading(true)
      try {
        const { data: members, error: membersError } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", workspace.id)

        if (membersError) throw membersError

        setMembers(members)
      } catch (error) {
        console.error("Error loading members:", error)
        setError("Error cargando los miembros del espacio de trabajo")
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()
  }, [workspace, supabase])

  const setCurrentWorkspace = (workspace: Workspace) => {
    setWorkspace(workspace)
  }

  const createWorkspace = async (name: string): Promise<Workspace | null> => {
    if (!supabase) return null

    try {
      setError(null)
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      
      // Crear el workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({ name, owner_id: user.id })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Agregar al creador como miembro owner
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner"
        })

      if (memberError) throw memberError

      setWorkspaces([...workspaces, workspace])
      setWorkspace(workspace)
      return workspace
    } catch (error) {
      console.error("Error creating workspace:", error)
      setError("Error creando el espacio de trabajo")
      return null
    }
  }

  const updateWorkspace = async (id: number, data: Partial<Workspace>): Promise<Workspace | null> => {
    try {
      setError(null)
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setWorkspaces(workspaces.map(w => w.id === id ? workspace : w))
      if (workspace.id === workspace?.id) {
        setWorkspace(workspace)
      }
      return workspace
    } catch (error) {
      console.error("Error updating workspace:", error)
      setError("Error actualizando el espacio de trabajo")
      return null
    }
  }

  const deleteWorkspace = async (id: number): Promise<boolean> => {
    try {
      setError(null)
      const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", id)

      if (error) throw error

      setWorkspaces(workspaces.filter(w => w.id !== id))
      if (workspace?.id === id) {
        setWorkspace(workspaces[0] || null)
      }
      return true
    } catch (error) {
      console.error("Error deleting workspace:", error)
      setError("Error eliminando el espacio de trabajo")
      return false
    }
  }

  const inviteMember = async (email: string, role: WorkspaceMember["role"]): Promise<boolean> => {
    if (!workspace || !supabase) return false

    try {
      setLoading(true)
      setError(null)
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Aquí deberíamos enviar un email de invitación
      // Por ahora, solo registramos la invitación en la base de datos
      const { error: inviteError } = await supabase
        .from("workspace_invitations")
        .insert({
          workspace_id: workspace.id,
          email,
          role,
          invited_by: user.id
        })

      if (inviteError) throw inviteError

      return true
    } catch (error) {
      console.error("Error inviting member:", error)
      setError("Error enviando la invitación")
      return false
    }
  }

  const updateMember = async (userId: string, role: WorkspaceMember["role"]): Promise<WorkspaceMember | null> => {
    if (!workspace) return null

    try {
      setError(null)
      const { data: member, error } = await supabase
        .from("workspace_members")
        .update({ role })
        .eq("workspace_id", workspace.id)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) throw error

      setMembers(members.map(m => m.user_id === userId ? member : m))
      return member
    } catch (error) {
      console.error("Error updating member:", error)
      setError("Error actualizando el rol del miembro")
      return null
    }
  }

  const removeMember = async (userId: string): Promise<boolean> => {
    if (!workspace) return false

    try {
      setError(null)
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspace.id)
        .eq("user_id", userId)

      if (error) throw error

      setMembers(members.filter(m => m.user_id !== userId))
      return true
    } catch (error) {
      console.error("Error removing member:", error)
      setError("Error eliminando el miembro del espacio de trabajo")
      return false
    }
  }

  const switchWorkspace = async (workspaceId: number) => {
    const selectedWorkspace = workspaces.find(ws => ws.id === workspaceId)
    if (selectedWorkspace) {
      setWorkspace(selectedWorkspace)
      localStorage.setItem("lastWorkspaceId", workspaceId.toString())
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        workspaces,
        members,
        isLoading,
        error,
        setCurrentWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        inviteMember,
        updateMember,
        removeMember,
        loading,
        switchWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
} 