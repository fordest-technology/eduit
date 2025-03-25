// Create a new middleware file to handle authentication redirects
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSchoolIdFromSubdomain } from "./lib/subdomain";
import { verifyJwt } from "./lib/auth";

// Define which paths require authentication
const authRequiredPaths = ["/dashboard"];
// Define which paths should redirect to dashboard if already authenticated
const authRedirectPaths = ["/login", "/register"];
// Define public paths that don't require authentication
const publicPaths = [
  "/api/public/schools",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/webhooks",
  "/login",
  "/register",
  "/",
  "/_next",
  "/static",
  "/favicon.ico",
];

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://eduit.com",
  // Add your production domains here
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = request.headers.get("host") || "";
  const isLocalhost = host.includes("localhost");

  // Extract subdomain and domain parts
  const hostParts = host.split(".");
  const isSubdomain = isLocalhost ? hostParts.length > 2 : hostParts.length > 2;
  const subdomain = isSubdomain ? hostParts[0] : null;

  // Get session token
  const sessionToken = request.cookies.get("session")?.value;
  const user = sessionToken ? await verifyJwt(sessionToken) : null;

  // Create response with cloned headers
  const response = NextResponse.next();

  // Handle subdomain context
  if (subdomain) {
    const schoolId = await getSchoolIdFromSubdomain(subdomain);
    if (schoolId) {
      response.headers.set("x-school-id", schoolId);
    }
  }

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");

    // Check if the origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    return new NextResponse(null, { status: 403 });
  }

  // Add CORS headers to all responses
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some((p) => path.startsWith(p));

  // Handle non-API routes
  if (!path.startsWith("/api")) {
    // If authenticated and trying to access login/register
    if (user && authRedirectPaths.includes(path)) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // If not authenticated and trying to access protected route
    if (!user && authRequiredPaths.some((p) => path.startsWith(p))) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // Handle API routes
  if (path.startsWith("/api")) {
    // Allow public API routes
    if (isPublicPath) {
      return response;
    }

    // For protected API routes, verify authentication
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add user info to headers
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-role", user.role);
    if (user.schoolId) {
      response.headers.set("x-school-id", user.schoolId);
    }

    return response;
  }

  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
