import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./lib/auth-server";
import { SECURITY_HEADERS } from "./lib/security";

// ------------- route lists -------------
const authRequiredPaths = ["/dashboard"];
const authRedirectPaths = ["/login", "/register"];
const publicPaths = [
  "/api/public/",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/webhooks",
  "/api/payments/webhook",
  "/api/schools/register",
  "/api/auth/reset-password",
  "/api/auth/verify-code",
  "/api/auth/confirm-reset",
  "/api/waitlist",
];

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://eduit.com",
];

// ------------- middleware -------------
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const origin = request.headers.get("origin");
  const requestHeaders = new Headers(request.headers);

  // --- Security Headers ---
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    requestHeaders.set(key, value);
  });

  // --- CORS pre-flight ---
  if (request.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          ...SECURITY_HEADERS,
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    return new NextResponse(null, { status: 403, headers: SECURITY_HEADERS });
  }

  // --- auth checks ---
  const sessionToken = request.cookies.get("session")?.value;
  const user = sessionToken ? await verifyJwt(sessionToken) : null;

  const isPublic = publicPaths.some((p) => path.startsWith(p)) || 
                  path === "/" || path === "/login" || path === "/register" || path === "/forgot-password" ||
                  path.startsWith("/_next") || path.startsWith("/static") || path === "/favicon.ico";

  // API routes
  if (path.startsWith("/api")) {
    if (!isPublic && !user) {
      return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (user) {
      requestHeaders.set("x-user-id", user.id);
      requestHeaders.set("x-user-role", user.role);
      if (user.schoolId) requestHeaders.set("x-school-id", user.schoolId);
    }
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add CORS headers to normal API responses
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    
    // Add Security Headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Non-API routes
  if (user && authRedirectPaths.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && authRequiredPaths.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Add Security Headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ------------- matcher -------------
export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};