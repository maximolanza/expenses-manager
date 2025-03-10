"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthForm } from "@/components/auth/auth-form"

export default function AuthPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    console.log({moment: "Auth page",user, loading});
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <AuthForm />
      </div>
    </div>
  )
}
