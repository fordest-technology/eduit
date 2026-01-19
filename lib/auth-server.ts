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
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("session");
}
