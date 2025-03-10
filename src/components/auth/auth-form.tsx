"use client"

import React, { useState } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthHandler } from "@/hooks/use-auth-handler"
import { login } from '@/lib/auth'

const authSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().optional(),
})

type AuthFormData = z.infer<typeof authSchema>

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const { loading, error, signIn, signUp } = useAuthHandler()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  })

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isSignUp) {
        await signUp(data.email, data.password, data.fullName || "")
      } else {
        await signIn(data.email, data.password)
      }
    } catch (err) {
      if (err instanceof Error) {
        setSignUpError(err.message)
      } else {
        setSignUpError("Error desconocido")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')
    try {
      await login(email, password)
      // Handle successful login (e.g., redirect or update state)
    } catch (err) {
      if (err instanceof Error) {
        setSignUpError(err.message);
      } else {
        setSignUpError("Error desconocido"); // Fallback for unknown error types
      }
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignUp
            ? "Ingresa tus datos para crear una cuenta"
            : "Ingresa tus credenciales para acceder"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {isSignUp && (
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Nombre completo
            </label>
            <input
              type="text"
              {...form.register("fullName")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>
        )}

        {signUpError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {signUpError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : isSignUp ? (
            "Crear cuenta"
          ) : (
            "Iniciar sesión"
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-muted-foreground hover:underline"
        >
          {isSignUp
            ? "¿Ya tienes una cuenta? Inicia sesión"
            : "¿No tienes una cuenta? Regístrate"}
        </button>
      </form>
    </div>
  )
} 