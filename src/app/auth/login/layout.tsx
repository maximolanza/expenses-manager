import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar sesión | Expenses Manager",
  description: "Inicia sesión en tu cuenta para gestionar tus gastos.",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No se necesita lógica del servidor aquí

  return children
} 