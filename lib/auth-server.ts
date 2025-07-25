import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole as PrismaUserRole } from "@prisma/client";

export type UserJwtPayload = JWTPayload & {
  id: string;
  email: string;
  role: PrismaUserRole;
  schoolId?: string;
  [key: string]: unknown;
};

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Verify a JWT token
 * @param token The JWT token to verify
 * @returns The decoded payload or null if verification fails
 */
export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as UserJwtPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      id: string;
      email: string;
      role: PrismaUserRole;
    };
  } catch (error) {
    return null;
  }
}

export async function createSession(user: {
  id: string;
  email: string;
  role: PrismaUserRole;
  schoolId?: string;
}) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? ".eduit.com" : undefined; // Replace with your production domain
  
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Set the cookie in the response headers
  response.headers.append(
    'Set-Cookie',
    `session=${token}; ` +
    `Path=/; ` +
    `HttpOnly; ` +
    `SameSite=${isProduction ? 'None' : 'Lax'}; ` +
    `${isProduction ? 'Secure;' : ''} ` +
    `${domain ? `Domain=${domain};` : ''} ` +
    `Max-Age=${60 * 60 * 24 * 7}` // 7 days
  );

  return response;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
