// Create a new middleware file to handle authentication redirects
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJwt } from "./lib/auth"

// Define which paths require authentication
const authRequiredPaths = ["/dashboard"]
// Define which paths should redirect to dashboard if already authenticated
const authRedirectPaths = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Get the session token from cookies
  const token = request.cookies.get("session")?.value

  // Check if the user is authenticated
  const isAuthenticated = token ? await verifyJwt(token) : null

  // If the path requires authentication and the user is not authenticated, redirect to login
  if (authRequiredPaths.some((p) => path.startsWith(p)) && !isAuthenticated) {
    const url = new URL("/login", request.url)
    url.searchParams.set("from", path)
    return NextResponse.redirect(url)
  }

  // If the user is already authenticated and tries to access login or register, redirect to dashboard
  if (authRedirectPaths.some((p) => path === p) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}

