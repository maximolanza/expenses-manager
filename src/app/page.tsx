

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { mainConfig } from "@/config/mainConfig"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StatusCard } from "@/components/ui/status-card"


export default async function Home() {
  const user = false;




  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Navbar */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold">
              Gestor de Gastos
            </Link>
            <Badge variant="secondary" className="font-mono text-xs">
              v{mainConfig.app.version}-beta cerrada
            </Badge>
          </div>
          {/* Solo mostrar el botón de dashboard si el usuario está autenticado */}
          {user ? (
            <nav>
              <Button asChild>
                <Link href="/dashboard">
                  Ir al Dashboard
                </Link>
              </Button>
            </nav>
          ): (
            <nav>
              <Button asChild>
                <Link href="/auth/login">
                  Iniciar sesión
                </Link>
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-24 space-y-8">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="flex justify-center">
              <Badge variant="secondary" className="font-mono">
                Beta Cerrada {mainConfig.app.version}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              Gestor de Gastos
              <span className="block text-xl text-muted-foreground mt-2">
                En desarrollo inicial
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Estamos construyendo una herramienta intuitiva para gestionar tus finanzas personales.
              Actualmente en fase de pruebas cerrada.
            </p>

            {/* Alerta de Acceso Restringido */}
            <Alert variant="destructive" className="mx-auto max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Acceso Restringido</AlertTitle>
              <AlertDescription>
                El acceso a la aplicación está temporalmente limitado a un grupo reducido de usuarios beta.
                No aceptamos nuevos registros en este momento.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Waitlist Section */}
        <section className="bg-muted/50 py-12">
          <div className="container">
            <div className="mx-auto max-w-2xl rounded-lg border p-8 bg-background text-center space-y-4">
              <h2 className="text-2xl font-semibold">Lista de Espera</h2>
              <p className="text-muted-foreground">
                Actualmente nos encontramos en una fase temprana de desarrollo con acceso 
                muy limitado. La lista de espera podría extenderse varios meses.
              </p>
              <div className="space-y-2">
                <Button disabled className="w-full sm:w-auto">
                  Registro no disponible
                </Button>
                <p className="text-sm text-muted-foreground">
                  Volveremos a abrir registros en futuras fases del desarrollo
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Development Status */}
        <section className="container py-24 space-y-8">
          <h2 className="text-2xl font-semibold text-center">
            Estado del Proyecto
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatusCard
              title="Fase Actual"
              items={[
                "Beta cerrada",
                "Pruebas iniciales",
                "Grupo reducido de usuarios",
              ]}
              status="in-progress"
            />
            <StatusCard
              title="Próxima Fase"
              items={[
                "Beta privada",
                "Lista de espera",
                "Acceso por invitación",
              ]}
              status="pending"
            />
            <StatusCard
              title="Fase Final"
              items={[
                "Lanzamiento público",
                "Acceso general",
                "Nuevas funcionalidades",
              ]}
              status="pending"
            />
          </div>
        </section>

        {/* Current Features - Visible solo para usuarios beta */}
        {user && (
          <section className="container py-12">
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Funcionalidades en Prueba</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureCard
                  title="Registro de Gastos"
                  description="Sistema básico de registro y categorización"
                />
                <FeatureCard
                  title="Dashboard"
                  description="Visualización simple de gastos y categorías"
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Gestor de Gastos - Beta Cerrada v{mainConfig.app.version}
            </p>
            <p className="text-xs text-muted-foreground">
              Proyecto en desarrollo inicial · Acceso restringido
            </p>
            <p className="text-xs text-muted-foreground">
              Compilado: {new Date(mainConfig.app.buildDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
              {" · "}
              Entorno: {mainConfig.app.environment}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border p-6 space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
