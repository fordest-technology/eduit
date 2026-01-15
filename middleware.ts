import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./lib/auth-server";

// ------------- route lists -------------
const authRequiredPaths = ["/dashboard"];
const authRedirectPaths = ["/login", "/register"];
const publicPaths = [
  "/api/public/schools",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/webhooks",
  "/api/payments/webhook",
  "/login",
  "/register",
  "/",
  "/_next",
  "/static",
  "/favicon.ico",
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

  // --- CORS pre-flight ---
  if (request.method === "OPTIONS") {
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

  // --- CORS headers on normal responses ---
  const response = NextResponse.next();
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

  // --- auth checks ---
  const sessionToken = request.cookies.get("session")?.value;
  const user = sessionToken ? await verifyJwt(sessionToken) : null;

  const isPublic = publicPaths.some((p) => path.startsWith(p));

  // API routes
  if (path.startsWith("/api")) {
    if (isPublic) return response;
    if (!user)
      return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-role", user.role);
    if (user.schoolId) response.headers.set("x-school-id", user.schoolId);
    return response;
  }

  // Non-API routes
  if (user && authRedirectPaths.includes(path))
    return NextResponse.redirect(new URL("/dashboard", request.url));

  if (!user && authRequiredPaths.some((p) => path.startsWith(p)))
    return NextResponse.redirect(new URL("/login", request.url));

  return response;
}

// ------------- matcher -------------
export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};