import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Navbar({ className }: { className?: string }) {
  return (
    <nav className={cn("bg-white shadow-sm", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">💰 ExpenseManager</span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/signup"
              className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 