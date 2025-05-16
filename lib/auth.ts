import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole as PrismaUserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

// In a real app, you would store this in an environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export type UserRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

export interface UserJwtPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  profileImage?: string;
  [key: string]: any;
}

export async function signJwt(payload: UserJwtPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  return token;
}

export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as UserJwtPayload;
  } catch (error) {
    // Keep silent on JWT verification errors
    return null;
  }
}

export async function getSession(context?: unknown) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    const payload = await verifyJwt(token);
    return payload;
  } catch (error) {
    // Only log truly unexpected errors
    console.error("Unexpected error getting session:", error);
    return null;
  }
}

export async function setSessionCookie(response: NextResponse, token: string) {
  const isSecure = process.env.NODE_ENV === "production";
  const sameSite = isSecure ? ("none" as const) : ("lax" as const);

  // Get the domain from environment variable or request
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

  response.cookies.set({
    name: "session",
    value: token,
    httpOnly: true,
    path: "/",
    secure: isSecure,
    sameSite: sameSite,
    maxAge: 60 * 60 * 8, // 8 hours
    domain: cookieDomain, // This will allow the cookie to work across subdomains
  });

  return response;
}

export async function clearSession(response: NextResponse) {
  // Remove the session cookie
  await removeSessionCookie(response);

  // Add cache control headers to prevent caching
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export async function removeSessionCookie(response: NextResponse) {
  const isSecure = process.env.NODE_ENV === "production";
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    path: "/",
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    maxAge: 0,
    domain: cookieDomain, // Make sure to use the same domain when removing
  });

  return response;
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return { authenticated: false, user: null };
  }

  const user = await verifyJwt(token);

  if (!user) {
    return { authenticated: false, user: null };
  }

  // Check if user belongs to the school in the subdomain
  const host = request.headers.get("host") || "";
  const isSubdomain = host.split(".").length > 2;

  if (isSubdomain) {
    const subdomain = host.split(".")[0];
    const school = await prisma.school.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    if (school && user.schoolId !== school.id) {
      return { authenticated: false, user: null };
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { authenticated: true, authorized: false, user };
  }

  return { authenticated: true, authorized: true, user };
}

export async function createSession(userId: string) {
  // Get user information needed for the JWT
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      schoolId: true,
      profileImage: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Convert Prisma's enum to our UserRole type
  const roleMap: Record<PrismaUserRole, UserRole> = {
    [PrismaUserRole.SUPER_ADMIN]: "SUPER_ADMIN",
    [PrismaUserRole.SCHOOL_ADMIN]: "SCHOOL_ADMIN",
    [PrismaUserRole.TEACHER]: "TEACHER",
    [PrismaUserRole.STUDENT]: "STUDENT",
    [PrismaUserRole.PARENT]: "PARENT",
  };

  const role = roleMap[user.role];

  // Create JWT payload
  const payload: UserJwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: role,
    schoolId: user.schoolId || undefined,
    profileImage: user.profileImage || undefined,
  };

  // Sign and return the JWT
  return await signJwt(payload);
}
