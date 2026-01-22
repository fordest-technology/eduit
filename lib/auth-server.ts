// lib/auth-server.ts
// Secure wrapper around lib/auth for server-side usage
import { verifyJwt as verify, signJwt, UserJwtPayload as Payload } from "./auth";
import { UserRole as PrismaUserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export type UserJwtPayload = Payload;

/**
 * Verifies a JWT token
 */
export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
  return verify(token);
}

/**
 * Gets the current session from cookies
 */
export { getSession } from "./auth";

/**
 * Creates a new session and returns a response with the session cookie
 */
export async function createSession(
  user: {
    id: string;
    email: string;
    role: PrismaUserRole;
    schoolId?: string;
    name?: string;
    profileImage?: string;
    permissions?: any;
  },
  requestHost?: string
) {
  // Map Prisma role if needed (though they should align)
  const payload: UserJwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role as any,
    schoolId: user.schoolId,
    profileImage: user.profileImage,
    permissions: user.permissions,
  };

  const token = await signJwt(payload);
  const isProduction = process.env.NODE_ENV === "production";

  const response = new NextResponse(JSON.stringify({ success: true, token }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  // Use standardized cookie setting from lib/auth with host for subdomain support
  const { setSessionCookie } = await import("./auth");
  await setSessionCookie(response, token, requestHost);

  return response;
}

/**
 * Deletes the session cookie
 */
export async function deleteSession() {
  const { cookies, headers } = await import("next/headers");
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Auto-detect cookie domain for subdomains (matching logic in lib/auth.ts)
  let cookieDomain: string | undefined = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  if (!cookieDomain && host) {
    const hostname = host.split(":")[0]; // Remove port
    const parts = hostname.split(".");

    // For localhost/127.0.0.1, DO NOT set domain - let browser handle it
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

    if (!isLocalhost && parts.length > 2) {
      // For production subdomains like zed.eduit.com, set domain to .eduit.com
      cookieDomain = `.${parts.slice(-2).join(".")}`;
    }
  }

  // Delete the session cookie with the correct options
  if (cookieDomain) {
    cookieStore.delete({
      name: "session",
      path: "/",
      domain: cookieDomain,
    });
  } else {
    cookieStore.delete({
      name: "session",
      path: "/",
    });
  }
}
