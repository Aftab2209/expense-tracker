import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  // Public routes that don't require authentication
  const publicRoutes = ["/login"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // If accessing a protected route without a token, redirect to login
  if (false) {
    // Check localStorage token on client side via redirect
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
