import type { User as FirebaseUser } from 'firebase/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { AuthUser, FirebaseAuthAdapter, SupabaseAuthAdapter } from './types'

export const firebaseAdapter: FirebaseAuthAdapter = {
  fromFirebase: (firebaseUser: FirebaseUser): AuthUser => ({
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    provider: 'firebase',
  }),
}

export const supabaseAdapter: SupabaseAuthAdapter = {
  fromSupabase: (supabaseUser: SupabaseUser): AuthUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName: supabaseUser.user_metadata?.full_name ?? null,
    photoURL: supabaseUser.user_metadata?.avatar_url ?? null,
    provider: 'supabase',
  }),
} 