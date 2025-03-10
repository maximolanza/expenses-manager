export enum AuthProvider {
  FIREBASE = 'firebase',
  SUPABASE = 'supabase'
}

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
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
} 