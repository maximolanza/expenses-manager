"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import SupabaseProvider from "@/components/providers/supabase-provider"
import { WorkspaceProvider } from "@/components/providers/workspace-provider"
import { Toaster } from "sonner"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SupabaseProvider>
        <WorkspaceProvider>
          {children}
          <Toaster />
        </WorkspaceProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
} 