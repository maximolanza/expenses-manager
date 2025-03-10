
import { supabase } from './supabase'

// Función para iniciar sesión
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error al iniciar sesión:', error.message)
    throw error
  }

  console.info('Inicio de sesión exitoso:', data.user)
  return data.user
} 

export const getAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  console.info('Sesión obtenida:', session)
  return { user: session?.user }
}