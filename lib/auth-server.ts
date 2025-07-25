// lib/auth-server.ts
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

// ---------- verify ----------
export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as UserJwtPayload;
  } catch {
    return null;
  }
}

// ---------- get current session ----------
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as UserJwtPayload;
  } catch {
    return null;
  }
}

// ---------- create session ----------
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

  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  // Host-only cookie: omit Domain entirely
  response.headers.append(
    "Set-Cookie",
    `session=${token}; ` +
      `Path=/; ` +
      `HttpOnly; ` +
      `SameSite=${isProduction ? "None" : "Lax"}; ` +
      `${isProduction ? "Secure; " : ""}` +
      `Max-Age=${60 * 60 * 24 * 7}` // 7 days
  );

  return response;
}

// ---------- logout ----------
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}