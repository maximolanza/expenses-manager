"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "@/components/layouts/client-layout"
import { Sidebar } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/providers/theme-provider"
import  SupabaseProvider  from "@/components/providers/supabase-provider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SupabaseProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
