"use client"

import { Sidebar } from "@/components/ui/sidebar"
import { WorkspaceProvider } from "@/components/providers/workspace-provider"
import SupabaseProvider from "@/components/providers/supabase-provider"
import Navbar from "@/components/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider>
      <WorkspaceProvider>
        <div className="relative flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pl-64">
            <Navbar />
            <div className="container p-6">
              {children}
            </div>
          </main>
        </div>
      </WorkspaceProvider>
    </SupabaseProvider>
  )
} 