import type { User as FirebaseUser } from 'firebase/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type AuthProvider = 'firebase' | 'supabase'

export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  provider: AuthProvider
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  provider: AuthProvider
}

export type FirebaseAuthAdapter = {
  fromFirebase: (user: FirebaseUser) => AuthUser
}

export type SupabaseAuthAdapter = {
  fromSupabase: (user: SupabaseUser) => AuthUser
} 