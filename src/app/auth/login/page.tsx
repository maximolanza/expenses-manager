"use client"

import LoginForm from "@/components/auth/login-form"
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm returnTo={returnTo} />
    </div>
  )
}