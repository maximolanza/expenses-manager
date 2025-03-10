import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { mainConfig } from './config/mainConfig'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si no hay sesión y no está en login/register, redirigir a login
  if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Si hay sesión y está en login/register, redirigir a dashboard
  if (session && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Si hay sesión, verificar si tiene workspaces
  if (session && !request.nextUrl.pathname.startsWith("/onboarding")) {
    const { data: workspaces } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", session.user.id)

    // Si no tiene workspaces y no está en onboarding, redirigir a onboarding
    if (!workspaces?.length) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return res
}

// Configure which routes should be handled by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
} 