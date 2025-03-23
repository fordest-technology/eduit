// Create a new middleware file to handle authentication redirects
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which paths require authentication
const authRequiredPaths = ["/dashboard"];
// Define which paths should redirect to dashboard if already authenticated
const authRedirectPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Get the session token from cookies
  const token = request.cookies.get("session")?.value;

  // Handle API routes with CORS headers
  if (request.nextUrl.pathname.startsWith("/api")) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // CORS headers
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Origin",
      request.headers.get("origin") || "*"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,DELETE,PATCH,POST,PUT"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    return response;
  }

  // Authentication redirects for non-API routes
  // If there's no session and the user is trying to access a protected route
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If there's a session and the user is trying to access login/register
  if (
    token &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/api/:path*"],
};
